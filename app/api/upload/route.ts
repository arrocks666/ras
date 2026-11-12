import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "IMGBB_API_KEY not set in .env.local" }, { status: 500 });
    }

    const imgFormData = new FormData();
    imgFormData.append("image", file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: imgFormData,
    });

    const data = await res.json();
    
    if (data.success) {
      return NextResponse.json({ url: data.data.url });
    } else {
      return NextResponse.json({ error: data.error?.message || "Upload failed" }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}