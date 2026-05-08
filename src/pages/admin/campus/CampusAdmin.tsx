import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { slugify } from "@/lib/blog";
import { toast } from "@/hooks/use-toast";

export default function CampusAdmin() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [list, setList] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const load = async () => {
    const { data } = await supabase.from("campus_pages").select("*").order("name");
    setList(data || []);
  };

  useEffect(() => {
    (async () => {
      if (!user) return nav("/auth");
      const { data: a } = await supabase.from("admin_users").select("id").eq("user_id", user.id).maybeSingle();
      if (!a) return setAllowed(false);
      setAllowed(true);
      load();
    })();
  }, [user, nav]);

  const newPage = () =>
    setEditing({
      slug: "",
      name: "",
      city: "",
      hero_image: "",
      intro: "",
      sections: { trends: [], hostels: [], popular_categories: [], tips: [] },
      seo_title: "",
      seo_description: "",
      is_active: true,
    });

  const save = async () => {
    if (!editing.name || !editing.slug) return toast({ title: "Name + slug required", variant: "destructive" });
    const payload = { ...editing, slug: slugify(editing.slug) };
    const { error } = editing.id
      ? await supabase.from("campus_pages").update(payload).eq("id", editing.id)
      : await supabase.from("campus_pages").insert(payload);
    if (error) return toast({ title: error.message, variant: "destructive" });
    toast({ title: "Saved" });
    setEditing(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("campus_pages").delete().eq("id", id);
    load();
  };

  const updateSection = (key: string, value: string) =>
    setEditing({
      ...editing,
      sections: { ...editing.sections, [key]: value.split("\n").filter(Boolean) },
    });

  if (allowed === false) return <div className="p-10 text-center">Admin only.</div>;

  if (editing) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <Button variant="ghost" onClick={() => setEditing(null)} className="mb-4">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold">{editing.id ? "Edit campus" : "New campus"}</h1>
          <Card className="p-5 mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.slug || slugify(e.target.value) })} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>City</Label>
              <Input value={editing.city || ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
            </div>
            <div>
              <Label>Hero image URL</Label>
              <Input value={editing.hero_image || ""} onChange={(e) => setEditing({ ...editing, hero_image: e.target.value })} />
            </div>
            <div>
              <Label>Intro</Label>
              <Textarea value={editing.intro || ""} onChange={(e) => setEditing({ ...editing, intro: e.target.value })} rows={3} />
            </div>
            {(["trends", "hostels", "popular_categories", "tips"] as const).map((k) => (
              <div key={k}>
                <Label className="capitalize">{k.replace("_", " ")} (one per line)</Label>
                <Textarea
                  value={(editing.sections?.[k] || []).join("\n")}
                  onChange={(e) => updateSection(k, e.target.value)}
                  rows={4}
                />
              </div>
            ))}
            <div>
              <Label>SEO title</Label>
              <Input value={editing.seo_title || ""} onChange={(e) => setEditing({ ...editing, seo_title: e.target.value })} />
            </div>
            <div>
              <Label>SEO description</Label>
              <Textarea value={editing.seo_description || ""} onChange={(e) => setEditing({ ...editing, seo_description: e.target.value })} rows={2} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
            </div>
            <Button onClick={save}>
              <Save className="h-4 w-4" /> Save campus
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/admin/blog">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Campus pages</h1>
          <Button onClick={newPage}>
            <Plus className="h-4 w-4" /> New campus
          </Button>
        </div>
        <div className="mt-6 space-y-2">
          {list.map((c) => (
            <Card key={c.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">/{c.slug} · {c.city}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(c)}>Edit</Button>
                <Button size="icon" variant="ghost" onClick={() => del(c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
