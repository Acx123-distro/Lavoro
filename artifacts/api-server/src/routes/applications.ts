import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, jobsTable, applicationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { UpdateApplicationStatusBody } from "@workspace/api-zod";

const router = Router();

async function buildApplicationResponse(app: typeof applicationsTable.$inferSelect) {
  const [freelancer] = await db.select().from(usersTable).where(eq(usersTable.id, app.freelancerId)).limit(1);
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, app.jobId)).limit(1);
  if (!freelancer || !job) return null;
  const { passwordHash: _ph1, suspendReason: _sr1, ...safeFreelancer } = freelancer;
  const [client] = await db.select().from(usersTable).where(eq(usersTable.id, job.clientId)).limit(1);
  const { passwordHash: _ph2, suspendReason: _sr2, ...safeClient } = client!;
  return { ...app, freelancer: safeFreelancer, job: { ...job, client: safeClient } };
}

router.get("/my", requireAuth, async (req, res) => {
  const userId = req.session!.userId!;
  const apps = await db.select().from(applicationsTable)
    .where(eq(applicationsTable.freelancerId, userId))
    .orderBy(applicationsTable.createdAt);
  const built = await Promise.all(apps.map(buildApplicationResponse));
  res.json(built.filter(Boolean));
});

router.patch("/:id/status", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const parsed = UpdateApplicationStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [app] = await db.update(applicationsTable)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(applicationsTable.id, id))
    .returning();
  if (!app) { res.status(404).json({ error: "Application not found" }); return; }

  res.json(await buildApplicationResponse(app));
});

export default router;
