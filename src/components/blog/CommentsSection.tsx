import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/blog";

export function CommentsSection({ postId }: { postId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("blog_comments")
      .select("*")
      .eq("post_id", postId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    setComments(data || []);
  };

  useEffect(() => {
    load();
  }, [postId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("blog_comments").insert({
      post_id: postId,
      user_id: user.id,
      name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Student",
      content: text.trim(),
      status: "pending",
    });
    setLoading(false);
    if (error) {
      toast({ title: "Failed to post", variant: "destructive" });
      return;
    }
    toast({ title: "Comment submitted", description: "It'll appear after moderation." });
    setText("");
  };

  return (
    <section className="my-12">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Comments ({comments.length})</h2>
      {user ? (
        <form onSubmit={submit} className="mb-8">
          <Textarea
            placeholder="Share your thoughts..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            required
          />
          <div className="mt-3 flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Posting..." : "Post comment"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm mb-8">
          <Link to="/auth" className="text-primary font-medium">
            Sign in
          </Link>{" "}
          to join the discussion.
        </div>
      )}
      <div className="space-y-4">
        {comments.map((c) => (
          <div key={c.id} className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.content}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Be the first to comment.</p>
        )}
      </div>
    </section>
  );
}
