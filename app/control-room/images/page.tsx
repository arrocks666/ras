"use client";

import { useEffect, useRef, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { needsImgbbMigration } from "@/lib/img";
import { useProducts } from "@/lib/ProductsContext";

type RawProduct = {
  id: string;
  title?: string;
  image?: string;
  gallery?: string[];
  colors?: any[];
  variants?: any[];
};

function collectRemote(row: RawProduct): string[] {
  const set = new Set<string>();
  const add = (u?: string | null) => {
    if (u && needsImgbbMigration(u)) set.add(u);
  };
  add(row.image);
  (row.gallery || []).forEach(add);
  (row.colors || []).forEach((c: any) => add(c?.image));
  (row.variants || []).forEach((v: any) => add(v?.image));
  return Array.from(set);
}

export default function ImageMigrationPage() {
  const { refresh } = useProducts();
  const [rows, setRows] = useState<RawProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [imagesDone, setImagesDone] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const stopRef = useRef(false);

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as RawProduct[];
      const queue = list.filter((p) => collectRemote(p).length > 0);
      setRows(queue);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const total = rows.length;
  const percent = total === 0 ? 100 : Math.round((done / total) * 100);

  const start = async () => {
    if (running || rows.length === 0) return;
    stopRef.current = false;
    setRunning(true);
    setDone(0);
    setImagesDone(0);
    setFailed([]);

    let processed = 0;
    let images = 0;
    const errors: string[] = [];

    for (const row of rows) {
      if (stopRef.current) break;
      try {
        const urls = collectRemote(row);
        if (urls.length === 0) {
          processed++;
          setDone(processed);
          continue;
        }

        const map: Record<string, string> = {};
        for (let i = 0; i < urls.length; i += 12) {
          const chunk = urls.slice(i, i + 12);
          try {
            const res = await fetch("/api/upload-proxy", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageUrls: chunk }),
            });
            const data = await res.json();
            for (const r of data?.results || []) {
              if (r?.url) map[r.source] = r.url;
            }
          } catch (e: any) {
            errors.push(`${row.id}: ${e?.message || "network error"}`);
          }
        }

        const migratedCount = Object.keys(map).length;
        if (migratedCount === 0) {
          processed++;
          setDone(processed);
          continue;
        }

        const patch: Record<string, any> = { imagesMigratedAt: Date.now() };
        if (row.image && map[row.image]) patch.image = map[row.image];
        if ((row.gallery || []).some((g) => map[g])) {
          patch.gallery = (row.gallery || []).map((g) => map[g] || g);
        }
        if ((row.colors || []).some((c: any) => c?.image && map[c.image])) {
          patch.colors = (row.colors || []).map((c: any) =>
            c && c.image && map[c.image] ? { ...c, image: map[c.image] } : c
          );
        }
        if ((row.variants || []).some((v: any) => v?.image && map[v.image])) {
          patch.variants = (row.variants || []).map((v: any) =>
            v && v.image && map[v.image] ? { ...v, image: map[v.image] } : v
          );
        }

        await updateDoc(doc(db, "products", row.id), patch);

        images += migratedCount;
        setImagesDone(images);
      } catch (e: any) {
        errors.push(`${row.id}: ${e?.message || "failed"}`);
      }
      processed++;
      setDone(processed);
      setFailed(errors.slice(-8));
    }

    setRunning(false);
    await refresh();
    await load();
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E8546B]/40 bg-[#E8546B]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E8546B]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E8546B]" />
          Images
        </div>
        <h1 className="mt-3 font-serif text-2xl font-bold text-[#2B1A24] md:text-3xl">Migrate images to ImgBB</h1>
        <p className="mt-1 text-sm text-gray-500">
          Copies every 1688 picture to ImgBB once, so product pages never have to ask the Chinese CDN again.
          Run it once; new products already save to ImgBB by themselves.
        </p>
      </div>

      <div className="rounded-2xl border border-[#FAD4DD] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#2B1A24]">
              {loading ? "Reading products…" : `${total} product${total === 1 ? "" : "s"} still on 1688 images`}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {done} processed · {imagesDone} images moved to ImgBB
            </p>
          </div>
          <div className="flex gap-2">
            {running ? (
              <button
                onClick={() => { stopRef.current = true; }}
                className="rounded-xl border border-[#FAD4DD] px-5 py-2.5 text-sm font-bold text-[#6B5558] hover:bg-[#FFF6F6]"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={start}
                disabled={loading || total === 0}
                className="rounded-xl bg-[#E8546B] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#d1475e] disabled:opacity-40"
              >
                {total === 0 ? "Nothing to migrate" : "Start migration"}
              </button>
            )}
            <button
              onClick={load}
              disabled={running}
              className="rounded-xl border border-[#FAD4DD] px-4 py-2.5 text-sm font-bold text-[#6B5558] hover:bg-[#FFF6F6] disabled:opacity-40"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#FFF0F5]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#F4558F] to-[#E4216F] transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1.5 text-right text-[11px] font-bold text-[#8A6A75]">{percent}%</p>

        {!running && total > 0 && done > 0 && (
          <p className="mt-3 rounded-xl bg-[#F0FDF4] px-4 py-3 text-xs font-medium text-green-700">
            Finished. Reload the shop — the pictures now come from ImgBB and load instantly.
          </p>
        )}

        {failed.length > 0 && (
          <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-[11px] text-red-600">
            <p className="font-bold">Some products failed:</p>
            <ul className="mt-1 space-y-0.5">
              {failed.map((f, i) => (
                <li key={i} className="break-all">{f}</li>
              ))}
            </ul>
            <p className="mt-1">Press “Refresh” then “Start migration” again — it only touches what is left.</p>
          </div>
        )}

        <div className="mt-4 rounded-xl bg-[#FFF6F6] px-4 py-3 text-[11px] leading-relaxed text-[#6B5558]">
          <p><strong>Note:</strong> keep this tab open while it runs. About 1–3 seconds per product, so 50 products ≈ 2 minutes. Closing the page mid-way is safe: everything already migrated is saved.</p>
        </div>
      </div>
    </div>
  );
}
