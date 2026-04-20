import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://signed.xshield.com.tr";
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/#ozellikler`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/#fiyat`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/#iletisim`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
}
