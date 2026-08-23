"use client";

import { useEffect } from "react";

export default function PaymentSync({ sessionId }: { sessionId?: string }) {
  useEffect(() => {
    if (!sessionId) return;
    fetch("/api/orders/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(() => undefined);
  }, [sessionId]);
  return null;
}