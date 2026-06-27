import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, jobsTable, productsTable, reportsTable,
  applicationsTable, conversationParticipantsTable,
  freelancerProfilesTable
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";

const router = Router();

router.get("/admin", requireAdmin, async (req, res) => {
  const [
    totalUsers, totalJobs, totalProducts, totalReports,
    activeJobs, suspendedUsers,
    freelancers, clients, sellers,
    recentUsers, recentJobs
  ] = await Promise.all([
    db.$count(usersTable),
    db.$count(jobsTable),
    db.$count(productsTable),
    db.$count(reportsTable),
    db.$count(jobsTable, eq(jobsTable.status, "open")),
    db.$count(usersTable, eq(usersTable.status, "suspended")),
    db.$count(usersTable, eq(usersTable.role, "freelancer")),
    db.$count(usersTable, eq(usersTable.role, "client")),
    db.$count(usersTable, eq(usersTable.role, "seller")),
    db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(5),
    db.select().from(jobsTable).orderBy(desc(jobsTable.createdAt)).limit(5),
  ]);

  const recentActivity = [
    ...recentUsers.map(u => ({ type: "user_registered", description: `${u.name} joined as ${u.role}`, createdAt: u.createdAt.toISOString() })),
    ...recentJobs.map(j => ({ type: "job_posted", description: `Job posted: ${j.title}`, createdAt: j.createdAt.toISOString() })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

  res.json({
    totalUsers: Number(totalUsers),
    totalJobs: Number(totalJobs),
    totalProducts: Number(totalProducts),
    totalReports: Number(totalReports),
    activeJobs: Number(activeJobs),
    suspendedUsers: Number(suspendedUsers),
    usersByRole: {
      freelancers: Number(freelancers),
      clients: Number(clients),
      sellers: Number(sellers),
    },
    recentActivity,
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const userId = req.session!.userId!;
  const role = req.session!.role;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const myParts = await db.select().from(conversationParticipantsTable)
    .where(eq(conversationParticipantsTable.userId, userId));
  const unreadMessages = myParts.reduce((sum, p) => sum + p.unreadCount, 0);

  let completedJobs: number | null = null;
  let activeApplications: number | null = null;
  let postedJobs: number | null = null;
  let listedProducts: number | null = null;
  let trustLabel: string | null = null;

  if (role === "freelancer") {
    const [profile] = await db.select().from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, userId)).limit(1);
    completedJobs = profile?.completedJobs ?? 0;
    const apps = await db.select().from(applicationsTable).where(
      and(eq(applicationsTable.freelancerId, userId), eq(applicationsTable.status, "pending"))
    );
    activeApplications = apps.length;
    if (user.averageRating && user.averageRating >= 4.5 && (completedJobs ?? 0) >= 10) trustLabel = "Trusted Freelancer";
    else if (user.averageRating && user.averageRating < 3.0 && user.reviewCount > 2) trustLabel = "Low Trust";
  } else if (role === "client") {
    const jobs = await db.select().from(jobsTable).where(eq(jobsTable.clientId, userId));
    postedJobs = jobs.length;
  } else if (role === "seller") {
    const prods = await db.select().from(productsTable).where(eq(productsTable.sellerId, userId));
    listedProducts = prods.length;
    if (user.averageRating && user.averageRating >= 4.5 && listedProducts >= 5) trustLabel = "Verified Seller";
  }

  res.json({
    reviewCount: user.reviewCount,
    averageRating: user.averageRating ?? null,
    completedJobs,
    activeApplications,
    postedJobs,
    listedProducts,
    unreadMessages,
    trustLabel,
  });
});

router.get("/top-freelancers", async (req, res) => {
  const limit = Math.min(20, parseInt((req.query["limit"] as string) || "6"));
  const profiles = await db.select().from(freelancerProfilesTable).limit(limit);

  const built = await Promise.all(profiles.map(async (profile) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, profile.userId)).limit(1);
    if (!user) return null;
    const { passwordHash: _ph, suspendReason: _sr, ...safeUser } = user;
    const trustLabel = safeUser.averageRating && safeUser.averageRating >= 4.5 && profile.completedJobs >= 10
      ? "Trusted Freelancer" : null;
    return { ...profile, user: safeUser, trustLabel };
  }));

  res.json(built.filter(Boolean));
});

router.get("/featured-jobs", async (req, res) => {
  const limit = Math.min(20, parseInt((req.query["limit"] as string) || "6"));
  const jobs = await db.select().from(jobsTable)
    .where(eq(jobsTable.status, "open"))
    .orderBy(desc(jobsTable.createdAt))
    .limit(limit);

  const built = await Promise.all(jobs.map(async (job) => {
    const [client] = await db.select().from(usersTable).where(eq(usersTable.id, job.clientId)).limit(1);
    if (!client) return null;
    const { passwordHash: _ph, suspendReason: _sr, ...safeClient } = client;
    return { ...job, client: safeClient };
  }));

  res.json(built.filter(Boolean));
});

router.get("/featured-products", async (req, res) => {
  const limit = Math.min(20, parseInt((req.query["limit"] as string) || "8"));
  const products = await db.select().from(productsTable)
    .where(eq(productsTable.status, "available"))
    .orderBy(desc(productsTable.createdAt))
    .limit(limit);

  const built = await Promise.all(products.map(async (product) => {
    const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, product.sellerId)).limit(1);
    if (!seller) return null;
    const { passwordHash: _ph, suspendReason: _sr, ...safeSeller } = seller;
    return { ...product, seller: safeSeller };
  }));

  res.json(built.filter(Boolean));
});

export default router;
