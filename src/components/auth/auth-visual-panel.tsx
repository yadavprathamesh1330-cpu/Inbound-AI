import { Icon } from "@/components/ui-custom/icon";

export function AuthVisualPanel() {
  return (
    <section className="relative hidden items-center justify-center overflow-hidden bg-inverse-surface lg:flex lg:w-1/2">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-1/3 size-72 rounded-full bg-secondary/30 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 size-72 rounded-full bg-emerald-500/20 blur-[100px]" />
        <svg
          className="absolute inset-0 size-full opacity-40"
          viewBox="0 0 800 800"
          fill="none"
        >
          <defs>
            <linearGradient id="authLineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b4c5ff" />
              <stop offset="100%" stopColor="#0051d5" />
            </linearGradient>
          </defs>
          <path
            d="M100 200C300 100 500 700 700 600"
            stroke="url(#authLineGradient)"
            strokeWidth="0.75"
            strokeDasharray="10 10"
            className="animate-[dash_5s_linear_infinite]"
          />
          <path
            d="M150 600C350 400 450 100 650 300"
            stroke="url(#authLineGradient)"
            strokeWidth="0.75"
            strokeDasharray="10 10"
            className="animate-[dash_5s_linear_infinite]"
            style={{ animationDelay: "-2s" }}
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-xl px-margin-desktop">
        <div className="mb-unit-xl">
          <span className="mb-unit-sm block text-headline-md text-headline-md font-bold tracking-tight text-white">
            Omni AI
          </span>
          <h1 className="mb-unit-md text-display-xl-mobile leading-tight text-white md:text-display-xl">
            The Intelligence Engine for Modern Enterprises.
          </h1>
          <p className="max-w-md text-body-lg text-body-lg text-white/70">
            High-performance AI voice workflows. Secure, scalable, and
            beautifully engineered.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-gutter">
          <div className="glass-card rounded-xl border-white/10 bg-white/10 p-unit-md">
            <Icon name="bolt" className="mb-unit-sm size-7 text-secondary-fixed-dim" />
            <p className="text-label-md text-label-md text-white">
              Latency-Optimized
            </p>
          </div>
          <div className="glass-card rounded-xl border-white/10 bg-white/10 p-unit-md">
            <Icon name="security" className="mb-unit-sm size-7 text-secondary-fixed-dim" />
            <p className="text-label-md text-label-md text-white">
              Enterprise Grade
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 left-margin-desktop flex items-center gap-unit-sm">
        <div className="size-2 animate-pulse rounded-full bg-secondary-fixed" />
        <span className="text-label-sm text-label-sm uppercase tracking-widest text-secondary-fixed">
          System Online &bull; v4.2.0
        </span>
      </div>
    </section>
  );
}
