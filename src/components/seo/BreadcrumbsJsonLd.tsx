import { Helmet } from "react-helmet-async";
import { breadcrumbJsonLd } from "@/lib/seo";

export function BreadcrumbsJsonLd({ items }: { items: { name: string; path: string }[] }) {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd(items))}</script>
    </Helmet>
  );
}
