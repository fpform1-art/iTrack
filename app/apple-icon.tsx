import { ImageResponse } from "next/og";

// Placeholder iTraxc apple-touch-icon — replace with real brand artwork
// when available (see PWA_ICONS.md for the full list of files to swap).
// iOS applies its own rounded-corner mask, so this stays full-bleed with
// no baked-in rounding, matching the maskable PWA icon's approach.
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
          alignItems: "center",
          justifyContent: "center",
          background: "#2563eb",
          color: "#ffffff",
          fontSize: 84,
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
