import { cn } from "@/lib/utils";

export function VoicePulse({
  className,
  dotClassName,
  size = 16,
}: {
  className?: string;
  dotClassName?: string;
  size?: number;
}) {
  return (
    <div
      className={cn("voice-pulse", className)}
      style={{ width: size, height: size }}
    >
      <div />
      <div style={{ animationDelay: "0.5s" }} />
      <span
        className={cn(
          "relative z-10 rounded-full bg-secondary",
          dotClassName,
        )}
        style={{ width: size / 2, height: size / 2 }}
      />
    </div>
  );
}
