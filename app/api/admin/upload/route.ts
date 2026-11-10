import { NextResponse } from "next/server";

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

export async function POST(req: Request) {
  try {
    if (!IMGBB_API_KEY) {
      return NextResponse.json(
        { error: "Missing IMGBB_API_KEY in server environment" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Check file size (max 8MB for admin uploads)
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be under 8MB" },
        { status: 400 }
      );
    }

    // Prepare payload for ImgBB
    const imgbbFormData = new FormData();
    imgbbFormData.append("image", file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: imgbbFormData,
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      console.error("ImgBB upload failed:", json);
      return NextResponse.json(
        { error: json.error?.message || "ImgBB upload failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: json.data.url });
  } catch (err: any) {
    console.error("Upload API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}