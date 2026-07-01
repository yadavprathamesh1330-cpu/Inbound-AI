import { Icon } from "@/components/ui-custom/icon";

const syncCards = [
  {
    icon: "calendar_today",
    color: "text-secondary",
    label: "Syncing with Google Calendar",
    detail: "New Event: Q3 Strategy Sync",
    border: "border-l-secondary",
  },
  {
    icon: "database",
    color: "text-emerald-500",
    label: "CRM Record Updated",
    detail: "Lead Status: Qualified",
    border: "border-l-emerald-500",
  },
  {
    icon: "notifications_active",
    color: "text-amber-500",
    label: "Slack Notification Sent",
    detail: "Channel: #sales-alerts",
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
            The Real-Time Edge
          </h2>
          <p className="text-body-md text-body-md text-on-surface-variant">
            Watch Omni book a meeting while syncing with a live CRM.
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
