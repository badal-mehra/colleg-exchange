import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Edit, Trash2, FileText, Tag, FolderOpen, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/blog";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogAdmin() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) {
        nav("/auth");
        return;
      }
      const { data: a } = await supabase.from("admin_users").select("id").eq("user_id", user.id).maybeSingle();
      if (!a) {
        setIsAdmin(false);
        return;
      }
      setIsAdmin(true);
      const { data } = await supabase
        .from("blog_posts")
        .select("id, title, slug, status, published_at, views, blog_categories(name)")
        .order("created_at", { ascending: false });
      setPosts(data || []);
      setLoading(false);
    })();
  }, [user, nav]);

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  const del = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) return toast({ title: "Failed", variant: "destructive" });
    setPosts(posts.filter((p) => p.id !== id));
    toast({ title: "Deleted" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Blog CMS</h1>
            <p className="text-muted-foreground">Manage articles, taxonomy and campus pages.</p>
          </div>
          <Button asChild>
            <Link to="/admin/blog/new">
              <Plus className="h-4 w-4" /> New post
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <AdminTile to="/admin/blog" icon={FileText} label="Posts" active />
          <AdminTile to="/admin/blog/categories" icon={FolderOpen} label="Categories" />
          <AdminTile to="/admin/blog/tags" icon={Tag} label="Tags" />
          <AdminTile to="/admin/campus" icon={MapPin} label="Campuses" />
        </div>

        <div className="mt-8 space-y-3">
          {loading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
          ) : posts.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">No posts yet.</Card>
          ) : (
            posts.map((p) => (
              <Card key={p.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground flex gap-3 mt-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full ${
                      p.status === "published" ? "bg-green-500/15 text-green-700 dark:text-green-400" :
                      p.status === "scheduled" ? "bg-blue-500/15 text-blue-700 dark:text-blue-400" :
                      "bg-muted"
                    }`}>{p.status}</span>
                    <span>/{p.slug}</span>
                    {p.blog_categories?.name && <span>{p.blog_categories.name}</span>}
                    {p.published_at && <span>{formatDate(p.published_at)}</span>}
                    <span>{p.views} views</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/admin/blog/${p.id}/edit`}>
                      <Edit className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => del(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AdminTile({ to, icon: Icon, label, active }: any) {
  return (
    <Link
      to={to}
      className={`rounded-xl border p-4 flex items-center gap-3 transition-colors ${
        active ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
      }`}
    >
      <Icon className="h-5 w-5 text-primary" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}
