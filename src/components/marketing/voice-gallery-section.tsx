"use client";

import { useState } from "react";
import { Icon } from "@/components/ui-custom/icon";
import { cn } from "@/lib/utils";

const voices = [
  { name: "Aria", meta: "Female • American English • Professional" },
  { name: "Julian", meta: "Male • British English • Authoritative" },
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
            Preview our ultra-realistic neural voice engines &mdash; choose
            Indian, American, or British accents per agent.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-unit-lg md:grid-cols-3">
          {voices.map((voice) => {
            const isPlaying = playing === voice.name;
            return (
              <div
                key={voice.name}
                className="group rounded-2xl border border-outline-variant/20 bg-surface/5 p-unit-lg transition-all hover:bg-surface/10"
              >
                <div className="mb-unit-lg flex items-start justify-between">
                  <div>
                    <h4 className="text-headline-md text-headline-md">
                      &ldquo;{voice.name}&rdquo;
                    </h4>
                    <p className="text-label-md opacity-70">{voice.meta}</p>
                  </div>
                  <button
                    onClick={() =>
                      setPlaying(isPlaying ? null : voice.name)
                    }
                    className="flex size-12 items-center justify-center rounded-full bg-secondary text-white transition-transform hover:scale-110"
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
                        "w-full rounded-full bg-secondary/40",
                        isPlaying && "animate-pulse",
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
