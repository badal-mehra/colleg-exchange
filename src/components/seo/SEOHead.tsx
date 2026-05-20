import { Helmet } from "react-helmet-async";
import { SITE_NAME, SITE_URL } from "@/lib/blog";

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  noindex?: boolean;
  jsonLd?: any | any[];
}

export function SEOHead({
  title,
  description,
  canonical,
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  noindex,
  jsonLd,
}: SEOHeadProps) {
  const url = canonical || (typeof window !== "undefined" ? window.location.href : SITE_URL);
  const ogImage = image || `${SITE_URL}/placeholder.svg`;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />
      {blocks.map((b, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(b)}
        </script>
      ))}
    </Helmet>
  );
}
