import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-unit-xl flex flex-col items-start justify-between gap-4 md:flex-row md:items-center",
        className,
      )}
    >
      <div>
        <h2 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-body-md text-on-surface-variant">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
