---
name: Omni AI Design System
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fe'
  surface-container: '#ededf9'
  surface-container-high: '#e7e7f3'
  surface-container-highest: '#e1e2ed'
  on-surface: '#191b23'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3039'
  inverse-on-surface: '#f0f0fb'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#575e70'
  on-secondary: '#ffffff'
  secondary-container: '#d9dff5'
  on-secondary-container: '#5c6274'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dce2f7'
  secondary-fixed-dim: '#c0c6db'
  on-secondary-fixed: '#141b2b'
  on-secondary-fixed-variant: '#404758'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ed'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 72px
    fontWeight: '700'
    lineHeight: 80px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  subtitle-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 30px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
  stack-xl: 48px
---

## Brand & Style
The design system embodies a "High-Performance Luxury" aesthetic, merging the precision of developer-centric tools with the refinement of premium consumer electronics. It targets enterprise decision-makers who value both technological edge and operational reliability.

The style is a sophisticated hybrid:
- **Minimalism & Space:** Expansive white space and rigorous alignment inspired by Apple and Linear.
- **Glassmorphism:** Subdued translucent layers for contextual overlays and navigation, echoing OpenAI's interface depth.
- **Micro-interactions:** Magnetic button behaviors and glowing state transitions that provide a "live" feel to AI-driven workflows.
- **Atmospheric Depth:** Multi-layered shadows and subtle gradients that move away from flat design toward a more tactile, premium digital environment.

## Colors
The palette is rooted in a "Professional Tech" spectrum. 
- **Primary (Royal Blue):** Used for primary actions, focus states, and key brand moments. It should be used sparingly to maintain high signal-to-noise ratios.
- **Deep Navy:** Reserved for high-contrast typography and structural sidebar elements to provide a sense of grounded authority.
- **Off-white/Slate Background:** Provides a soft, low-strain canvas that makes white surface cards "pop" with subtle elevation.
- **Functional Colors:** Success, Warning, and Danger use standard semantic hues but are often accompanied by subtle background tints (10% opacity) for status badges and alerts.

## Typography
This design system utilizes **Inter** exclusively to ensure a systematic, utilitarian, and modern feel. 

- **Hero Titles:** Use tight letter spacing (-0.02em) and bold weights to create impact and a "tech-forward" editorial look.
- **Subtitles:** Rendered in Medium weights with a slightly muted slate color to provide hierarchy without competing with primary headlines.
- **Monospace Accents:** While Inter is the primary face, numerical data in tables or code snippets should utilize a monospaced variant for alignment and technical precision.
- **Readability:** Line heights are generous (1.5x for body) to ensure clarity in data-dense SaaS environments.

## Layout & Spacing
The layout follows a strict **12-column fluid grid** for desktop, transitioning to 8 columns for tablet and 4 columns for mobile.

- **Grid Logic:** Use 24px gutters to allow the UI to breathe. 
- **Vertical Rhythm:** A base-8 spacing scale is enforced. All margins and paddings must be multiples of 8px (or 4px for tight internal component spacing).
- **Whitespace:** Emphasize "Generous Whitespace." Group related items with tight spacing (8px-16px) but separate distinct sections with large gaps (48px-80px) to prevent cognitive overload.
- **Mobile Reflow:** For mobile views, margins reduce to 20px, and large display type scales down aggressively to maintain visual balance within the narrow viewport.

## Elevation & Depth
Depth is created through a combination of **Tonal Layering** and **Soft Multi-layered Shadows**.

- **Shadows:** Avoid harsh, single-layer black shadows. Use "Ambient Shadows"—three stacked layers with increasing blur and very low opacity (e.g., 2%, 4%, and 8%) to mimic natural light.
- **Glassmorphism:** Use for persistent navigation bars and dropdown menus. Apply a `backdrop-filter: blur(12px)` with a semi-transparent white fill (`rgba(255, 255, 255, 0.7)`).
- **Glows:** High-priority elements (like an active Voice Agent status) should use a soft primary-colored outer glow rather than a standard shadow to indicate "activity" and "innovation."

## Shapes
The shape language is consistently "Rounded" to evoke a sense of approachability and modern software craftsmanship.

- **Base Radius:** 16px (`rounded-lg`) is the standard for cards and primary containers.
- **Small Components:** 8px (`rounded-md`) for buttons, input fields, and tags.
- **Interactive Elements:** Use 16px for hover-state backgrounds to match the card containers they sit within.
- **Inner vs Outer Radius:** When nesting elements, ensure the inner radius is 4-8px smaller than the outer radius to maintain geometric harmony.

## Components
- **Magnetic Buttons:** Primary buttons should have a subtle "magnetic" hover effect where the label moves slightly toward the cursor. Use a solid Royal Blue background with white text and a 1px inner light border.
- **Glass Cards:** High-level dashboard cards use a white background at 80% opacity with a 1px border colored `#E2E8F0`. On hover, the border should transition to a subtle primary gradient.
- **Glowing Gradient Borders:** For "AI-active" states, apply a 2px border using a linear gradient (Primary Blue to Success Green) with a soft outer blur.
- **Input Fields:** Use the Slate-50 background for idle states, transitioning to White with a Royal Blue 2px ring on focus.
- **Skeleton Loaders:** Use a shimmering "wave" animation moving left-to-right, utilizing a gradient from `#F1F5F9` to `#E2E8F0`.
- **Interactive States:** All clickable elements must have a defined hover state (subtle scale-up of 1.02x) and an active/pressed state (subtle scale-down of 0.98x).