import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const alt = "Ratris Artistry — Trendy products from China to Bangladesh";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  let logo: string | null = null;

  try {
    const file = await readFile(path.join(process.cwd(), "public", "logo.png"));
    logo = `data:image/png;base64,${file.toString("base64")}`;
  } catch {
    logo = null;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg,#FFF6F6 0%,#FFE9EE 55%,#FFD9E4 100%)",
          color: "#2B1A24",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {logo ? (
            <img src={logo} width={92} height={92} style={{ borderRadius: 24, objectFit: "cover" }} />
          ) : (
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: 24,
                background: "#E8546B",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 46,
                fontWeight: 700,
              }}
            >
              R
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", marginLeft: 22 }}>
            <div style={{ fontSize: 22, letterSpacing: 6, color: "#B0364A", fontWeight: 700 }}>
              RATRIS ARTISTRY
            </div>
            <div style={{ fontSize: 20, color: "#7A5E64", marginTop: 6 }}>
              China → Bangladesh
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 64, lineHeight: 1.15, fontWeight: 800, maxWidth: 940 }}>
            Trendy products from China,
          </div>
          <div style={{ fontSize: 64, lineHeight: 1.15, fontWeight: 800, color: "#E8546B", marginTop: 6 }}>
            delivered to your door.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex" }}>
            {["Cash on delivery", "bKash · Nagad", "Nationwide shipping"].map((t) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  padding: "10px 20px",
                  marginRight: 12,
                  borderRadius: 999,
                  background: "rgba(232,84,107,0.12)",
                  border: "1px solid rgba(232,84,107,0.35)",
                  color: "#B0364A",
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {t}
              </div>
            ))}
          </div>

          <div style={{ fontSize: 22, color: "#7A5E64" }}>ratrisartistry.com</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
