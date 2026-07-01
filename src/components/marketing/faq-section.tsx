import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How quickly can I deploy an AI voice agent?",
    a: "Most teams go live in under 15 minutes using the guided setup wizard — configure your business info, voice, and objectives, then connect or buy a phone number.",
  },
  {
    q: "Does Omni AI integrate with my existing CRM?",
    a: "Yes. Omni AI syncs call summaries, transcripts, and lead data to Google Sheets, Google Calendar, Slack, webhooks, HubSpot, Salesforce, and Zoho.",
  },
  {
    q: "What happens when the AI can't answer a question?",
    a: "Each agent has configurable fallback responses and transfer rules, so calls can be warm-transferred to a human teammate with full context.",
  },
  {
    q: "Is my customer data secure?",
    a: "All call recordings, transcripts, and lead data are encrypted at rest and in transit, with per-organization data isolation.",
  },
  {
    q: "Can I try Omni AI before committing?",
    a: "Yes — the Growth plan includes a 14-day free trial, no credit card required to start exploring the platform.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="px-margin-mobile py-unit-2xl md:px-margin-desktop">
      <div className="mx-auto max-w-3xl">
        <div className="mb-unit-xl text-center">
          <h2 className="text-headline-lg text-headline-lg mb-unit-sm">
            Frequently Asked Questions
          </h2>
        </div>
        <Accordion className="glass-card rounded-2xl px-unit-lg">
          {faqs.map((faq, i) => (
            <AccordionItem key={faq.q} value={`item-${i}`}>
              <AccordionTrigger className="text-body-lg text-body-lg font-semibold">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-body-md text-on-surface-variant">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
