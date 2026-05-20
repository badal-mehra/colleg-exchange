import { useState } from "react";
import { Twitter, Linkedin, Link2, Check, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function StickyShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const enc = encodeURIComponent;
  const buttons = [
    { Icon: Twitter, href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`, label: "Twitter" },
    { Icon: Linkedin, href: `https://linkedin.com/sharing/share-offsite/?url=${enc(url)}`, label: "LinkedIn" },
    { Icon: MessageCircle, href: `https://wa.me/?text=${enc(title + " " + url)}`, label: "WhatsApp" },
  ];

  return (
    <div className="lg:fixed lg:left-4 lg:top-1/3 flex lg:flex-col gap-2 z-30">
      {buttons.map(({ Icon, href, label }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${label}`}
          className="h-10 w-10 rounded-full border border-border bg-background hover:bg-primary hover:text-primary-foreground flex items-center justify-center shadow-sm transition-colors"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
      <button
        onClick={copy}
        aria-label="Copy link"
        className="h-10 w-10 rounded-full border border-border bg-background hover:bg-primary hover:text-primary-foreground flex items-center justify-center shadow-sm transition-colors"
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
