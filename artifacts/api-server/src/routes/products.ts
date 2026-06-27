import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, productsTable } from "@workspace/db";
import { eq, ilike, and, gte, lte, SQL } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { CreateProductBody, UpdateProductBody } from "@workspace/api-zod";

const router = Router();

async function buildProductResponse(product: typeof productsTable.$inferSelect) {
  const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, product.sellerId)).limit(1);
  if (!seller) return null;
  const { passwordHash: _ph, suspendReason: _sr, ...safeSeller } = seller;
  return { ...product, seller: safeSeller };
}

router.get("/", async (req, res) => {
  const { search, category, location, minPrice, maxPrice, negotiable, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, parseInt(limit) || 20);
  const offset = (pageNum - 1) * limitNum;

  const conditions: SQL[] = [eq(productsTable.status, "available")];
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
  if (category) conditions.push(eq(productsTable.category, category));
  if (location) conditions.push(ilike(productsTable.location, `%${location}%`));
  if (minPrice) conditions.push(gte(productsTable.price, parseFloat(minPrice)));
  if (maxPrice) conditions.push(lte(productsTable.price, parseFloat(maxPrice)));
  if (negotiable !== undefined) conditions.push(eq(productsTable.negotiable, negotiable === "true"));

  const where = and(...conditions);
  const [products, total] = await Promise.all([
    db.select().from(productsTable).where(where).limit(limitNum).offset(offset).orderBy(productsTable.createdAt),
    db.$count(productsTable, where),
  ]);
  const built = await Promise.all(products.map(buildProductResponse));
  res.json({ products: built.filter(Boolean), total: Number(total) });
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [product] = await db.insert(productsTable)
    .values({ ...parsed.data, sellerId: req.session!.userId! })
    .returning();

  res.status(201).json(await buildProductResponse(product));
});

router.get("/my", requireAuth, async (req, res) => {
  const userId = req.session!.userId!;
  const products = await db.select().from(productsTable)
    .where(eq(productsTable.sellerId, userId))
    .orderBy(productsTable.createdAt);
  const built = await Promise.all(products.map(buildProductResponse));
  res.json({ products: built.filter(Boolean), total: built.length });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json(await buildProductResponse(product));
});

router.patch("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [product] = await db.update(productsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(productsTable.id, id))
    .returning();
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json(await buildProductResponse(product));
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.json({ success: true });
});

export default router;
