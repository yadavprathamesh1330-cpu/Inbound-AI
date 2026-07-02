import { Icon } from "@/components/ui-custom/icon";

const syncCards = [
  {
    icon: "local_shipping",
    color: "text-secondary",
    label: "Load Booked — Synced to Dispatch Sheet",
    detail: "Dallas → Atlanta • $2,850 • Fri 8:00 AM",
    border: "border-l-secondary",
  },
  {
    icon: "database",
    color: "text-emerald-500",
    label: "Parts Order Placed — Counter Notified",
    detail: "Kenworth T680 Brake Kit ×2 • Will-Call",
    border: "border-l-emerald-500",
  },
  {
    icon: "calendar_today",
    color: "text-amber-500",
    label: "Service Bay Booked — Google Calendar",
    detail: "PM Service + DOT Inspection • Thu 9:00 AM",
    border: "border-l-amber-500",
  },
];

export function LiveDemoSection() {
  return (
    <section
      id="platform"
      className="bg-surface-container-low/50 px-margin-mobile py-unit-2xl md:px-margin-desktop"
    >
      <div className="mx-auto max-w-container-max">
        <div className="mb-unit-xl text-center">
          <h2 className="text-headline-lg text-headline-lg mb-unit-sm">
            Dispatch, Parts &amp; Service — Handled in Real Time
          </h2>
          <p className="text-body-md text-body-md text-on-surface-variant">
            Watch Omni book a load, take a parts order, and schedule a service
            bay &mdash; while syncing everything to your systems live.
          </p>
        </div>
        <div className="space-y-unit-lg">
          {syncCards.map((card) => (
            <div
              key={card.label}
              className={`glass-card flex items-center gap-unit-md rounded-xl border-l-4 p-unit-md ${card.border}`}
            >
              <Icon name={card.icon} className={`size-6 ${card.color}`} />
              <div>
                <p className="text-label-md text-label-md text-on-surface-variant">
                  {card.label}
                </p>
                <p className="text-headline-md text-headline-md font-bold">
                  {card.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
