import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Syntaxure Labs | Global B2B Digital Transformation Agency",
    short_name: "Syntaxure Labs",
    description:
      "Global B2B digital transformation agency specializing in scalable custom software, web architectures, and secure AI integrations.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#06b6d4",
    icons: [
      {
        src: "/favicon/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/favicon/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
