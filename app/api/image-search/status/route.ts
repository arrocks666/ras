import { NextResponse } from "next/server";
import { getJob } from "@/lib/imageSearchJobs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const job = getJob(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: job.status,
      products: job.products || [],
      error: job.error || null,
    });
  } catch (err: any) {
    console.error("Status API error:", err);
    return NextResponse.json(
      { error: "Failed to get job status" },
      { status: 500 }
    );
  }
}