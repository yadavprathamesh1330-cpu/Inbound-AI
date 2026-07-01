import { Icon } from "@/components/ui-custom/icon";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass-card flex flex-col items-center justify-center gap-3 p-unit-2xl text-center",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-surface-container-low">
        <Icon name={icon} className="size-6 text-outline" />
      </div>
      <div>
        <h3 className="font-headline-md text-headline-md text-on-surface">
          {title}
        </h3>
        {description && (
          <p className="mt-1 max-w-sm text-body-md text-on-surface-variant">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
