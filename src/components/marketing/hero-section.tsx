"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MagneticButton } from "@/components/ui-custom/magnetic-button";
import { Icon } from "@/components/ui-custom/icon";
import { HeroTranscriptDemo } from "@/components/marketing/hero-transcript-demo";

export function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative flex min-h-[900px] items-center overflow-hidden px-margin-mobile py-unit-2xl md:px-margin-desktop">
      <div className="mesh-gradient absolute inset-0 -z-10" />
      <div className="mx-auto grid w-full max-w-container-max grid-cols-1 items-center gap-unit-xl lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-unit-lg lg:col-span-7"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-label-sm text-primary">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Voice Agents v4.2 Now Live
          </div>
          <h1 className="text-display-hero-mobile text-display-hero-mobile leading-tight text-on-background md:text-display-hero">
            Deploy an AI Employee That{" "}
            <span className="text-secondary">Never Misses a Call.</span>
          </h1>
          <p className="max-w-xl text-body-lg text-body-lg text-on-surface-variant">
            The world&rsquo;s most human-like AI voice receptionist. Answer
            calls, qualify leads, book appointments, and sync every detail
            to your CRM &mdash; all in real time.
          </p>
          <div className="flex flex-col gap-unit-md pt-unit-sm sm:flex-row">
            <MagneticButton
              className="px-8 py-4 text-headline-md text-headline-md"
              onClick={() => router.push("/signup")}
            >
              Start Free
            </MagneticButton>
            <button
              className="glass-card flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-headline-md text-headline-md font-bold transition-colors hover:bg-surface-container-high"
              onClick={() =>
                document
                  .getElementById("platform")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Icon name="play_circle" className="size-5" />
              Watch Live Demo
            </button>
          </div>
          <div className="flex items-center gap-unit-md pt-unit-lg">
            <div className="flex -space-x-4">
              {["AW", "MC", "JS"].map((initials) => (
                <div
                  key={initials}
                  className="flex size-10 items-center justify-center rounded-full border-2 border-surface bg-primary text-xs font-bold text-primary-foreground"
                >
                  {initials}
                </div>
              ))}
            </div>
            <p className="text-label-md text-label-md text-on-surface-variant">
              Trusted by 5,000+ scaling companies
            </p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-5"
        >
          <HeroTranscriptDemo />
        </motion.div>
      </div>
    </section>
  );
}
