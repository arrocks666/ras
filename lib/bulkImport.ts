// lib/bulkImport.ts
import { fetchPizani1688 } from "./pizani1688";
import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { CATEGORIES } from "./categories";

// Apify allows 5 concurrent actor runs on this account; 3 keeps headroom
// for image search / product-page refreshes running at the same time.
const CONCURRENCY = 3;
const PIZANI_TIMEOUT_MS = 100_000;
const STAGGER_MS = 300;
const CANCEL_CHECK_MS = 3000;

// ✅ Helper to recursively remove undefined values that break Firestore
function deepClean(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => deepClean(v)).filter((v) => v !== undefined);
  }
  if (obj !== null && typeof obj === "object") {
    const newObj: any = {};
    for (const key in obj) {
      const cleaned = deepClean(obj[key]);
      if (cleaned !== undefined) {
        newObj[key] = cleaned;
      }
    }
    return newObj;
  }
  return obj;
}

/** Resolves to `fallback` if the promise takes longer than `ms`. */
function withTimeout<T>(p: Promise<T>, ms: number, label: string, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => {
      console.warn(`[bulk-import] ${label} exceeded ${Math.round(ms / 1000)}s — skipping it`);
      resolve(fallback);
    }, ms);
    p.then((v) => {
      clearTimeout(timer);
      resolve(v);
    }).catch((err) => {
      clearTimeout(timer);
      console.warn(`[bulk-import] ${label} failed:`, err?.message || err);
      resolve(fallback);
    });
  });
}

/** Pulls the numeric 1688 offer id out of a search result. */
function extractOfferId(item: any): string {
  if (!item) return "";
  let id = "";
  if (item.url) {
    const match = String(item.url).match(/offer\/(\d+)/);
    if (match) id = match[1];
  }
  if (!id) id = String(item.offerId || item.id || "");
  return /^\d{8,15}$/.test(id) ? id : "";
}

// ✅ Use the correct BlueskyScraper Actor for keyword search
async function searchProductsByKeyword(keyword: string, count: number) {
  const APIFY_TOKEN = process.env.APIFY_TOKEN;
  if (!APIFY_TOKEN) throw new Error("Missing APIFY_TOKEN");

  const ACTOR_ID = "blueskyscraper~1688-scraper"; 
  const runUrl = `https://api.apify.com/v2/actors/${ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&waitForFinish=60`;

  const input = {
    keywords: [keyword],
    maxResults: count,
  };

  console.log(`[bulk-import] Searching "${keyword}" via ${ACTOR_ID}...`);

  const response = await fetch(runUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Search actor failed: ${text}`);
  }

  return await response.json() as any[];
}

export async function runBulkImport(
  jobId: string,
  categoryId: string,
  subcategoryId: string,
  targetCount: number
) {
  const jobRef = doc(db, "bulk_import_jobs", jobId);

  try {
    const cat = CATEGORIES.find((c) => c.id === categoryId);
    const sub = cat?.subcategories.find((s) => s.slug === subcategoryId);
    if (!sub) throw new Error("Invalid category/subcategory");

    const keyword = sub.name;
    const subName = sub.name; // ✅ The name for filtering (e.g. "Dresses")

    await updateDoc(jobRef, { status: "searching" });

    // 1. Search using the correct Actor
    const searchResults = await searchProductsByKeyword(keyword, targetCount + 5);

    if (searchResults.length === 0) {
      throw new Error(`No products found for "${keyword}". Try a different category.`);
    }

    // 2. Drop duplicates / unusable rows once, up front (saves credits + writes)
    const items: { offerId: string }[] = [];
    const seen = new Set<string>();
    for (const item of searchResults) {
      const offerId = extractOfferId(item);
      if (!offerId || seen.has(offerId)) continue;
      seen.add(offerId);
      items.push({ offerId });
      if (items.length >= targetCount) break;
    }

    if (items.length === 0) {
      throw new Error(`No usable products found for "${keyword}". Try a different category.`);
    }

    await updateDoc(jobRef, { status: "loading", totalExpected: items.length });

    let imported = 0;
    let failed = 0;
    let cancelled = false;
    let lastCancelCheck = 0;
    let cursor = 0;

    /** Asks Firestore whether the admin pressed Cancel (throttled). */
    const isCancelled = async () => {
      const now = Date.now();
      if (now - lastCancelCheck < CANCEL_CHECK_MS) return cancelled;
      lastCancelCheck = now;
      try {
        const snap = await getDoc(jobRef);
        const status = snap.exists() ? (snap.data() as any)?.status : undefined;
        if (status === "cancelled") cancelled = true;
      } catch (err) {
        // Never let a status read kill the import
      }
      return cancelled;
    };

    // 3. Import with a small worker pool — several products at once
    const worker = async () => {
      while (true) {
        if (cancelled) return;
        if (await isCancelled()) return;

        const index = cursor++;
        if (index >= items.length) return;

        const { offerId } = items[index];

        try {
          // Full variants (colors, sizes, prices) via Pizani
          const detail = await withTimeout(
            fetchPizani1688(offerId),
            PIZANI_TIMEOUT_MS,
            `pizani ${offerId}`,
            null
          );

          if (!detail) {
            failed++;
            await updateDoc(jobRef, { failed });
            continue;
          }

          const productRef = doc(db, "products", detail.id);

          // ✅ Save both subcategoryId (for URL routing) AND subcategory (for filter)
          const rawProductData = {
            ...detail,
            categoryId,
            subcategoryId: subcategoryId,  // Slug (e.g. "dresses")
            subcategory: subName,          // Name (e.g. "Dresses")
            isTrending: true,
            isLive: false,
            savedAt: Date.now(),
          };

          await setDoc(productRef, deepClean(rawProductData), { merge: true });

          imported++;
          await updateDoc(jobRef, { imported });
          console.log(`[bulk-import] ✓ ${offerId} (${imported + failed}/${items.length})`);
        } catch (err: any) {
          console.error(`Failed to import item ${offerId}:`, err?.message || err);
          failed++;
          await updateDoc(jobRef, { failed });
        }

        // Tiny gap between starts so we never hammer the actor
        if (STAGGER_MS > 0) await new Promise((r) => setTimeout(r, STAGGER_MS));
      }
    };

    const poolSize = Math.min(CONCURRENCY, items.length);
    await Promise.all(Array.from({ length: poolSize }, () => worker()));

    // Cancelled from the UI? Leave the status alone so the panel shows "cancelled".
    if (cancelled) {
      console.log(`[bulk-import] job ${jobId} cancelled after ${imported} import(s)`);
      return;
    }

    await updateDoc(jobRef, {
      status: "done",
      imported,
      failed,
      completedAt: serverTimestamp(),
    });

  } catch (err: any) {
    console.error("Bulk import failed:", err);
    try {
      await updateDoc(jobRef, {
        status: "error",
        error: err.message || "Unknown error",
      });
    } catch (inner) {
      console.error("Could not mark job as failed:", inner);
    }
  }
}
