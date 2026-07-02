"use client";

import { useState } from "react";
import { Icon } from "@/components/ui-custom/icon";
import { cn } from "@/lib/utils";

const voices = [
  { name: "Aria", meta: "Female • American English • Dispatch-Ready" },
  { name: "Julian", meta: "Male • American English • Parts Counter" },
  { name: "Priya", meta: "Female • Indian English • Friendly" },
];

export function VoiceGallerySection() {
  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <section className="bg-on-background px-margin-mobile py-unit-2xl text-surface md:px-margin-desktop">
      <div className="mx-auto max-w-container-max">
        <div className="mb-unit-xl">
          <h2 className="text-headline-lg text-headline-lg">
            Human-Grade Voices
          </h2>
          <p className="text-body-md text-body-md text-outline-variant">
            Ultra-realistic neural voices your drivers, brokers, and customers
            will trust &mdash; choose the accent and style per line: dispatch,
            parts counter, or service desk.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-unit-lg md:grid-cols-3">
          {voices.map((voice) => {
            const isPlaying = playing === voice.name;
            return (
              <div
                key={voice.name}
                className={cn(
                  "group rounded-2xl border p-unit-lg transition-all",
                  isPlaying
                    ? "border-secondary/60 bg-surface/[0.09] shadow-[0_0_0_1px_rgba(49,107,243,0.35)]"
                    : "border-surface/15 bg-surface/[0.06] hover:border-surface/30 hover:bg-surface/10",
                )}
              >
                <div className="mb-unit-lg flex items-start justify-between">
                  <div>
                    <h4 className="text-headline-md text-surface">
                      &ldquo;{voice.name}&rdquo;
                    </h4>
                    <p className="text-label-md text-surface/70">{voice.meta}</p>
                  </div>
                  <button
                    onClick={() =>
                      setPlaying(isPlaying ? null : voice.name)
                    }
                    className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-white shadow-lg shadow-secondary/30 transition-transform hover:scale-110 active:scale-95"
                    aria-label={`Preview ${voice.name}`}
                  >
                    <Icon name={isPlaying ? "call_end" : "play_arrow"} className="size-5" />
                  </button>
                </div>
                <div className="flex h-8 items-center gap-1">
                  {[0.1, 0.2, 0.3, 0.4, 0.5].map((delay, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-full rounded-full transition-colors",
                        isPlaying
                          ? "animate-pulse bg-secondary-container"
                          : "bg-surface/25",
                      )}
                      style={{
                        height: isPlaying ? `${8 + i * 4}px` : "4px",
                        animationDelay: `${delay}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
