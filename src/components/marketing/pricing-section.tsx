import Link from "next/link";
import { Icon } from "@/components/ui-custom/icon";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Professional",
    price: "$99",
    featured: false,
    features: [
      { label: "500 Call Minutes", included: true },
      { label: "2 AI Agents", included: true },
      { label: "Webhook Integrations", included: true },
      { label: "White-label Dashboard", included: false },
    ],
    cta: "Get Started",
  },
  {
    name: "Growth",
    price: "$499",
    featured: true,
    features: [
      { label: "3,000 Call Minutes", included: true },
      { label: "Unlimited AI Agents", included: true },
      { label: "Advanced CRM Syncing", included: true },
      { label: "Priority Support", included: true },
    ],
    cta: "Start 14-Day Free Trial",
  },
  {
    name: "Enterprise",
    price: "Custom",
    featured: false,
    features: [
      { label: "Unlimited Everything", included: true },
      { label: "On-Premise Hosting Opt.", included: true },
      { label: "Dedicated Account Manager", included: true },
      { label: "Custom LLM Fine-tuning", included: true },
    ],
    cta: "Contact Sales",
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="px-margin-mobile py-unit-2xl md:px-margin-desktop">
      <div className="mx-auto max-w-container-max">
        <div className="mb-unit-xl text-center">
          <h2 className="text-headline-lg text-headline-lg mb-unit-sm">
            Plans for Every Scale
          </h2>
          <p className="text-body-md text-body-md text-on-surface-variant">
            Simple consumption-based pricing with no hidden fees.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-unit-lg lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "glass-card relative flex flex-col rounded-3xl p-unit-xl",
                plan.featured && "z-10 scale-105 border-2 border-primary shadow-2xl",
              )}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-label-sm uppercase tracking-widest text-primary-foreground">
                  Most Popular
                </div>
              )}
              <div className="mb-unit-lg">
                <h3 className="text-headline-md text-headline-md mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== "Custom" && (
                    <span className="text-on-surface-variant">/mo</span>
                  )}
                </div>
              </div>
              <ul className="mb-unit-xl flex-grow space-y-unit-md">
                {plan.features.map((f) => (
                  <li
                    key={f.label}
                    className={cn(
                      "flex items-center gap-2",
                      !f.included && "opacity-40",
                    )}
                  >
                    <Icon
                      name={f.included ? "check_circle" : "remove_circle"}
                      className={cn(
                        "size-4",
                        f.included && "text-emerald-500",
                      )}
                    />
                    {f.label}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={cn(
                  "w-full rounded-xl py-4 text-center font-bold transition-all hover:scale-[1.02] active:scale-[0.98]",
                  plan.featured
                    ? "bg-primary text-primary-foreground"
                    : "border border-primary text-primary hover:bg-primary/5",
                )}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
