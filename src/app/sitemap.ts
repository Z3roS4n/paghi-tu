import type { MetadataRoute } from "next";
import { governments } from "@/server/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "", "/spesa", "/governi", "/leggi-di-bilancio", "/promesse", "/misure",
    "/archivio", "/metodo", "/fonti", "/chi-siamo", "/correzioni", "/note-legali",
    "/atti", "/privacy", "/contribuire",
    ...governments.map((government) => `/governi/${government.id}`),
  ];
  return paths.map((path) => ({ url: `https://www.paghitu.it${path}` }));
}
