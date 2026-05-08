import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTABlock({
  title = "Ready to declutter your hostel?",
  description = "List items in 60 seconds and reach thousands of students on your campus.",
  primary = { label: "Start Selling", href: "/sell" },
  secondary = { label: "Explore Marketplace", href: "/browse" },
}: {
  title?: string;
  description?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <div className="my-10 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 p-6 md:p-10 text-center">
      <Sparkles className="h-7 w-7 text-primary mx-auto mb-3" />
      <h3 className="text-2xl md:text-3xl font-bold">{title}</h3>
      <p className="mt-2 text-muted-foreground max-w-xl mx-auto">{description}</p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg">
          <Link to={primary.href}>
            {primary.label} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to={secondary.href}>{secondary.label}</Link>
        </Button>
      </div>
    </div>
  );
}
