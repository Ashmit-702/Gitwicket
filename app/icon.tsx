import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0E1420",
          borderRadius: 7,
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#D9A93B",
            fontSize: 21,
            fontWeight: 800,
            fontFamily: "sans-serif",
          }}
        >
          W
        </div>
      </div>
    ),
    { ...size }
  );
}
