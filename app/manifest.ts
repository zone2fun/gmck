import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GMCK",
    short_name: "GMCK",
    description: "Meet nearby, connect genuinely.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090f",
    theme_color: "#09090f",
    lang: "th",
    orientation: "portrait-primary",
    icons: [{ src: "/gmck-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
  };
}
