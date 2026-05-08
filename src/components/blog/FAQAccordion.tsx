import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function FAQAccordion({ items }: { items: { q: string; a: string }[] }) {
  if (!items?.length) return null;
  return (
    <section className="my-10">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-4">
        {items.map((it, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border-b last:border-b-0">
            <AccordionTrigger className="text-left text-base font-medium">{it.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{it.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
