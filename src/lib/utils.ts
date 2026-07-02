import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Our design system defines custom font-size utilities in globals.css
 * (text-headline-md, text-body-lg, text-display-hero, …). tailwind-merge
 * doesn't know these are font sizes, so out of the box it treats them as
 * members of the `text-color` group. That means a call like
 *   cn("text-primary-foreground", "text-headline-md")
 * is seen as two conflicting text-colors and the *last* one wins — silently
 * dropping the real color and leaving text at the inherited foreground.
 * That surfaced as black-on-black buttons and washed-out labels.
 *
 * Registering the custom sizes in the `font-size` group keeps size and color
 * in separate conflict groups, so both survive the merge.
 */
const FONT_SIZES = [
  "display-hero",
  "display-hero-mobile",
  "display-xl",
  "display-xl-mobile",
  "headline-lg",
  "headline-md",
  "subtitle-lg",
  "body-lg",
  "body-md",
  "label-md",
  "label-sm",
  "mono-label",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: FONT_SIZES }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
