// lib/search-client.ts

const ONEBOUND_KEY = process.env.ONEBOUND_KEY;
const ONEBOUND_SECRET = process.env.ONEBOUND_SECRET;
const ONEBOUND_BASE_URL = "https://api-gw.onebound.cn/1688";

export type OneBoundSearchResult = {
  id: string;
  title: string;
  price: number;
  image: string;
  detailUrl: string;
  supplierName: string;
};

function safeString(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    return val.original || val.text || val.en || val.zh || Object.values(val)[0] || "";
  }
  return String(val);
}

async function translateText(text: string): Promise<string> {
  if (!text || !/[\u4e00-\u9fa5]/.test(text)) return text;
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=zh-CN|en`);
    const json = await res.json();
    return json.responseData?.translatedText || text;
  } catch (err) {
    return text;
  }
}

async function getOneBoundImgId(base64Image: string): Promise<string> {
  if (!ONEBOUND_KEY || !ONEBOUND_SECRET) throw new Error("Missing OneBound keys in .env.local");

  const rawBase64 = base64Image.replace(/^data:image\/[^;]+;base64,/i, "").replace(/\s/g, "");
  if (!rawBase64) throw new Error("Cannot upload an empty image.");

  const url = new URL("https://api-gw.onebound.cn/1688/upload_img");
  url.searchParams.set("key", ONEBOUND_KEY);
  url.searchParams.set("secret", ONEBOUND_SECRET);
  url.searchParams.set("result_type", "json");

  const body = new URLSearchParams();
  body.set("imgcode", rawBase64);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
    body: body.toString(),
    signal: AbortSignal.timeout(30000),
  });

  const responseText = await response.text();
  const json = JSON.parse(responseText);

  const isSuccess = json.error_code === "0000" || json.error_code === "0";
  if (!isSuccess) throw new Error(`Upload failed: ${json.reason || json.error}`);

  const imgid = json.items?.item?.imgid || json.imgid || json.name;
  if (!imgid) throw new Error(`No imgid found`);

  return String(imgid);
}

export async function search1688ByImage(base64Image: string): Promise<OneBoundSearchResult[]> {
  if (!ONEBOUND_KEY || !ONEBOUND_SECRET) throw new Error("Missing OneBound keys in .env.local");

  const imgid = await getOneBoundImgId(base64Image);

  const params = new URLSearchParams({
    key: ONEBOUND_KEY,
    secret: ONEBOUND_SECRET,
    api_name: "item_search_img",
    imgid: imgid,
    lang: "en",
    cache: "yes",
    result_type: "json",
  });

  const res = await fetch(`${ONEBOUND_BASE_URL}/item_search_img?${params.toString()}`, {
    method: "GET",
    headers: { "Accept-Encoding": "gzip" },
  });

  const textResponse = await res.text();
  if (textResponse.startsWith("<")) throw new Error(`OneBound returned HTML: ${res.status}`);

  const json = JSON.parse(textResponse);
  if (json.error) throw new Error(json.reason || json.error);

  const items = json.items?.item || json.result?.items?.item || [];
  
  return Promise.all(items.map(async (it: any) => {
    let rawTitle = safeString(it.title);
    if (/[\u4e00-\u9fa5]/.test(rawTitle)) rawTitle = await translateText(rawTitle);

    return {
      id: String(it.num_iid),
      title: rawTitle,
      price: Number(it.price || 0),
      image: String(it.pic_url),
      detailUrl: String(it.detail_url || `https://detail.1688.com/offer/${it.num_iid}.html`),
      supplierName: String(it.seller_nick || "1688 Supplier"),
    };
  }));
}

function parsePropertiesName(propertiesName: string): { color: string; size: string } {
  let color = "Default";
  let size = "One Size";

  if (!propertiesName) return { color, size };

  const parts = propertiesName.split(";");
  for (const part of parts) {
    const segments = part.split(":");
    if (segments.length >= 4) {
      const propName = segments[2].toLowerCase();
      const propValue = segments.slice(3).join(":");
      if (propName.includes("color") || propName.includes("颜色")) color = propValue;
      if (propName.includes("size") || propName.includes("尺寸") || propName.includes("尺码")) size = propValue;
    }
  }
  return { color, size };
}

