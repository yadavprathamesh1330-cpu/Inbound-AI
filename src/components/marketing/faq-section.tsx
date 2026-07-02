import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How quickly can my trucking company go live?",
    a: "Most companies go live in under 15 minutes using the guided setup wizard — describe your operation (dispatch, parts, service), pick a voice, and connect or buy a phone number.",
  },
  {
    q: "Can it really handle dispatch and load calls?",
    a: "Yes. Omni captures lane, equipment, weight, rate, and pickup details from brokers and shippers, logs everything to your dispatch sheet or TMS, and warm-transfers negotiations to your dispatcher when needed.",
  },
  {
    q: "What about truck parts orders?",
    a: "Omni takes parts orders by make, model, and part number, checks them against your catalog in the knowledge base, and creates the order with pickup or delivery details for your counter team.",
  },
  {
    q: "What happens after hours or when all dispatchers are busy?",
    a: "Omni answers 24/7 — nights, weekends, and overflow. Urgent breakdown calls are triaged and escalated to your on-call contact immediately; everything else is booked, logged, and waiting in the morning.",
  },
  {
    q: "Does it integrate with my TMS or CRM?",
    a: "Call summaries, loads, leads, and orders sync to Google Sheets, Google Calendar, Slack, webhooks, HubSpot, Salesforce, and Zoho — and custom TMS integrations are available on Enterprise.",
  },
  {
    q: "Is my rate and customer data secure?",
    a: "All call recordings, transcripts, rate information, and customer data are encrypted at rest and in transit, with per-company data isolation.",
  },
  {
    q: "Can I try it before committing?",
    a: "Yes — the Fleet plan includes a 14-day free trial, no credit card required to start.",
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
