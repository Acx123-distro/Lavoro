import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, ilike, and, SQL } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { SuspendUserBody } from "@workspace/api-zod";

const router = Router();

function formatUser(user: typeof usersTable.$inferSelect) {
  const { passwordHash: _ph, suspendReason: _sr, ...rest } = user;
  return rest;
}

router.get("/", requireAdmin, async (req, res) => {
  const { role, status, search, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit) || 20);
  const offset = (pageNum - 1) * limitNum;

  const conditions: SQL[] = [];
  if (role) conditions.push(eq(usersTable.role, role as "freelancer" | "client" | "seller" | "admin"));
  if (status) conditions.push(eq(usersTable.status, status as "active" | "suspended"));
  if (search) conditions.push(ilike(usersTable.name, `%${search}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [users, countResult] = await Promise.all([
    db.select().from(usersTable).where(where).limit(limitNum).offset(offset),
    db.$count(usersTable, where),
  ]);

  res.json({ users: users.map(formatUser), total: Number(countResult) });
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  res.json(formatUser(user));
});

router.patch("/:id/suspend", requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = SuspendUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const { suspended, reason } = parsed.data;
  const [user] = await db.update(usersTable)
    .set({
      status: suspended ? "suspended" : "active",
      suspendReason: suspended ? (reason ?? null) : null,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, id))
    .returning();

  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(formatUser(user));
});

export default router;
