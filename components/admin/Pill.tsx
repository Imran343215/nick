import type { ReactNode } from "react";

export function Pill({
  children,
  color = "gray",
}: {
  children: ReactNode;
  color?: "green" | "red" | "orange" | "blue" | "gray";
}) {
  return <span className={`pill pill--${color}`}>{children}</span>;
}

/** Maps a common set of status strings to a pill color, so every admin table
 * gets consistent coloring without repeating the same switch everywhere. */
export function statusPillColor(status: string): "green" | "red" | "orange" | "blue" | "gray" {
  const s = status.toLowerCase();
  if (["active", "paid", "completed", "delivered", "picked_up", "verified"].includes(s)) return "green";
  if (["inactive", "rejected", "cancelled", "banned", "failed"].includes(s)) return "red";
  if (["pending", "new", "processing", "inspected"].includes(s)) return "orange";
  if (["pickup_scheduled", "shipped", "in_progress"].includes(s)) return "blue";
  return "gray";
}

export function StatusPill({ status }: { status: string }) {
  return (
    <Pill color={statusPillColor(status)}>
      {status.replaceAll("_", " ")}
    </Pill>
  );
}

/** Back-compat alias: the old codebase used `.status-pill` spans. */
export function StatusBadge({ status }: { status: string }) {
  return <StatusPill status={status} />;
}

export function RowActions({ children }: { children: ReactNode }) {
  return <span className="admin-row-actions">{children}</span>;
}

export function IconButton({
  label,
  title,
  onClick,
  danger,
  children,
}: {
  label: string;
  title?: string;
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title ?? label}
      onClick={onClick}
      className={`admin-icon-btn${danger ? " admin-icon-btn--danger" : ""}`}
    >
      {children}
    </button>
  );
}

export function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

export function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}

export function AvatarChip({ name, subtitle }: { name: string; subtitle?: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span className="avatar-chip">
      <span className="avatar-chip__circle">{initials || "?"}</span>
      <span>
        {name}
        {subtitle && (
          <>
            <br />
            <small>{subtitle}</small>
          </>
        )}
      </span>
    </span>
  );
}
