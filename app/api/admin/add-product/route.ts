import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product, categoryId, subcategory, isTrending } = body;

    if (!product || !product.id) {
      return NextResponse.json({ error: "Invalid product data" }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    // Prepare the product document
    const productDoc = {
      ...product,
      categoryId,
      subcategory: subcategory || null,
      isTrending: !!isTrending,
      isFlashSale: false,
      isLive: true,
      inStock: true,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    // Clean undefined fields (Firestore rejects undefined)
    Object.keys(productDoc).forEach((key) => {
      if (productDoc[key] === undefined) delete productDoc[key];
    });

    await setDoc(doc(db, "products", product.id), productDoc);

    return NextResponse.json({ success: true, productId: product.id });
  } catch (err: any) {
    console.error("Add product API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to add product" },
      { status: 500 }
    );
  }
}