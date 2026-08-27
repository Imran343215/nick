import mongoose, { Schema, model, models } from "mongoose";

/**
 * When the WhatsApp bridge (baileys-service) forwards a visitor's message to
 * the shop owner, it records the resulting WhatsApp message ID here against
 * the visitor's sessionId. When the owner later quote-replies to that
 * WhatsApp message, the bridge looks up the stanzaId (the quoted message's
 * ID) in this collection to find out which visitor session the reply
 * belongs to.
 */
export interface IChatLink {
  waMessageId: string;
  sessionId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ChatLinkSchema = new Schema<IChatLink>(
  {
    waMessageId: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

const ChatLink =
  (models.ChatLink as mongoose.Model<IChatLink> | undefined) ||
  model<IChatLink>("ChatLink", ChatLinkSchema);

export default ChatLink;
