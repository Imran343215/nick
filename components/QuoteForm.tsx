"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function QuoteForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [trackingId, setTrackingId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not submit your query. Please try again.");
      }
      setTrackingId(data.query.trackingId);
      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <section className="section section--tint" id="quote">
      <div className="container">
        <div className="section__header">
          <div className="section__eyebrow">Repair query</div>
          <h2 className="section__title">Get a Free Quote</h2>
          <p className="section__lead">
            Describe your issue and we'll reply within an hour with a fixed price.
            You get a tracking ID to check status later.
          </p>
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
          {status === "success" && (
            <div className="alert alert--success">
              We received your query! Your tracking ID is{" "}
              <span className="tracking-id">{trackingId}</span>. Use it to check the
              status of your request.
            </div>
          )}
          {status === "error" && <div className="alert alert--error">{errorMessage}</div>}

          <div className="form-grid">
            <div className="field">
              <label htmlFor="q-name">Full name</label>
              <input id="q-name" name="name" required placeholder="Jordan Lee" />
            </div>
            <div className="field">
              <label htmlFor="q-email">Email</label>
              <input id="q-email" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="field">
              <label htmlFor="q-phone">Phone</label>
              <input id="q-phone" name="phone" required placeholder="+44 7424 906280" />
            </div>
            <div className="field">
              <label htmlFor="q-brand">Device brand</label>
              <select id="q-brand" name="deviceBrand" required defaultValue="">
                <option value="" disabled>
                  Select brand
                </option>
                <option>Apple</option>
                <option>Samsung</option>
                <option>Google</option>
                <option>Xiaomi</option>
                <option>OnePlus</option>
                <option>Other</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="q-model">Device model</label>
              <input id="q-model" name="deviceModel" placeholder="iPhone 15 Pro" />
            </div>
            <div className="field">
              <label htmlFor="q-issue">Issue type</label>
              <select id="q-issue" name="issue" required defaultValue="">
                <option value="" disabled>
                  What's wrong?
                </option>
                <option>Broken / cracked screen</option>
                <option>Battery drains fast / won't charge</option>
                <option>Water damage</option>
                <option>Slow performance / apps crashing</option>
                <option>Camera not working</option>
                <option>Charging port issue</option>
                <option>Other issue</option>
              </select>
            </div>
            <div className="field field--full">
              <label htmlFor="q-date">Preferred drop-off date (optional)</label>
              <input id="q-date" name="preferredDate" type="date" />
            </div>
            <div className="field field--full">
              <label htmlFor="q-message">Describe the issue (optional)</label>
              <textarea
                id="q-message"
                name="message"
                rows={4}
                placeholder="e.g. It won't charge and the screen flickers after dropping it."
              />
            </div>
          </div>

          <div className="form__actions">
            <button type="submit" className="btn btn--primary" disabled={status === "loading"}>
              {status === "loading" ? "Sending..." : "Submit query"}
            </button>
            <span className="form__note">Free diagnostics · No obligation</span>
          </div>
        </form>
      </div>
    </section>
  );
}