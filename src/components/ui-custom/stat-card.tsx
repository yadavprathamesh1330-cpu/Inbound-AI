import { Icon } from "@/components/ui-custom/icon";
import { AnimatedCounter } from "@/components/ui-custom/animated-counter";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  trend?: {
    direction: "up" | "down" | "neutral";
    label: string;
  };
  extra?: React.ReactNode;
}

export function StatCard({
  label,
  value,
  icon,
  prefix,
  suffix,
  decimals,
  trend,
  extra,
}: StatCardProps) {
  return (
    <GlassCard className="flex items-start justify-between p-unit-md">
      <div>
        <p className="text-label-sm font-medium text-on-surface-variant">
          {label}
        </p>
        <h3 className="mt-2 text-display-xl-mobile font-bold text-on-surface">
          <AnimatedCounter
            value={value}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
          />
        </h3>
        {trend && (
          <span
            className={cn(
              "mt-2 inline-flex items-center text-xs font-bold",
              trend.direction === "up" && "text-emerald-600",
              trend.direction === "down" && "text-destructive",
              trend.direction === "neutral" && "text-on-surface-variant",
            )}
          >
            {trend.direction === "up" && (
              <Icon name="trending_up" className="mr-1 size-3.5" />
            )}
            {trend.label}
          </span>
        )}
        {extra}
      </div>
      <div className="rounded-xl bg-secondary/10 p-3">
        <Icon name={icon} className="size-5 text-secondary" />
      </div>
    </GlassCard>
  );
}
