import AdminLogin from "./LoginForm";
import RepairBookingsManager from "./repair-bookings/RepairBookingsManager";
import { isAdminAuthed } from "@/lib/auth";

// Re-check the session cookie on every request (no caching).
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await isAdminAuthed();

  if (!authed) {
    return <AdminLogin />;
  }

  return <RepairBookingsManager />;
}