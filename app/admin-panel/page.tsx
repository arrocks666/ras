import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export default async function AdminPanelRoot() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ras_admin_session")?.value;
  if (token) redirect("/admin-panel/dashboard");
  else redirect("/admin-panel/login");
}