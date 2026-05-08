import { useEffect, useState } from "react";

export function TableOfContents({ contentRef }: { contentRef: React.RefObject<HTMLElement> }) {
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    if (!contentRef.current) return;
    const els = Array.from(contentRef.current.querySelectorAll("h2, h3")) as HTMLElement[];
    setHeadings(
      els.map((e) => ({
        id: e.id,
        text: e.innerText,
        level: parseInt(e.tagName.substring(1)),
      }))
    );

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, [contentRef]);

  if (headings.length === 0) return null;

  return (
    <div className="sticky top-24 hidden lg:block">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        On this page
      </div>
      <ul className="space-y-2 border-l border-border">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "pl-6" : "pl-4"}>
            <a
              href={`#${h.id}`}
              className={`block text-sm py-1 -ml-px border-l transition-colors ${
                active === h.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
