"use client";

import { motion } from "framer-motion";
import { Icon } from "@/components/ui-custom/icon";
import { cn } from "@/lib/utils";

export function Fab({
  icon = "add",
  label,
  onClick,
  className,
}: {
  icon?: string;
  label?: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      aria-label={label ?? "Create"}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "fixed bottom-8 right-8 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl",
        className,
      )}
    >
      <Icon name={icon} className="size-6" />
    </motion.button>
  );
}
