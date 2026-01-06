import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, type User } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const MemoryStore = createMemoryStore(session);
  
  app.use(session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000 
    }),
    cookie: { secure: process.env.NODE_ENV === "production" }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) return done(null, false);
      const isValid = await comparePasswords(password, user.password);
      if (!isValid) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth Middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Unauthorized" });
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && (req.user.role === 'admin' || req.user.role === 'super_admin')) return next();
    res.status(403).json({ message: "Forbidden" });
  };

  const requireSuperAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.role === 'super_admin') return next();
    res.status(403).json({ message: "Forbidden" });
  };

  // --- Auth Routes ---
  
  app.post(api.auth.login.path, passport.authenticate('local'), (req, res) => {
    res.json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, requireAuth, (req, res) => {
    res.json(req.user);
  });

  app.post(api.auth.changePassword.path, requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await storage.getUser((req.user as any).id);
      const isValid = await comparePasswords(currentPassword, user!.password);
      if (!isValid) return res.status(400).json({ message: "Incorrect current password" });
      
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(user!.id, { password: hashedPassword });
      res.json({ message: "Password updated" });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Users ---

  app.post(api.users.create.path, requireAdmin, async (req, res) => {
    try {
      // Only super_admin can create admins. Admins can create users? 
      // Requirement: "Admin creates Admins of each establishment". Actually implies Super Admin creates Admins.
      // And "Admin of each establishment...". 
      // Let's allow Super Admin to create anyone.
      // Admin can create users for their establishment.
      
      if (req.user!.role !== 'super_admin' && req.body.role === 'super_admin') {
         return res.status(403).json({ message: "Cannot create super admin" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({ ...req.body, password: hashedPassword });
      res.status(201).json(user);
    } catch (err) {
       res.status(400).json({ message: "Username likely taken" });
    }
  });

  app.get(api.users.list.path, requireAdmin, async (req, res) => {
    const users = await storage.getUsers();
    // Filter if needed. Super Admin sees all. Admin sees only their establishment?
    // Requirement says "Admin creates Admins of each establishment" - likely Super Admin action.
    // "Users of each establishment can change password".
    if (req.user!.role === 'super_admin') {
      res.json(users);
    } else {
      res.json(users.filter(u => u.establishmentId === (req.user as any).establishmentId));
    }
  });

  app.put(api.users.update.path, requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getUser(id);
      if (!existing) return res.status(404).json({ message: "User not found" });
      
      if ((req.user as any).role !== 'super_admin' && existing.establishmentId !== (req.user as any).establishmentId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updates = { ...req.body };
      delete updates.id; // Ensure we don't try to update the ID
      
      if (updates.password) {
        updates.password = await hashPassword(updates.password);
      }

      const updated = await storage.updateUser(id, updates);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Failed to update user" });
    }
  });

  app.delete(api.users.delete.path, requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getUser(id);
      if (!existing) return res.status(404).json({ message: "User not found" });
      
      // Permission check: super_admin can delete anyone. admin can only delete users in their establishment.
      if ((req.user as any).role !== 'super_admin' && existing.establishmentId !== (req.user as any).establishmentId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteUser(id);
      res.status(204).end();
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Failed to delete user" });
    }
  });

  // --- Establishments ---

  app.get(api.establishments.list.path, requireAuth, async (req, res) => {
    const data = await storage.getEstablishments();
    res.json(data);
  });

  app.post(api.establishments.create.path, requireSuperAdmin, async (req, res) => {
    try {
      const data = await storage.createEstablishment(req.body);
      res.status(201).json(data);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Failed to create establishment" });
    }
  });

  app.put(api.establishments.update.path, requireSuperAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getEstablishment(id);
      if (!existing) return res.status(404).json({ message: "Establishment not found" });
      
      const updated = await storage.updateEstablishment(id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Failed to update establishment" });
    }
  });

  app.delete(api.establishments.delete.path, requireSuperAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      console.log(`Attempting to delete establishment ${id}`);
      const existing = await storage.getEstablishment(id);
      if (!existing) return res.status(404).json({ message: "Establishment not found" });
      
      await storage.deleteEstablishment(id);
      console.log(`Establishment ${id} deleted successfully`);
      res.status(204).end();
    } catch (err: any) {
      console.error(`Error deleting establishment:`, err);
      res.status(400).json({ message: err.message || "Failed to delete establishment (it may have users or computers linked)" });
    }
  });

  // --- PCs ---

  app.get(api.pcs.list.path, requireAuth, async (req, res) => {
    // If super_admin, can see all or filter by query param
    // If admin, see only own.
    // If user, maybe see only own? Or none? "Admin ... see all PC". 
    // "User ... can change password". Doesn't explicitly say user can view PCs.
    // But "Users can Export data to Excel" -> implies they can see data.
    
    let establishmentId = (req.user as any).establishmentId;
    if (req.user!.role === 'super_admin') {
       // If query param provided, use it
       if (req.query.establishmentId) {
         establishmentId = Number(req.query.establishmentId);
       } else {
         establishmentId = undefined; // All
       }
    }
    
    const pcs = await storage.getPcs(establishmentId);
    res.json(pcs);
  });

  app.post(api.pcs.create.path, requireAdmin, async (req, res) => {
    // Enforce establishment ID for non-super-admins
    let pcData = req.body;
    if ((req.user as any).role !== 'super_admin') {
      pcData = { ...pcData, establishmentId: (req.user as any).establishmentId! };
    }
    const pc = await storage.createPc(pcData);
    res.status(201).json(pc);
  });

  app.put(api.pcs.update.path, requireAdmin, async (req, res) => {
    // Check ownership if not super admin
    const id = Number(req.params.id);
    const existing = await storage.getPc(id);
    if (!existing) return res.status(404).json({ message: "PC not found" });
    
    if (req.user!.role !== 'super_admin' && existing.establishmentId !== req.user!.establishmentId) {
       return res.status(403).json({ message: "Forbidden" });
    }
    
    const updated = await storage.updatePc(id, req.body);
    res.json(updated);
  });

  app.delete(api.pcs.delete.path, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getPc(id);
    if (!existing) return res.status(404).json({ message: "PC not found" });
    
    if (req.user!.role !== 'super_admin' && existing.establishmentId !== req.user!.establishmentId) {
       return res.status(403).json({ message: "Forbidden" });
    }
    
    await storage.deletePc(id);
    res.status(204).end();
  });

  // --- Stats ---
  
  app.get(api.stats.get.path, requireAuth, async (req, res) => {
    const stats = await storage.getStats();
    if (req.user!.role === 'super_admin') {
      res.json(stats);
    } else {
      res.json(stats.filter(s => s.establishmentId === (req.user as any).establishmentId));
    }
  });

  // --- Seeding ---
  if (process.env.NODE_ENV !== 'production') {
    const existingUsers = await storage.getUsers();
    if (existingUsers.length === 0) {
      console.log("Seeding database...");
      // Create establishments
      const est1 = await storage.createEstablishment({ name: "Headquarters" });
      const est2 = await storage.createEstablishment({ name: "Branch Office" });

      // Create users
      const adminPass = await hashPassword("admin123");
      const userPass = await hashPassword("user123");
      
      await storage.createUser({ 
        username: "superadmin", 
        password: adminPass, 
        role: "super_admin" 
      });
      
      await storage.createUser({ 
        username: "admin_hq", 
        password: adminPass, 
        role: "admin",
        establishmentId: est1.id
      });

      await storage.createUser({ 
        username: "user_hq", 
        password: userPass, 
        role: "user",
        establishmentId: est1.id
      });
      
      // Create PCs
      await storage.createPc({
        establishmentId: est1.id,
        type: "Server",
        ipAddress: "192.168.1.10",
        isIpFiltered: true,
        macAddress: "AA:BB:CC:DD:EE:FF",
        officeName: "Server Room",
        usersInfo: "IT Admin",
        installedApps: "IIS, SQL Server",
        hasWindows: true,
        hasWindowsLicense: true,
        hasAntivirus: true,
        antivirusName: "Defender",
        serverServices: "Web, DB, File Share"
      });
      
       await storage.createPc({
        establishmentId: est1.id,
        type: "Terminal",
        ipAddress: "192.168.1.50",
        officeName: "Reception",
        usersInfo: "Receptionist",
        hasWindows: true,
        hasWindowsLicense: true,
        hasOffice: true,
        hasOfficeLicense: true
      });
    }
  }

  return httpServer;
}
