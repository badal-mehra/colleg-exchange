import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { slugify, readingTime } from "@/lib/blog";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { Plus, Trash2, Eye, Save } from "lucide-react";

export default function BlogEditor() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const nav = useNavigate();
  const isNew = !id;

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [postTagIds, setPostTagIds] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<any>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image: "",
    author_id: "",
    category_id: "",
    status: "draft",
    published_at: "",
    scheduled_at: "",
    featured: false,
    seo_title: "",
    seo_description: "",
    og_image: "",
    canonical_url: "",
    faq: [] as { q: string; a: string }[],
  });

  useEffect(() => {
    (async () => {
      if (!user) return nav("/auth");
      const { data: a } = await supabase.from("admin_users").select("id").eq("user_id", user.id).maybeSingle();
      if (!a) {
        setAllowed(false);
        return;
      }
      setAllowed(true);

      const [c, au, t] = await Promise.all([
        supabase.from("blog_categories").select("*").order("sort_order"),
        supabase.from("blog_authors").select("*"),
        supabase.from("blog_tags").select("*").order("name"),
      ]);
      setCategories(c.data || []);
      setAuthors(au.data || []);
      setTags(t.data || []);

      if (id) {
        const { data: p } = await supabase
          .from("blog_posts")
          .select("*, blog_post_tags(tag_id)")
          .eq("id", id)
          .maybeSingle();
        if (p) {
          setForm({
            ...p,
            faq: Array.isArray(p.faq) ? p.faq : [],
            published_at: p.published_at ? new Date(p.published_at).toISOString().slice(0, 16) : "",
            scheduled_at: p.scheduled_at ? new Date(p.scheduled_at).toISOString().slice(0, 16) : "",
          });
          setPostTagIds((p.blog_post_tags || []).map((x: any) => x.tag_id));
        }
      }
    })();
  }, [id, user, nav]);

  const setF = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title || !form.content) {
      toast({ title: "Title and content required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload: any = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      excerpt: form.excerpt || null,
      content: form.content,
      cover_image: form.cover_image || null,
      author_id: form.author_id || null,
      category_id: form.category_id || null,
      status: form.status,
      published_at:
        form.status === "published"
          ? form.published_at
            ? new Date(form.published_at).toISOString()
            : new Date().toISOString()
          : null,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      reading_time: readingTime(form.content),
      featured: form.featured,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      og_image: form.og_image || null,
      canonical_url: form.canonical_url || null,
      faq: form.faq,
    };

    let postId = id;
    if (isNew) {
      const { data, error } = await supabase.from("blog_posts").insert(payload).select("id").maybeSingle();
      if (error) {
        setSaving(false);
        return toast({ title: error.message, variant: "destructive" });
      }
      postId = data!.id;
    } else {
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", id);
      if (error) {
        setSaving(false);
        return toast({ title: error.message, variant: "destructive" });
      }
    }

    // Sync tags
    if (postId) {
      await supabase.from("blog_post_tags").delete().eq("post_id", postId);
      if (postTagIds.length) {
        await supabase
          .from("blog_post_tags")
          .insert(postTagIds.map((tag_id) => ({ post_id: postId, tag_id })));
      }
    }

    setSaving(false);
    toast({ title: "Saved!" });
    if (isNew && postId) nav(`/admin/blog/${postId}/edit`);
  };

  const addFaq = () => setF("faq", [...form.faq, { q: "", a: "" }]);
  const updateFaq = (i: number, k: "q" | "a", v: string) => {
    const next = [...form.faq];
    next[i] = { ...next[i], [k]: v };
    setF("faq", next);
  };
  const removeFaq = (i: number) => setF("faq", form.faq.filter((_: any, idx: number) => idx !== i));

  if (allowed === false) return <div className="p-10 text-center">Admin only.</div>;
  if (allowed === null) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold">{isNew ? "New article" : "Edit article"}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreview(!preview)}>
              <Eye className="h-4 w-4" /> {preview ? "Edit" : "Preview"}
            </Button>
            <Button onClick={save} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 space-y-5">
            <Card className="p-5 space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => {
                    setF("title", e.target.value);
                    if (isNew && !form.slug) setF("slug", slugify(e.target.value));
                  }}
                  placeholder="Catchy SEO title"
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setF("slug", slugify(e.target.value))}
                  placeholder="my-article"
                />
              </div>
              <div>
                <Label>Excerpt</Label>
                <Textarea
                  value={form.excerpt}
                  onChange={(e) => setF("excerpt", e.target.value)}
                  rows={2}
                  placeholder="Short summary shown in cards and meta description fallback"
                />
              </div>
              <div>
                <Label>Cover image URL</Label>
                <Input
                  value={form.cover_image}
                  onChange={(e) => setF("cover_image", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </Card>

            <Card className="p-5">
              <Label>Content (Markdown)</Label>
              {preview ? (
                <div className="mt-3 border rounded-lg p-4 bg-muted/30">
                  <MarkdownRenderer content={form.content || "*Nothing yet.*"} />
                </div>
              ) : (
                <Textarea
                  value={form.content}
                  onChange={(e) => setF("content", e.target.value)}
                  rows={20}
                  className="font-mono text-sm mt-2"
                  placeholder="## Heading\n\nWrite your article here..."
                />
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <Label>FAQ (boosts SEO)</Label>
                <Button size="sm" variant="outline" onClick={addFaq}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
              <div className="space-y-3">
                {form.faq.map((f: any, i: number) => (
                  <div key={i} className="rounded-lg border p-3 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={f.q}
                        onChange={(e) => updateFaq(i, "q", e.target.value)}
                        placeholder="Question"
                      />
                      <Button size="icon" variant="ghost" onClick={() => removeFaq(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={f.a}
                      onChange={(e) => updateFaq(i, "a", e.target.value)}
                      placeholder="Answer"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <Label className="text-base font-semibold">SEO</Label>
              <div>
                <Label>SEO title</Label>
                <Input
                  value={form.seo_title}
                  onChange={(e) => setF("seo_title", e.target.value)}
                  placeholder="Defaults to title"
                />
              </div>
              <div>
                <Label>SEO description</Label>
                <Textarea
                  value={form.seo_description}
                  onChange={(e) => setF("seo_description", e.target.value)}
                  rows={2}
                  placeholder="Under 160 chars"
                />
              </div>
              <div>
                <Label>OG Image</Label>
                <Input value={form.og_image} onChange={(e) => setF("og_image", e.target.value)} />
              </div>
              <div>
                <Label>Canonical URL</Label>
                <Input value={form.canonical_url} onChange={(e) => setF("canonical_url", e.target.value)} />
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="p-5 space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setF("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.status === "published" && (
                <div>
                  <Label>Published at</Label>
                  <Input
                    type="datetime-local"
                    value={form.published_at}
                    onChange={(e) => setF("published_at", e.target.value)}
                  />
                </div>
              )}
              {form.status === "scheduled" && (
                <div>
                  <Label>Scheduled for</Label>
                  <Input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(e) => setF("scheduled_at", e.target.value)}
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label>Featured</Label>
                <Switch checked={form.featured} onCheckedChange={(v) => setF("featured", v)} />
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category_id || ""} onValueChange={(v) => setF("category_id", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Author</Label>
                <Select value={form.author_id || ""} onValueChange={(v) => setF("author_id", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select author" />
                  </SelectTrigger>
                  <SelectContent>
                    {authors.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tags</Label>
                <div className="mt-2 flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                  {tags.map((t) => {
                    const on = postTagIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setPostTagIds(on ? postTagIds.filter((x) => x !== t.id) : [...postTagIds, t.id])
                        }
                        className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                          on
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border hover:bg-muted"
                        }`}
                      >
                        #{t.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
