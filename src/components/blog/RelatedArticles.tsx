import { BlogPost } from "@/lib/blog";
import { BlogCard } from "./BlogCard";

export function RelatedArticles({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null;
  return (
    <section className="my-12">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Keep reading</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((p) => (
          <BlogCard key={p.id} post={p} />
        ))}
      </div>
    </section>
  );
}
