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
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "#C1443B",
            border: "1.5px solid #8a2e27",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 1,
              left: 11,
              width: 2,
              height: 22,
              background: "#F4F1E8",
              borderRadius: 1,
              transform: "rotate(18deg)",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
