import { pgTable, serial, text, timestamp, integer, real, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const verificationStatusEnum = pgEnum("verification_status", ["unverified", "pending", "verified"]);

export const freelancerProfilesTable = pgTable("freelancer_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  bio: text("bio"),
  skills: json("skills").$type<string[]>().notNull().default([]),
  location: text("location").notNull().default(""),
  experience: text("experience"),
  hourlyRate: real("hourly_rate"),
  projectRate: real("project_rate"),
  portfolioItems: json("portfolio_items").$type<Array<{
    id: number; title: string; description?: string; imageUrl?: string; link?: string;
  }>>().notNull().default([]),
  completedJobs: integer("completed_jobs").notNull().default(0),
  verificationStatus: verificationStatusEnum("verification_status").notNull().default("unverified"),
  trustLabel: text("trust_label"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const clientProfilesTable = pgTable("client_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  businessName: text("business_name"),
  description: text("description"),
  location: text("location").notNull().default(""),
  logoUrl: text("logo_url"),
  postedJobsCount: integer("posted_jobs_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFreelancerProfileSchema = createInsertSchema(freelancerProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFreelancerProfile = z.infer<typeof insertFreelancerProfileSchema>;
export type FreelancerProfile = typeof freelancerProfilesTable.$inferSelect;

export const insertClientProfileSchema = createInsertSchema(clientProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertClientProfile = z.infer<typeof insertClientProfileSchema>;
export type ClientProfile = typeof clientProfilesTable.$inferSelect;
