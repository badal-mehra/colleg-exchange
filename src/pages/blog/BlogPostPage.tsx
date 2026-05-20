import { useEffect, useRef, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Clock, Eye, ArrowLeft } from "lucide-react";
import {
  BlogPost,
  fetchPostBySlug,
  fetchPublishedPosts,
  formatDate,
  incrementView,
  SITE_URL,
} from "@/lib/blog";
import { SEOHead } from "@/components/seo/SEOHead";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { ReadingProgressBar } from "@/components/blog/ReadingProgressBar";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { StickyShareButtons } from "@/components/blog/StickyShareButtons";
import { CTABlock } from "@/components/blog/CTABlock";
import { FAQAccordion } from "@/components/blog/FAQAccordion";
import { RelatedArticles } from "@/components/blog/RelatedArticles";
import { NewsletterCapture } from "@/components/blog/NewsletterCapture";
import { CommentsSection } from "@/components/blog/CommentsSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    (async () => {
      const p = await fetchPostBySlug(slug);
      if (!p) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setPost(p);
      incrementView(slug);
      const all = await fetchPublishedPosts({ limit: 4 });
      setRelated(all.filter((x) => x.id !== p.id).slice(0, 3));
      setLoading(false);
      window.scrollTo(0, 0);
    })();
  }, [slug]);

  if (notFound) return <Navigate to="/blog" replace />;

  if (loading || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Skeleton className="h-96 rounded-2xl mb-8" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  const url = `${SITE_URL}/blog/${post.slug}`;
  const tags = post.blog_post_tags || [];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.seo_description || post.excerpt,
      image: post.cover_image,
      datePublished: post.published_at,
      dateModified: post.updated_at,
      author: {
        "@type": "Person",
        name: post.blog_authors?.name || "MyCampusKart Team",
      },
      publisher: {
        "@type": "Organization",
        name: "MyCampusKart",
        logo: { "@type": "ImageObject", url: `${SITE_URL}/placeholder.svg` },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
    ...(post.faq && post.faq.length
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: post.faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={post.seo_title || `${post.title} | MyCampusKart`}
        description={post.seo_description || post.excerpt || undefined}
        canonical={post.canonical_url || url}
        image={post.og_image || post.cover_image || undefined}
        type="article"
        publishedTime={post.published_at || undefined}
        modifiedTime={post.updated_at}
        author={post.blog_authors?.name}
        jsonLd={jsonLd}
      />
      <ReadingProgressBar />

      <article className="pb-16">
        {/* Header */}
        <header className="max-w-4xl mx-auto px-4 pt-8 md:pt-12">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Blog", href: "/blog" },
              ...(post.blog_categories
                ? [{ label: post.blog_categories.name, href: `/blog/category/${post.blog_categories.slug}` }]
                : []),
              { label: post.title },
            ]}
          />
          {post.blog_categories && (
            <Link
              to={`/blog/category/${post.blog_categories.slug}`}
              className="mt-6 inline-block text-sm font-semibold text-primary uppercase tracking-wider"
            >
              {post.blog_categories.icon} {post.blog_categories.name}
            </Link>
          )}
          <h1 className="mt-3 text-3xl md:text-5xl font-bold leading-tight tracking-tight">{post.title}</h1>
          {post.excerpt && <p className="mt-4 text-xl text-muted-foreground">{post.excerpt}</p>}
          <div className="mt-6 flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
            {post.blog_authors?.avatar_url && (
              <img
                src={post.blog_authors.avatar_url}
                alt={post.blog_authors.name}
                className="h-10 w-10 rounded-full"
              />
            )}
            <div>
              <div className="font-medium text-foreground">{post.blog_authors?.name}</div>
              <div className="text-xs">{post.blog_authors?.role}</div>
            </div>
            <span>•</span>
            <span>{formatDate(post.published_at)}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {post.reading_time || 5} min read
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" /> {post.views} views
            </span>
          </div>
        </header>

        {/* Cover */}
        {post.cover_image && (
          <div className="max-w-5xl mx-auto px-4 mt-8">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full aspect-[16/9] object-cover rounded-2xl shadow-lg"
            />
          </div>
        )}

        {/* Body + TOC */}
        <div className="max-w-6xl mx-auto px-4 mt-12 grid lg:grid-cols-[1fr_220px] gap-12">
          <div ref={contentRef} className="min-w-0">
            <StickyShareButtons url={url} title={post.title} />
            <MarkdownRenderer content={post.content} />

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Link
                    key={t.blog_tags.slug}
                    to={`/blog/tag/${t.blog_tags.slug}`}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-muted hover:bg-muted/70 transition-colors"
                  >
                    #{t.blog_tags.name}
                  </Link>
                ))}
              </div>
            )}

            <CTABlock />

            <FAQAccordion items={post.faq || []} />

            {/* Author card */}
            {post.blog_authors && (
              <div className="my-12 rounded-2xl border border-border bg-card p-6 flex gap-4 items-start">
                {post.blog_authors.avatar_url && (
                  <img
                    src={post.blog_authors.avatar_url}
                    alt={post.blog_authors.name}
                    className="h-16 w-16 rounded-full"
                  />
                )}
                <div>
                  <div className="font-bold text-lg">{post.blog_authors.name}</div>
                  <div className="text-sm text-muted-foreground">{post.blog_authors.role}</div>
                  {post.blog_authors.bio && (
                    <p className="text-sm text-muted-foreground mt-2">{post.blog_authors.bio}</p>
                  )}
                </div>
              </div>
            )}

            <NewsletterCapture source={`post-${post.slug}`} />

            <CommentsSection postId={post.id} />
          </div>

          <aside>
            <TableOfContents contentRef={contentRef} />
          </aside>
        </div>

        {/* Related */}
        <div className="max-w-6xl mx-auto px-4">
          <RelatedArticles posts={related} />
        </div>

        <div className="max-w-6xl mx-auto px-4">
          <Button asChild variant="ghost" className="gap-2">
            <Link to="/blog">
              <ArrowLeft className="h-4 w-4" /> Back to all articles
            </Link>
          </Button>
        </div>
      </article>
    </div>
  );
}
