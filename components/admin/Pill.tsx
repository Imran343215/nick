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
