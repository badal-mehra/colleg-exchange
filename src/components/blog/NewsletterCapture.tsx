import { useState } from "react";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function NewsletterCapture({ source = "blog" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setLoading(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email, source });
    setLoading(false);
    if (error && !error.message.includes("duplicate")) {
      toast({ title: "Something went wrong", variant: "destructive" });
      return;
    }
    toast({ title: "You're in! 🎉", description: "We'll send the best campus content your way." });
    setEmail("");
  };

  return (
    <div className="my-12 rounded-2xl bg-card border border-border p-6 md:p-10">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Newsletter</span>
          </div>
          <h3 className="text-2xl font-bold">Get the campus weekly</h3>
          <p className="text-muted-foreground mt-1">
            One email a week with the best deals, guides and student hacks.
          </p>
        </div>
        <form onSubmit={submit} className="flex w-full md:w-auto gap-2">
          <Input
            type="email"
            required
            placeholder="you@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="md:w-64"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "..." : "Subscribe"}
          </Button>
        </form>
      </div>
    </div>
  );
}
