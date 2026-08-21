"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed.");
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setLoading(false);
    }
  }

  return (
    <section className="admin">
      <div className="container">
        <div className="section__header">
          <div className="section__eyebrow">Back office</div>
          <h1 className="section__title">Admin Login</h1>
          <p className="section__lead">
            Enter the admin password to view and manage repair queries.
          </p>
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
          {error && <div className="alert alert--error">{error}</div>}

          <div className="form-grid">
            <div className="field field--full">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="form__actions">
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}