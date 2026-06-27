import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, freelancerProfilesTable } from "@workspace/db";
import { eq, ilike, and, gte, lte, SQL } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { UpsertFreelancerProfileBody } from "@workspace/api-zod";

const router = Router();

function computeTrustLabel(rating: number | null, completedJobs: number): string | null {
  if (!rating) return null;
  if (rating >= 4.5 && completedJobs >= 10) return "Trusted Freelancer";
  if (rating < 3.0 && completedJobs > 2) return "Low Trust";
  return null;
}

async function buildFreelancerResponse(profile: typeof freelancerProfilesTable.$inferSelect) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, profile.userId)).limit(1);
  if (!user) return null;
  const { passwordHash: _ph, suspendReason: _sr, ...safeUser } = user;
  return {
    ...profile,
    user: safeUser,
    trustLabel: computeTrustLabel(safeUser.averageRating, profile.completedJobs),
  };
}

router.get("/", async (req, res) => {
  const { location, minRate, maxRate, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, parseInt(limit) || 20);
  const offset = (pageNum - 1) * limitNum;

  const conditions: SQL[] = [];
  if (location) conditions.push(ilike(freelancerProfilesTable.location, `%${location}%`));
  if (minRate) conditions.push(gte(freelancerProfilesTable.hourlyRate, parseFloat(minRate)));
  if (maxRate) conditions.push(lte(freelancerProfilesTable.hourlyRate, parseFloat(maxRate)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [profiles, total] = await Promise.all([
    db.select().from(freelancerProfilesTable).where(where).limit(limitNum).offset(offset),
    db.$count(freelancerProfilesTable, where),
  ]);

  const freelancers = await Promise.all(profiles.map(buildFreelancerResponse));
  res.json({ freelancers: freelancers.filter(Boolean), total: Number(total) });
});

router.get("/me", requireAuth, async (req, res) => {
  const userId = req.session!.userId!;
  const [profile] = await db.select().from(freelancerProfilesTable)
    .where(eq(freelancerProfilesTable.userId, userId)).limit(1);
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }
  res.json(await buildFreelancerResponse(profile));
});

router.put("/me", requireAuth, async (req, res) => {
  const parsed = UpsertFreelancerProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const userId = req.session!.userId!;
  const existing = await db.select().from(freelancerProfilesTable)
    .where(eq(freelancerProfilesTable.userId, userId)).limit(1);

  const portfolioItems = (parsed.data.portfolioItems ?? []).map((p, i) => ({ ...p, id: i + 1 }));
  const data = { ...parsed.data, portfolioItems, updatedAt: new Date() };

  let profile: typeof freelancerProfilesTable.$inferSelect;
  if (existing.length > 0) {
    [profile] = await db.update(freelancerProfilesTable)
      .set(data)
      .where(eq(freelancerProfilesTable.userId, userId))
      .returning();
  } else {
    [profile] = await db.insert(freelancerProfilesTable)
      .values({ userId, ...data })
      .returning();
  }

  res.json(await buildFreelancerResponse(profile));
});

router.get("/:userId", async (req, res) => {
  const userId = parseInt(req.params["userId"] as string);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [profile] = await db.select().from(freelancerProfilesTable)
    .where(eq(freelancerProfilesTable.userId, userId)).limit(1);
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }
  res.json(await buildFreelancerResponse(profile));
});

export default router;
