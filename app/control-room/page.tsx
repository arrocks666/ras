import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function ControlRoomIndex() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ras_admin_session")?.value;
  
  if (!token) {
    redirect("/control-room/login");
  }
  
  redirect("/control-room/dashboard");
}