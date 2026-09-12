import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PharmaPaper",
    short_name: "PharmaPaper",
    description: "Free B.Pharm and D.Pharm study notes, syllabus-aligned.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#FBC02D",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
