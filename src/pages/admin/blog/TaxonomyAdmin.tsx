import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { slugify } from "@/lib/blog";
import { toast } from "@/hooks/use-toast";

export function TaxonomyAdmin({ kind }: { kind: "categories" | "tags" }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const table = kind === "categories" ? "blog_categories" : "blog_tags";

  const load = async () => {
    const { data } = await supabase.from(table).select("*").order("name");
    setItems(data || []);
  };

  useEffect(() => {
    (async () => {
      if (!user) return nav("/auth");
      const { data: a } = await supabase.from("admin_users").select("id").eq("user_id", user.id).maybeSingle();
      if (!a) return setAllowed(false);
      setAllowed(true);
      load();
    })();
  }, [user, nav, table]);

  const add = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from(table).insert({ name: name.trim(), slug: slugify(name) });
    if (error) return toast({ title: error.message, variant: "destructive" });
    setName("");
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from(table).delete().eq("id", id);
    load();
  };

  if (allowed === false) return <div className="p-10 text-center">Admin only.</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/admin/blog">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold capitalize">{kind}</h1>
        <Card className="p-5 mt-6">
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`New ${kind.slice(0, -1)} name`} />
            <Button onClick={add}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </Card>
        <div className="mt-6 space-y-2">
          {items.map((i) => (
            <Card key={i.id} className="p-3 flex items-center justify-between">
              <div>
                <span className="font-medium">{i.name}</span>
                <span className="text-xs text-muted-foreground ml-2">/{i.slug}</span>
              </div>
              <Button size="icon" variant="ghost" onClick={() => del(i.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export const CategoryAdmin = () => <TaxonomyAdmin kind="categories" />;
export const TagAdmin = () => <TaxonomyAdmin kind="tags" />;
