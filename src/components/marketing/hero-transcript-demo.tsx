"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const TRANSCRIPT = [
  { speaker: "Broker", text: "Hey, I've got a dry van load out of Dallas to Atlanta, picks up Friday morning. You got a truck?" },
  { speaker: "Omni AI", text: "We do — I have a 53' dry van deadheading near Dallas Thursday night. What's the rate and weight?" },
  { speaker: "Broker", text: "42,000 lbs, paying $2,850 all-in. Pickup's at 8 AM in Garland." },
  { speaker: "Omni AI", text: "That works. I've logged the load, notified dispatch, and sent you the carrier packet. Rate con to this number?" },
];

export function HeroTranscriptDemo() {
  const [visibleCount, setVisibleCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let index = 0;
    let timeout: ReturnType<typeof setTimeout>;

    function step() {
      index += 1;
      setVisibleCount(index);
      if (index >= TRANSCRIPT.length) {
        timeout = setTimeout(() => {
          setVisibleCount(0);
          index = 0;
          timeout = setTimeout(step, 800);
        }, 3000);
      } else {
        timeout = setTimeout(step, 1800);
      }
    }

    timeout = setTimeout(step, 800);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleCount]);

  return (
    <div className="glass-card relative flex min-h-[400px] flex-col justify-end overflow-hidden rounded-2xl p-unit-lg">
      <div className="absolute left-0 top-0 flex w-full items-center justify-between border-b border-outline-variant bg-surface-container-high/50 p-unit-md">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-destructive" />
          <div className="size-3 rounded-full bg-amber-400" />
          <div className="size-3 rounded-full bg-emerald-500" />
        </div>
        <span className="text-mono-label text-mono-label uppercase tracking-widest text-on-surface-variant">
          Incoming Call...
        </span>
      </div>
      <div
        ref={containerRef}
        className="custom-scrollbar h-[300px] space-y-unit-md overflow-y-auto py-unit-md"
      >
        <AnimatePresence>
          {TRANSCRIPT.slice(0, visibleCount).map((line, i) => (
            <motion.div
              key={`${visibleCount}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className={cn(
                "rounded-xl p-unit-md",
                line.speaker === "Omni AI"
                  ? "ml-8 border border-secondary/20 bg-secondary/10"
                  : "mr-8 bg-surface-container-high",
              )}
            >
              <p
                className={cn(
                  "mb-1 text-label-sm text-label-sm",
                  line.speaker === "Omni AI" ? "text-secondary" : "text-on-surface-variant",
                )}
              >
                {line.speaker}
              </p>
              <p className="text-body-md text-body-md">{line.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
