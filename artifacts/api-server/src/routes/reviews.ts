import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, reviewsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { CreateReviewBody } from "@workspace/api-zod";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const { revieweeId, rating, comment } = parsed.data;
  if (rating < 1 || rating > 5) { res.status(400).json({ error: "Rating must be 1-5" }); return; }

  const [review] = await db.insert(reviewsTable).values({
    reviewerId: req.session!.userId!,
    revieweeId,
    rating,
    comment: comment ?? null,
  }).returning();

  const allReviews = await db.select({ rating: reviewsTable.rating })
    .from(reviewsTable).where(eq(reviewsTable.revieweeId, revieweeId));
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  await db.update(usersTable).set({
    averageRating: avgRating,
    reviewCount: allReviews.length,
    updatedAt: new Date(),
  }).where(eq(usersTable.id, revieweeId));

  const [reviewer] = await db.select().from(usersTable).where(eq(usersTable.id, req.session!.userId!)).limit(1);
  const { passwordHash: _ph, suspendReason: _sr, ...safeReviewer } = reviewer!;

  res.status(201).json({ ...review, reviewer: safeReviewer });
});

router.get("/user/:userId", async (req, res) => {
  const userId = parseInt(req.params["userId"] as string);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const reviews = await db.select().from(reviewsTable)
    .where(eq(reviewsTable.revieweeId, userId))
    .orderBy(reviewsTable.createdAt);

  const withReviewers = await Promise.all(
    reviews.map(async (r) => {
      const [reviewer] = await db.select().from(usersTable).where(eq(usersTable.id, r.reviewerId)).limit(1);
      if (!reviewer) return null;
      const { passwordHash: _ph, suspendReason: _sr, ...safeReviewer } = reviewer;
      return { ...r, reviewer: safeReviewer };
    })
  );

  res.json(withReviewers.filter(Boolean));
});

export default router;
