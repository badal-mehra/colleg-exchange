// SEO utilities: URL slugging, JSON-LD builders, canonical helpers.

export const SITE_URL = "https://www.mycampuskart.com";
export const SITE_NAME = "MyCampusKart";

export function slugify(text: string | null | undefined): string {
  if (!text) return "item";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

// Build /item/<slug>-<shortId> style URL. Keeps full UUID at the end for unique lookup.
export function buildItemPath(id: string, title?: string | null): string {
  return `/item/${slugify(title || "item")}-${id}`;
}

export function buildPGPath(id: string, title?: string | null): string {
  const base = title || "pg-room";
  return `/pg/${slugify(base)}-${id}`;
}

// Extract the original UUID/short id at the tail of a slug param.
// Accepts both pure ids and `slug-<id>` patterns.
export function extractIdFromSlug(param: string | undefined): string {
  if (!param) return "";
  // UUID v4 length 36
  const uuidMatch = param.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);
  if (uuidMatch) return uuidMatch[0];
  // Fallback: take last hyphen segment
  const segs = param.split("-");
  return segs[segs.length - 1];
}

export function canonical(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// JSON-LD builders --------------------------------------------------------

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: canonical(it.path),
    })),
  };
}

export function productJsonLd(p: {
  id: string;
  title: string;
  description?: string;
  price: number;
  images?: string[];
  condition?: string;
  isSold?: boolean;
  sellerName?: string;
  location?: string;
  url: string;
}) {
  const conditionMap: Record<string, string> = {
    "Brand New": "https://schema.org/NewCondition",
    "Like New": "https://schema.org/NewCondition",
    "Good": "https://schema.org/UsedCondition",
    "Fair": "https://schema.org/UsedCondition",
    "For Parts": "https://schema.org/DamagedCondition",
  };
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.description?.slice(0, 300) || p.title,
    image: p.images?.slice(0, 5) || [],
    sku: p.id,
    brand: { "@type": "Brand", name: "MyCampusKart" },
    offers: {
      "@type": "Offer",
      url: p.url,
      priceCurrency: "INR",
      price: p.price,
      itemCondition: conditionMap[p.condition || ""] || "https://schema.org/UsedCondition",
      availability: p.isSold
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
      seller: { "@type": "Person", name: p.sellerName || "MyCampusKart Seller" },
      areaServed: p.location,
    },
  };
}

export function accommodationJsonLd(p: {
  id: string;
  name: string;
  description?: string;
  rent: number;
  images?: string[];
  locality?: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Accommodation",
    name: p.name,
    description: p.description?.slice(0, 300) || p.name,
    image: p.images?.slice(0, 5) || [],
    url: p.url,
    address: { "@type": "PostalAddress", addressLocality: p.locality, addressCountry: "IN" },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: p.rent,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: p.rent,
        priceCurrency: "INR",
        unitText: "MONTH",
      },
    },
  };
}

export function personJsonLd(p: { name: string; url: string; image?: string | null; mckId?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    url: p.url,
    image: p.image || undefined,
    identifier: p.mckId,
    affiliation: { "@type": "Organization", name: "MyCampusKart" },
  };
}
