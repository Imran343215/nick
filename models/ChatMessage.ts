import mongoose, { Schema, model, models } from "mongoose";

export interface IChatMessage {
  sessionId: string;
  from: "visitor" | "owner";
  text: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    sessionId: { type: String, required: true, index: true },
    from: { type: String, enum: ["visitor", "owner"], required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Every poll for a session filters by sessionId and orders by time.
ChatMessageSchema.index({ sessionId: 1, createdAt: 1 });

const ChatMessage =
  (models.ChatMessage as mongoose.Model<IChatMessage> | undefined) ||
  model<IChatMessage>("ChatMessage", ChatMessageSchema);

export default ChatMessage;
