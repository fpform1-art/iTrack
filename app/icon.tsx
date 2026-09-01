import { ImageResponse } from "next/og";

// Placeholder iTraxc favicon — replace with real brand artwork when
// available (see PWA_ICONS.md for the full list of files to swap).
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
          background: "#2563eb",
          color: "#ffffff",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}
      >
        iX
      </div>
    ),
    { ...size }
  );
}
