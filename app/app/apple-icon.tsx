import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0E1420",
        }}
      >
        <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 10, height: 68, background: "#D9A93B", borderRadius: 3 }} />
          ))}
        </div>
        <div style={{ display: "flex", width: 96, height: 8, background: "#D9A93B", borderRadius: 3 }} />
        <div style={{ display: "flex", color: "#F4F1E8", fontSize: 30, fontWeight: 800, marginTop: 14, fontFamily: "sans-serif" }}>
          GW
        </div>
      </div>
    ),
    { ...size }
  );
}
