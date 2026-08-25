"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/utils";
import type { SectionHeader } from "@/lib/theme";

const DEFAULT_HEADER: SectionHeader = {
  eyebrow: "Track your repair",
  title: "Check Repair Status",
  lead: "Enter the tracking ID from your booking confirmation to see the current status of your repair.",
};

interface TrackUpdate {
  status: string;
  note?: string;
  at: string;
}

interface TrackResult {
  trackingId: string;
  customerName: string;
  device: string;
  service: string;
  price?: number;
  status: string;
  statusDescription: string;
  etaDays: number;
  updates: TrackUpdate[];
}

export default function TrackRepair({
  header,
}: {
  header?: SectionHeader;
}) {
  const [id, setId] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const h = { ...DEFAULT_HEADER, ...(header ?? {}) };

  async function handleTrack(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/repair-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId: id.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No repair order found with that tracking ID.");
      }
      setResult(data.order);
      toast.success("Repair found — status shown below.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not fetch your repair status.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section" id="track">
      <div className="container">
        <div className="section__header">
          <div className="section__eyebrow">{h.eyebrow}</div>
          <h2 className="section__title">{h.title}</h2>
          <p className="section__lead">{h.lead}</p>
        </div>

        <form className="track-form" onSubmit={handleTrack}>
          <input
            aria-label="Tracking ID"
            placeholder="e.g. MRP-XXXX-XXXXXX"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          />
          <button type="submit" className="btn btn--accent" disabled={loading}>
            {loading ? "Searching..." : "Track"}
          </button>
        </form>

        {error && <div className="alert alert--error">{error}</div>}

        {result && (
          <div className="track-result">
            <div className="track-result__head">
              <div className="track-result__device">{result.device}</div>
              <span className={`status-badge status-badge--${result.status}`}>
                {result.status}
              </span>
            </div>
            <div className="track-result__row">
              <span>Tracking ID</span>
              <strong>{result.trackingId}</strong>
            </div>
            <div className="track-result__row">
              <span>Customer</span>
              <strong>{result.customerName}</strong>
            </div>
            <div className="track-result__row">
              <span>Service</span>
              <strong>{result.service}</strong>
            </div>
            {result.price !== undefined && (
              <div className="track-result__row">
                <span>Price</span>
                <strong>{formatPrice(Number(result.price))}</strong>
              </div>
            )}
            {result.etaDays !== undefined && (
              <div className="track-result__row">
                <span>Est. completion</span>
                <strong>{result.etaDays} day(s)</strong>
              </div>
            )}
            <p style={{ marginTop: "0.75rem" }}>{result.statusDescription}</p>

            <div className="timeline">
              {result.updates.map((update, i) => (
                <div className="timeline__item" key={i}>
                  <span className="timeline__dot" />
                  <span>
                    <strong>{update.status}</strong>
                    {update.note ? ` — ${update.note}` : ""}{" "}
                    <span className="timeline__time">
                      {new Date(update.at).toLocaleString()}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}