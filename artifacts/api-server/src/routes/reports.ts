import { Router } from "express";
import { db } from "@workspace/db";
import { reportsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { CreateReportBody, ResolveReportBody } from "@workspace/api-zod";

const router = Router();

router.get("/", requireAdmin, async (req, res) => {
  const { status, page = "1" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const offset = (pageNum - 1) * 20;

  const where = status ? eq(reportsTable.status, status as "pending" | "resolved" | "dismissed") : undefined;
  const reports = await db.select().from(reportsTable).where(where).limit(20).offset(offset).orderBy(reportsTable.createdAt);
  res.json(reports);
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [report] = await db.insert(reportsTable).values({
    reporterId: req.session!.userId!,
    reportedUserId: parsed.data.reportedUserId,
    reason: parsed.data.reason,
    details: parsed.data.details ?? null,
  }).returning();

  res.status(201).json(report);
});

router.patch("/:id/resolve", requireAdmin, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = ResolveReportBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [report] = await db.update(reportsTable)
    .set({ status: parsed.data.status, resolution: parsed.data.resolution ?? null, updatedAt: new Date() })
    .where(eq(reportsTable.id, id))
    .returning();
  if (!report) { res.status(404).json({ error: "Report not found" }); return; }
  res.json(report);
});

export default router;
