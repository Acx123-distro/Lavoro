import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, conversationsTable, conversationParticipantsTable, messagesTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { StartConversationBody, SendMessageBody } from "@workspace/api-zod";

const router = Router();

async function buildConversationResponse(conv: typeof conversationsTable.$inferSelect, myUserId: number) {
  const participants = await db.select().from(conversationParticipantsTable)
    .where(eq(conversationParticipantsTable.conversationId, conv.id));
  const userIds = participants.map(p => p.userId);
  const users = userIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, userIds))
    : [];
  const safeUsers = users.map(({ passwordHash: _ph, suspendReason: _sr, ...u }) => u);
  const myPart = participants.find(p => p.userId === myUserId);
  return {
    ...conv,
    participantIds: userIds,
    participants: safeUsers,
    unreadCount: myPart?.unreadCount ?? 0,
    lastMessage: conv.lastMessage ?? null,
    lastMessageAt: conv.lastMessageAt?.toISOString() ?? null,
    createdAt: conv.createdAt.toISOString(),
  };
}

router.get("/", requireAuth, async (req, res) => {
  const myId = req.session!.userId!;
  const myParts = await db.select().from(conversationParticipantsTable)
    .where(eq(conversationParticipantsTable.userId, myId));
  const convIds = myParts.map(p => p.conversationId);
  if (convIds.length === 0) { res.json([]); return; }

  const convs = await db.select().from(conversationsTable)
    .where(inArray(conversationsTable.id, convIds));

  const built = await Promise.all(convs.map(c => buildConversationResponse(c, myId)));
  res.json(built);
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = StartConversationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const { recipientId, initialMessage } = parsed.data;
  const myId = req.session!.userId!;

  const [conv] = await db.insert(conversationsTable).values({}).returning();

  await db.insert(conversationParticipantsTable).values([
    { conversationId: conv.id, userId: myId },
    { conversationId: conv.id, userId: recipientId },
  ]);

  if (initialMessage) {
    const [msg] = await db.insert(messagesTable).values({
      conversationId: conv.id,
      senderId: myId,
      content: initialMessage,
    }).returning();

    await db.update(conversationsTable).set({
      lastMessage: initialMessage,
      lastMessageAt: msg.createdAt,
    }).where(eq(conversationsTable.id, conv.id));
  }

  res.status(201).json(await buildConversationResponse(conv, myId));
});

router.get("/:id/messages", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const messages = await db.select().from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(messagesTable.createdAt);

  const senderIds = [...new Set(messages.map(m => m.senderId))];
  const senders = senderIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, senderIds))
    : [];
  const senderMap = new Map(senders.map(s => {
    const { passwordHash: _ph, suspendReason: _sr, ...safe } = s;
    return [s.id, safe];
  }));

  const result = messages.map(m => ({ ...m, sender: senderMap.get(m.senderId) }));

  await db.update(conversationParticipantsTable)
    .set({ unreadCount: 0 })
    .where(and(
      eq(conversationParticipantsTable.conversationId, id),
      eq(conversationParticipantsTable.userId, req.session!.userId!)
    ));

  res.json(result);
});

router.post("/:id/messages", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const myId = req.session!.userId!;
  const [msg] = await db.insert(messagesTable).values({
    conversationId: id,
    senderId: myId,
    content: parsed.data.content,
  }).returning();

  await db.update(conversationsTable).set({
    lastMessage: parsed.data.content,
    lastMessageAt: msg.createdAt,
  }).where(eq(conversationsTable.id, id));

  const allParts = await db.select().from(conversationParticipantsTable)
    .where(eq(conversationParticipantsTable.conversationId, id));
  for (const part of allParts) {
    if (part.userId !== myId) {
      await db.update(conversationParticipantsTable)
        .set({ unreadCount: part.unreadCount + 1 })
        .where(eq(conversationParticipantsTable.id, part.id));
    }
  }

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, myId)).limit(1);
  const { passwordHash: _ph, suspendReason: _sr, ...safeSender } = sender!;

  res.status(201).json({ ...msg, sender: safeSender });
});

export default router;
