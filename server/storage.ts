import { db } from "./db";
import {
  users, establishments, pcs,
  type User, type InsertUser,
  type Establishment, type InsertEstablishment,
  type PC, type InsertPC, type StatsResponse
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<User>): Promise<User>;

  // Establishments
  getEstablishments(): Promise<Establishment[]>;
  getEstablishment(id: number): Promise<Establishment | undefined>;
  createEstablishment(establishment: InsertEstablishment): Promise<Establishment>;

  // PCs
  getPcs(establishmentId?: number): Promise<PC[]>;
  getPc(id: number): Promise<PC | undefined>;
  createPc(pc: InsertPC): Promise<PC>;
  updatePc(id: number, pc: Partial<InsertPC>): Promise<PC>;
  deletePc(id: number): Promise<void>;

  // Stats
  getStats(): Promise<StatsResponse[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getEstablishments(): Promise<Establishment[]> {
    return await db.select().from(establishments);
  }

  async getEstablishment(id: number): Promise<Establishment | undefined> {
    const [establishment] = await db.select().from(establishments).where(eq(establishments.id, id));
    return establishment;
  }

  async createEstablishment(establishment: InsertEstablishment): Promise<Establishment> {
    const [newEst] = await db.insert(establishments).values(establishment).returning();
    return newEst;
  }

  async getPcs(establishmentId?: number): Promise<PC[]> {
    if (establishmentId) {
      return await db.select().from(pcs).where(eq(pcs.establishmentId, establishmentId));
    }
    return await db.select().from(pcs);
  }

  async getPc(id: number): Promise<PC | undefined> {
    const [pc] = await db.select().from(pcs).where(eq(pcs.id, id));
    return pc;
  }

  async createPc(pc: InsertPC): Promise<PC> {
    const [newPc] = await db.insert(pcs).values(pc).returning();
    return newPc;
  }

  async updatePc(id: number, updates: Partial<InsertPC>): Promise<PC> {
    const [updatedPc] = await db.update(pcs).set(updates).where(eq(pcs.id, id)).returning();
    return updatedPc;
  }

  async deletePc(id: number): Promise<void> {
    await db.delete(pcs).where(eq(pcs.id, id));
  }

  async getStats(): Promise<StatsResponse[]> {
    // This is a complex query, we can do it in memory for MVP or use raw SQL.
    // For simplicity/safety with Drizzle, let's fetch data and aggregate or query per establishment.
    // Let's use a query builder approach to group by establishment.
    
    // To keep it simple and type-safe, I'll fetch establishments and aggregate counts.
    const allEstablishments = await this.getEstablishments();
    const stats: StatsResponse[] = [];

    for (const est of allEstablishments) {
      const estPcs = await db.select().from(pcs).where(eq(pcs.establishmentId, est.id));
      
      stats.push({
        establishmentId: est.id,
        establishmentName: est.name,
        totalPcs: estPcs.length,
        protectedPcs: estPcs.filter(p => p.hasAntivirus).length,
        windowsLicensed: estPcs.filter(p => p.hasWindowsLicense).length,
        officeLicensed: estPcs.filter(p => p.hasOfficeLicense).length,
        serverCount: estPcs.filter(p => p.type === 'Server' || p.type === 'Mini Server').length,
        filteredIpCount: estPcs.filter(p => p.isIpFiltered).length,
      });
    }
    return stats;
  }
}

export const storage = new DatabaseStorage();
