import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roles = ["super_admin", "admin", "user"] as const;
export const pcTypes = ["Server", "Mini Server", "Terminal"] as const;

export const establishments = pgTable("establishments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: roles }).notNull().default("user"),
  establishmentId: integer("establishment_id").references(() => establishments.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pcs = pgTable("pcs", {
  id: serial("id").primaryKey(),
  establishmentId: integer("establishment_id").references(() => establishments.id).notNull(),
  type: text("type", { enum: pcTypes }).notNull(),
  ipAddress: text("ip_address").notNull(),
  isIpFiltered: boolean("is_ip_filtered").default(false),
  macAddress: text("mac_address"),
  officeName: text("office_name"),
  usersInfo: text("users_info"), // Storing as formatted text for simplicity
  installedApps: text("installed_apps"),
  hasWindows: boolean("has_windows").default(false),
  hasWindowsLicense: boolean("has_windows_license").default(false),
  hasOffice: boolean("has_office").default(false),
  hasOfficeLicense: boolean("has_office_license").default(false),
  hasAntivirus: boolean("has_antivirus").default(false),
  antivirusName: text("antivirus_name"),
  serverServices: text("server_services"), // For servers
  createdAt: timestamp("created_at").defaultNow(),
});

export const establishmentRelations = relations(establishments, ({ many }) => ({
  users: many(users),
  pcs: many(pcs),
}));

export const userRelations = relations(users, ({ one }) => ({
  establishment: one(establishments, {
    fields: [users.establishmentId],
    references: [establishments.id],
  }),
}));

export const pcRelations = relations(pcs, ({ one }) => ({
  establishment: one(establishments, {
    fields: [pcs.establishmentId],
    references: [establishments.id],
  }),
}));

// Schemas
export const insertEstablishmentSchema = createInsertSchema(establishments).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertPcSchema = createInsertSchema(pcs).omit({ id: true, createdAt: true });

// Types
export type Establishment = typeof establishments.$inferSelect;
export type InsertEstablishment = z.infer<typeof insertEstablishmentSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PC = typeof pcs.$inferSelect;
export type InsertPC = z.infer<typeof insertPcSchema>;

export type LoginRequest = {
  username: string;
  password: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type StatsResponse = {
  establishmentId: number;
  establishmentName: string;
  totalPcs: number;
  protectedPcs: number;
  windowsLicensed: number;
  officeLicensed: number;
  serverCount: number;
  filteredIpCount: number;
};
