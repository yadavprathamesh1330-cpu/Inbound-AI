import { Icon } from "@/components/ui-custom/icon";

const features = [
  { icon: "local_shipping", title: "24/7 Dispatch Line", desc: "Every load call answered — rates, lanes, and equipment logged straight to your dispatch board." },
  { icon: "storefront", title: "Parts Counter AI", desc: "Takes truck-parts orders by make, model, and VIN — quotes, availability, and will-call pickup." },
  { icon: "build", title: "Breakdown Triage", desc: "Roadside and shop calls prioritized instantly — location captured, nearest tech dispatched." },
  { icon: "calendar_today", title: "Service Booking", desc: "PM services, DOT inspections, and bay appointments booked directly onto your calendar." },
  { icon: "sync", title: "TMS & CRM Sync", desc: "Loads, leads, and orders flow into Google Sheets, your TMS, HubSpot, Salesforce, and Zoho." },
  { icon: "language", title: "Multi-Lingual", desc: "English, Spanish, Hindi, and Punjabi — talk to drivers and brokers in their language." },
  { icon: "call_merge", title: "Warm Transfers", desc: "Complex negotiations hand off to your dispatcher with full call context." },
  { icon: "security", title: "Enterprise Secure", desc: "Rate cons, customer data, and recordings encrypted with per-company isolation." },
];

export function FeaturesSection() {
  return (
    <section className="px-margin-mobile py-unit-2xl md:px-margin-desktop">
      <div className="mx-auto max-w-container-max">
        <div className="mb-unit-xl flex flex-col items-end justify-between gap-unit-md md:flex-row">
          <div className="max-w-2xl">
            <h2 className="text-headline-lg text-headline-lg mb-unit-sm">
              Built for the Way Trucking Works
            </h2>
            <p className="text-body-md text-body-md text-on-surface-variant">
              Omni AI isn&rsquo;t a generic chatbot. It&rsquo;s a voice
              platform trained on dispatch, parts, and service workflows
              &mdash; so no call, load, or order slips through.
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
