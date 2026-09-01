import { ImageResponse } from "next/og.js";
import { writeFile, mkdir } from "node:fs/promises";

const BRAND_BLUE = "#2563eb";

function monogram({ fontSize, bold = true }) {
  return {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_BLUE,
        color: "#ffffff",
        fontSize,
        fontWeight: bold ? 700 : 500,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        letterSpacing: "-0.02em",
      },
      children: "iX",
    },
  };
}

async function generate(name, { size, fontSize }, outDir) {
  const res = new ImageResponse(monogram({ size, fontSize }), { width: size, height: size });
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(outDir, { recursive: true });
  const path = `${outDir}/${name}`;
  await writeFile(path, buf);
  console.log(`wrote ${path} (${buf.length} bytes)`);
}

// "any" purpose icons can use more of the canvas — no OS-applied crop mask.
await generate("icon-192.png", { size: 192, fontSize: 88 }, "public/icons");
await generate("icon-512.png", { size: 512, fontSize: 236 }, "public/icons");

// Maskable icon: background must be full-bleed (no baked-in rounding), and
// the glyph must stay inside the ~80%-diameter centered "safe zone" so it
// isn't clipped by circle/squircle masks the OS may apply.
await generate("icon-512-maskable.png", { size: 512, fontSize: 160 }, "public/icons");

console.log("done");
