import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:font-bold prose-a:text-primary prose-img:rounded-xl prose-img:shadow-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