// 🆕 Extract image URLs from the raw HTML description
function extractImagesFromDesc(rawDesc: string): string[] {
  if (!rawDesc) return [];
  const urls: string[] = [];
  const imgRegex = /(?:src|data-lazyload|data-src)=["']([^"']+\.(?:jpg|jpeg|png|gif|webp)[^"']*)["']/gi;
  let match;
  while ((match = imgRegex.exec(rawDesc)) !== null) {
    if (match[1] && !match[1].startsWith("data:")) {
      urls.push(match[1]);
    }
  }
  const urlRegex = /(https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|gif|webp))/gi;
  while ((match = urlRegex.exec(rawDesc)) !== null) {
    if (!urls.includes(match[1])) urls.push(match[1]);
  }
  return urls;
}

// 🆕 Get details with proper description images and cleaned text
export async function get1688ProductDetails(productId: string) {
  if (!ONEBOUND_KEY || !ONEBOUND_SECRET) return null;

  try {
    const params = new URLSearchParams({
      key: ONEBOUND_KEY,
      secret: ONEBOUND_SECRET,
      api_name: "item_get",
      num_iid: productId,
      lang: "en",
      cache: "yes",
    });

    const res = await fetch(`${ONEBOUND_BASE_URL}/item_get?${params.toString()}`);
    const textResponse = await res.text();
    if (textResponse.startsWith("<")) return null;

    const json = JSON.parse(textResponse);
    if (json.error) return null;

    const item = json.item;
    if (!item) return null;

    let rawDesc = item.desc || item.description || "";
    const descImages = extractImagesFromDesc(rawDesc);
    
    // Clean text aggressively
    if (rawDesc) {
      rawDesc = rawDesc.replace(/var\s+desc\s*=\s*['"`][\s\S]*?['"`];?/gi, '');
      rawDesc = rawDesc.replace(/<[^>]*>?/gm, '');
      rawDesc = rawDesc.replace(/\\["'\/]/g, '');
      rawDesc = rawDesc.replace(/\/+/g, ' ');
      rawDesc = rawDesc.replace(/&quot;|&amp;|&lt;|&gt;|&nbsp;/g, ' ');
      rawDesc = rawDesc.replace(/\\r|\\n|\\t/g, ' ');
      rawDesc = rawDesc.replace(/\s+/g, ' ').trim();
      
      // If still garbage (only slashes or weird chars), clear it
      if (rawDesc.length < 10 || /^[\/\\'";,\s]+$/.test(rawDesc)) {
        rawDesc = "";
      }
      
      if (rawDesc && /[\u4e00-\u9fa5]/.test(rawDesc)) rawDesc = await translateText(rawDesc);
    }

    const finalDesc = rawDesc || `${item.title?.en || item.title || "Product"} - Premium quality item imported from 1688. Fast delivery to Bangladesh.`;

    // 🆕 Combine all images for the gallery
    const mainImages = item.item_imgs?.item_img?.map((img: any) => img.url) || [];
    const gallery = [...mainImages, ...descImages].filter((url, idx, arr) => arr.indexOf(url) === idx);
    if (gallery.length === 0 && item.pic_url) gallery.push(item.pic_url);

    const variants: any[] = [];
    const seenSpecs = new Set<string>();

    if (item.skus?.sku && Array.isArray(item.skus.sku)) {
      item.skus.sku.forEach((sku: any) => {
        const { color, size } = parsePropertiesName(String(sku.properties_name || ""));
        const specKey = `${color}-${size}`;
        if (!seenSpecs.has(specKey)) {
          seenSpecs.add(specKey);
          variants.push({
            specId: String(sku.sku_id || Math.random()),
            colorId: color,
            size: size,
            priceCny: Number(sku.price || 0),
            stock: Number(sku.quantity || 999),
            image: sku.sku_pic || ""
          });
        }
      });
    }

    return {
      description: finalDesc,
      gallery,
      variants,
      descImages  // 🆕 Return the description images separately for the product page
    };
  } catch (err) {
    return null;
  }
}