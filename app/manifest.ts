import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "iTraxc",
    short_name: "iTraxc",
    description: "Betting Performance Tracker",
    // Signed-in users land straight on the dashboard; the auth proxy
    // transparently redirects to /login if there's no session, so this is
    // safe for both logged-in and logged-out launches.
    start_url: "/home",
    display: "standalone",
    background_color: "#f7f8fa",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
