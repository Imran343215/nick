"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";

type ChatMessage = {
  id: string;
  from: "visitor" | "owner";
  text: string;
  createdAt: string;
};

const SESSION_STORAGE_KEY = "wa-chat-session-id";
const POLL_INTERVAL_MS = 3000;

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
}

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const sinceRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  const poll = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(
        `/api/chat/poll?sessionId=${sessionId}&since=${sinceRef.current}`
      );
      const data = await res.json();
      if (!res.ok || !data.ok) return;
      if (data.messages?.length) {
        setMessages((current) => [...current, ...data.messages]);
      }
      if (typeof data.nextSinceTs === "number") {
        sinceRef.current = data.nextSinceTs;
      }
    } catch {
      // Transient network hiccups are fine — the next tick retries.
    }
  }, [sessionId]);

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    poll();
    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [isOpen, sessionId, poll]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || !sessionId || sending) return;

    setSending(true);
    setInput("");
    setMessages((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        from: "visitor",
        text,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, text, name: "Website visitor" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Could not send your message.");
      }
      // We already rendered the message above; skip past its server
      // timestamp on the next poll so it isn't appended a second time.
      if (data.createdAt) {
        sinceRef.current = new Date(data.createdAt).getTime();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not send your message.";
      toast.error(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="wa-widget__button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? "Close chat" : "Open WhatsApp chat"}
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
            <path d="M18.3 5.71 12 12.01l-6.3-6.3-1.41 1.41 6.3 6.3-6.3 6.3 1.41 1.41 6.3-6.3 6.3 6.3 1.41-1.41-6.3-6.3 6.3-6.3z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.83 14.02c-.24.68-1.4 1.3-1.93 1.34-.5.05-1 .24-3.35-.7-2.85-1.14-4.66-4-4.8-4.19-.14-.19-1.15-1.53-1.15-2.92s.72-2.08.98-2.36c.26-.28.56-.35.75-.35.19 0 .38 0 .54.01.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.14.12.31.02.5-.1.19-.15.31-.29.47-.14.17-.3.37-.43.5-.14.14-.29.29-.13.57.17.28.75 1.23 1.6 1.99 1.1.98 2.03 1.29 2.31 1.43.28.14.44.12.6-.07.17-.19.71-.83.9-1.11.19-.29.38-.24.63-.14.26.1 1.65.78 1.93.92.28.14.47.21.54.33.07.12.07.68-.17 1.36z" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="wa-widget__panel">
          <div className="wa-widget__header">
            <div className="wa-widget__header-title">Chat with us</div>
            <div className="wa-widget__header-sub">
              We usually reply within a few minutes
            </div>
          </div>

          <div className="wa-widget__messages">
            {messages.length === 0 && (
              <div className="wa-widget__empty">
                Send a message to get started 👋
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`wa-widget__message wa-widget__message--${msg.from}`}
              >
                <div className="wa-widget__bubble">{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="wa-widget__composer" onSubmit={handleSend}>
            <input
              className="wa-widget__input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message"
              aria-label="Message"
            />
            <button
              type="submit"
              className="wa-widget__send"
              disabled={!input.trim() || sending}
              aria-label="Send message"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
