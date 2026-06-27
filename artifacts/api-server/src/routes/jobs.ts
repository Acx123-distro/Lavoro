import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, jobsTable, applicationsTable } from "@workspace/db";
import { eq, ilike, and, gte, lte, SQL, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { CreateJobBody, UpdateJobBody, ApplyToJobBody } from "@workspace/api-zod";

const router = Router();

async function buildJobResponse(job: typeof jobsTable.$inferSelect) {
  const [client] = await db.select().from(usersTable).where(eq(usersTable.id, job.clientId)).limit(1);
  if (!client) return null;
  const { passwordHash: _ph, suspendReason: _sr, ...safeClient } = client;
  return { ...job, client: safeClient };
}

async function buildApplicationResponse(app: typeof applicationsTable.$inferSelect) {
  const [freelancer] = await db.select().from(usersTable).where(eq(usersTable.id, app.freelancerId)).limit(1);
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, app.jobId)).limit(1);
  if (!freelancer || !job) return null;
  const { passwordHash: _ph1, suspendReason: _sr1, ...safeFreelancer } = freelancer;
  const [client] = await db.select().from(usersTable).where(eq(usersTable.id, job.clientId)).limit(1);
  const { passwordHash: _ph2, suspendReason: _sr2, ...safeClient } = client!;
  return { ...app, freelancer: safeFreelancer, job: { ...job, client: safeClient } };
}

router.get("/", async (req, res) => {
  const { search, category, location, minBudget, maxBudget, status, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, parseInt(limit) || 20);
  const offset = (pageNum - 1) * limitNum;

  const conditions: SQL[] = [];
  if (search) conditions.push(ilike(jobsTable.title, `%${search}%`));
  if (category) conditions.push(eq(jobsTable.category, category));
  if (location) conditions.push(ilike(jobsTable.location, `%${location}%`));
  if (minBudget) conditions.push(gte(jobsTable.budget, parseFloat(minBudget)));
  if (maxBudget) conditions.push(lte(jobsTable.budget, parseFloat(maxBudget)));
  if (status) conditions.push(eq(jobsTable.status, status as "open" | "in_progress" | "completed" | "cancelled"));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [jobs, total] = await Promise.all([
    db.select().from(jobsTable).where(where).limit(limitNum).offset(offset).orderBy(jobsTable.createdAt),
    db.$count(jobsTable, where),
  ]);
  const built = await Promise.all(jobs.map(buildJobResponse));
  res.json({ jobs: built.filter(Boolean), total: Number(total) });
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [job] = await db.insert(jobsTable)
    .values({ ...parsed.data, clientId: req.session!.userId! })
    .returning();

  res.status(201).json(await buildJobResponse(job));
});

router.get("/my", requireAuth, async (req, res) => {
  const userId = req.session!.userId!;
  const jobs = await db.select().from(jobsTable)
    .where(eq(jobsTable.clientId, userId))
    .orderBy(jobsTable.createdAt);
  const built = await Promise.all(jobs.map(buildJobResponse));
  res.json({ jobs: built.filter(Boolean), total: built.length });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id)).limit(1);
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  res.json(await buildJobResponse(job));
});

router.patch("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const parsed = UpdateJobBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [job] = await db.update(jobsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(jobsTable.id, id))
    .returning();
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  res.json(await buildJobResponse(job));
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  await db.delete(jobsTable).where(eq(jobsTable.id, id));
  res.json({ success: true });
});

router.get("/:jobId/applications", requireAuth, async (req, res) => {
  const jobId = parseInt(req.params["jobId"] as string);
  if (isNaN(jobId)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.jobId, jobId));
  const built = await Promise.all(apps.map(buildApplicationResponse));
  res.json(built.filter(Boolean));
});

router.post("/:jobId/applications", requireAuth, async (req, res) => {
  const jobId = parseInt(req.params["jobId"] as string);
  if (isNaN(jobId)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const parsed = ApplyToJobBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [app] = await db.insert(applicationsTable)
    .values({ ...parsed.data, jobId, freelancerId: req.session!.userId! })
    .returning();

  await db.update(jobsTable)
    .set({ applicationCount: sql`${jobsTable.applicationCount} + 1` })
    .where(eq(jobsTable.id, jobId));

  res.status(201).json(await buildApplicationResponse(app));
});

export default router;
