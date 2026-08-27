import { connectDB } from "@/lib/db";
import ChatMessage, { type IChatMessage } from "@/models/ChatMessage";
import ChatLink from "@/models/ChatLink";

export type ChatMessageDTO = {
  id: string;
  from: "visitor" | "owner";
  text: string;
  createdAt: string;
};

function serialize(doc: IChatMessage & { _id: unknown }): ChatMessageDTO {
  return {
    id: String(doc._id),
    from: doc.from,
    text: doc.text,
    createdAt: new Date(doc.createdAt as Date).toISOString(),
  };
}

/** Link an outbound WhatsApp message ID to the visitor session it relates to. */
export async function linkWaMessageToSession(
  waMessageId: string,
  sessionId: string
): Promise<void> {
  await connectDB();
  await ChatLink.updateOne(
    { waMessageId },
    { $set: { waMessageId, sessionId } },
    { upsert: true }
  );
}

export async function getSessionForWaMessage(
  waMessageId: string
): Promise<string | null> {
  await connectDB();
  const link = await ChatLink.findOne({ waMessageId }).lean();
  return link?.sessionId ?? null;
}

export async function appendChatMessage(
  sessionId: string,
  from: "visitor" | "owner",
  text: string
): Promise<ChatMessageDTO> {
  await connectDB();
  const doc = await ChatMessage.create({ sessionId, from, text });
  return serialize(doc.toObject());
}

/**
 * Returns messages for a session created after `sinceTs` (a ms timestamp,
 * 0 for "all"), oldest first, plus the timestamp to pass as `since` on the
 * next poll.
 */
export async function getChatMessagesSince(
  sessionId: string,
  sinceTs: number
): Promise<{ messages: ChatMessageDTO[]; nextSinceTs: number }> {
  await connectDB();

  const query = sinceTs
    ? { sessionId, createdAt: { $gt: new Date(sinceTs) } }
    : { sessionId };

  const docs = await ChatMessage.find(query).sort({ createdAt: 1 }).lean();
  const messages = docs.map((doc) => serialize(doc as IChatMessage & { _id: unknown }));

  const nextSinceTs = messages.length
    ? new Date(messages[messages.length - 1].createdAt).getTime()
    : sinceTs;

  return { messages, nextSinceTs };
}
