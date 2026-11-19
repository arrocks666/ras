import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();
    
    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    // 1. Download the image from the Chinese CDN (aliyuncs/alicdn)
    // We add a Referer header so the Chinese server thinks we are a legitimate browser visiting 1688
    const imageRes = await fetch(imageUrl, {
      headers: {
        "Referer": "https://detail.1688.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!imageRes.ok) {
      throw new Error(`Failed to download image from source: ${imageRes.statusText}`);
    }

    const buffer = await imageRes.arrayBuffer();
    const blob = new Blob([buffer], { type: "image/jpeg" });

    // 2. Re-upload the downloaded image to ImgBB
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      throw new Error("IMGBB_API_KEY is missing in .env.local");
    }

    const formData = new FormData();
    formData.append("image", blob, "product.jpg");

    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });

    const imgbbData = await imgbbRes.json();

    if (imgbbData.success) {
      // Return the new, permanent ImgBB URL
      return NextResponse.json({ url: imgbbData.data.url });
    } else {
      throw new Error(imgbbData.error?.message || "ImgBB upload failed");
    }

  } catch (err: any) {
    console.error("Upload proxy failed:", err);
    return NextResponse.json({ error: err.message || "Failed to proxy image" }, { status: 500 });
  }
}