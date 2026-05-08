import { Link } from "react-router-dom";
import { Clock, Eye } from "lucide-react";
import { BlogPost, formatDate } from "@/lib/blog";
import { Card } from "@/components/ui/card";

export function BlogCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group block">
      <Card
        className={`overflow-hidden border-border/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl rounded-2xl ${
          featured ? "md:flex" : ""
        }`}
      >
        <div className={`relative overflow-hidden bg-muted ${featured ? "md:w-1/2 aspect-[16/10]" : "aspect-[16/10]"}`}>
          {post.cover_image && (
            <img
              src={post.cover_image}
              alt={post.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          {post.blog_categories && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium bg-background/90 backdrop-blur text-foreground">
              {post.blog_categories.icon} {post.blog_categories.name}
            </span>
          )}
        </div>
        <div className={`p-5 ${featured ? "md:w-1/2 md:p-8 flex flex-col justify-center" : ""}`}>
          <h3
            className={`font-bold leading-tight group-hover:text-primary transition-colors ${
              featured ? "text-2xl md:text-3xl" : "text-lg"
            }`}
          >
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
          )}
          <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
            {post.blog_authors?.avatar_url && (
              <img
                src={post.blog_authors.avatar_url}
                alt={post.blog_authors.name}
                className="h-6 w-6 rounded-full"
              />
            )}
            <span className="font-medium text-foreground">{post.blog_authors?.name || "Team"}</span>
            <span>•</span>
            <span>{formatDate(post.published_at)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.reading_time || 5} min
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
