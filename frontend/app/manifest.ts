import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KAVACH Smart Factory",
    short_name: "KAVACH",
    description: "Industrial AI, predictive maintenance, and smart factory operations.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#0891b2",
    categories: ["business", "productivity", "utilities"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
