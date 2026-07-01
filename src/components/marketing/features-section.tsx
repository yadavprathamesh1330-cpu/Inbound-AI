import { Icon } from "@/components/ui-custom/icon";

const features = [
  { icon: "support_agent", title: "AI Receptionist", desc: "24/7 call handling with zero latency and natural prosody." },
  { icon: "sync", title: "CRM Sync", desc: "Bi-directional integration with HubSpot, Salesforce, Zoho, and more." },
  { icon: "language", title: "Multi-Lingual", desc: "Native fluency in 45+ languages with dialect detection." },
  { icon: "security", title: "Enterprise Secure", desc: "Enterprise-grade encryption for sensitive customer data." },
  { icon: "call_merge", title: "Warm Transfers", desc: "Instantly hand off complex calls to human agents with context." },
  { icon: "analytics", title: "Sentiment Analysis", desc: "Real-time tone detection to adapt conversation flow." },
  { icon: "bolt", title: "Ultra-Low Latency", desc: "Sub-200ms response time for true conversational feel." },
  { icon: "api", title: "Developer First", desc: "Robust API and SDKs for custom voice application builds." },
];

export function FeaturesSection() {
  return (
    <section className="px-margin-mobile py-unit-2xl md:px-margin-desktop">
      <div className="mx-auto max-w-container-max">
        <div className="mb-unit-xl flex flex-col items-end justify-between gap-unit-md md:flex-row">
          <div className="max-w-2xl">
            <h2 className="text-headline-lg text-headline-lg mb-unit-sm">
              Engineered for Reliability
            </h2>
            <p className="text-body-md text-body-md text-on-surface-variant">
              Omni AI isn&rsquo;t just a chatbot. It&rsquo;s an enterprise-grade
              voice interface designed to replace entire support flows.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-unit-lg">
              <Icon name={f.icon} className="mb-unit-md size-9 text-secondary" />
              <h3 className="text-headline-md text-headline-md mb-2">
                {f.title}
              </h3>
              <p className="text-body-md text-on-surface-variant">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
