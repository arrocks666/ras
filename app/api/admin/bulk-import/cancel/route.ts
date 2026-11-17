import { NextRequest } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const jobId = String(body.jobId ?? "").trim();
    if (!jobId) {
      return Response.json({ error: "jobId required" }, { status: 400 });
    }

    const jobRef = doc(db, "bulk_import_jobs", jobId);
    await updateDoc(jobRef, { status: "cancelled" });

    return Response.json({ ok: true });
  } catch (err: any) {
    console.error("bulk-import/cancel error:", err);
    return Response.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}