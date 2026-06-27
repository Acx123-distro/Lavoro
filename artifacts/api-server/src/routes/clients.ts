import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, clientProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { UpsertClientProfileBody } from "@workspace/api-zod";

const router = Router();

async function buildClientResponse(profile: typeof clientProfilesTable.$inferSelect) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, profile.userId)).limit(1);
  if (!user) return null;
  const { passwordHash: _ph, suspendReason: _sr, ...safeUser } = user;
  return { ...profile, user: safeUser };
}

router.get("/me", requireAuth, async (req, res) => {
  const userId = req.session!.userId!;
  const [profile] = await db.select().from(clientProfilesTable)
    .where(eq(clientProfilesTable.userId, userId)).limit(1);
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }
  res.json(await buildClientResponse(profile));
});

router.put("/me", requireAuth, async (req, res) => {
  const parsed = UpsertClientProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const userId = req.session!.userId!;
  const existing = await db.select().from(clientProfilesTable)
    .where(eq(clientProfilesTable.userId, userId)).limit(1);

  const data = { ...parsed.data, updatedAt: new Date() };
  let profile: typeof clientProfilesTable.$inferSelect;

  if (existing.length > 0) {
    [profile] = await db.update(clientProfilesTable)
      .set(data)
      .where(eq(clientProfilesTable.userId, userId))
      .returning();
  } else {
    [profile] = await db.insert(clientProfilesTable)
      .values({ userId, ...data })
      .returning();
  }

  res.json(await buildClientResponse(profile));
});

router.get("/:userId", async (req, res) => {
  const userId = parseInt(req.params["userId"] as string);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [profile] = await db.select().from(clientProfilesTable)
    .where(eq(clientProfilesTable.userId, userId)).limit(1);
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }
  res.json(await buildClientResponse(profile));
});

export default router;
