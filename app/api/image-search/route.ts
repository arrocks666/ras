import { NextResponse } from "next/server";
import { createJob, runImageSearchJob } from "@/lib/image-search";

export const maxDuration = 300;
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large. Max 5MB." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const job = createJob();

    runImageSearchJob(job.id, base64).catch((err) => {
      console.error(`[api] Image search job ${job.id} failed:`, err);
    });

    return NextResponse.json({ jobId: job.id });
  } catch (err: any) {
    console.error("Image search API error:", err);
    return NextResponse.json({ error: err.message || "Failed to start search" }, { status: 500 });
  }
}