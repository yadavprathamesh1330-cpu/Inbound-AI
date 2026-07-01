---
name: Omni AI Design System
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f4'
  surface-container: '#f0edee'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e5e2e3'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464c'
  inverse-surface: '#303031'
  inverse-on-surface: '#f3f0f1'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#575e70'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#141b2b'
  on-primary-container: '#7d8497'
  inverse-primary: '#c0c6db'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#261906'
  on-tertiary-container: '#968065'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce2f7'
  primary-fixed-dim: '#c0c6db'
  on-primary-fixed: '#141b2b'
  on-primary-fixed-variant: '#404758'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#f9debf'
  tertiary-fixed-dim: '#dcc2a4'
  on-tertiary-fixed: '#261906'
  on-tertiary-fixed-variant: '#55442d'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e5e2e3'
typography:
  display-xl:
    fontFamily: Inter
    fontSize: 60px
    fontWeight: '800'
    lineHeight: 72px
    letterSpacing: -0.02em
  display-xl-mobile:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
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
  label-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  mono-label:
    fontFamily: jetbrainsMono
    fontSize: 12px
    fontWeight: '500'
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
  margin-desktop: 40px
  margin-mobile: 16px
  unit-xs: 4px
  unit-sm: 8px
  unit-md: 16px
  unit-lg: 24px
  unit-xl: 48px
  unit-2xl: 80px
---

## Brand & Style
The design system embodies a premium, enterprise-grade aesthetic defined by precision, high-performance, and "quiet luxury." It is tailored for sophisticated users who value speed and clarity. The visual narrative draws from **Modern Minimalism** and **Glassmorphism**, focusing on high-contrast typography, deep-layered surfaces, and razor-sharp execution similar to industry leaders like Linear and Stripe. 

The emotional response should be one of absolute reliability and forward-thinking intelligence. The UI uses generous white space to reduce cognitive load while employing subtle motion and translucent materials to signify the "living" nature of AI voice agents.

## Colors
The palette is rooted in a deep Slate primary and a vibrant Royal Blue secondary. In the default light mode, the background uses a cool-toned off-white to reduce eye strain, while the dark mode shifts to a sophisticated "Midnight" depth.

- **Primary (#111827):** Used for core branding, primary buttons, and heavy headings to provide a grounded, authoritative feel.
- **Secondary (#2563EB):** Used for high-intent actions, progress indicators, and accentuating the "intelligence" of the AI.
- **Surface Strategy:** Surfaces use a pure white in light mode with subtle 1px borders (#E2E8F0) to define boundaries without heavy shadows.

## Typography
This design system utilizes **Inter** for its neutral yet modern character, ensuring high legibility across data-heavy interfaces. The hierarchy is extreme, with very large, tight-tracked display type for impact and highly readable, spacious body text for documentation and logs. 

- **Weight Usage:** Use "Bold" (700) and "Extra Bold" (800) for headlines to create an "editorial" feel.
- **Mono Accents:** Use JetBrains Mono for voice transcriptions, API keys, and technical status codes to differentiate "machine" output from "human" interface text.

## Layout & Spacing
The system employs a **12-column fluid grid** for desktop and a **4-column grid** for mobile. The spacing rhythm is based on a **8px base unit**, promoting mathematical harmony.

- **Desktop Layout:** 12 columns with 24px gutters. Use wide 40px margins to frame the content, giving it a "premium gallery" feel.
- **Mobile Layout:** 16px margins, stacking most 12-column elements into a single column.
- **Vertical Rhythm:** Use `unit-xl` (48px) and `unit-2xl` (80px) for section padding to maintain an airy, luxury atmosphere.

## Elevation & Depth
Depth is achieved through **Tonal Layering** and **Subtle Glassmorphism** rather than heavy shadows.

- **Level 0 (Base):** Background color.
- **Level 1 (Card/Surface):** Surface color with a 1px border (#E2E8F0) and a soft ambient shadow (0px 4px 6px -1px rgba(0,0,0,0.05)).
- **Level 2 (Modals/Popovers):** 12px Backdrop blur (20px) on semi-transparent surface (rgba(255, 255, 255, 0.8)) with a 1px white border for a "glass" effect.
- **Shadow Character:** Shadows are highly diffused with low opacity, using a subtle blue tint (primary color at 5% opacity) to maintain color harmony.

## Shapes
The shape language is sophisticated and approachable, utilizing a **Rounded** configuration. 

- **Standard Components:** Buttons and Inputs use a 12px-14px radius.
- **Container Elements:** Cards and Modals use a 16px-18px radius (defined as `rounded-xl` in this system).
- **Interactive Elements:** Active states or small badges may use 100% (pill) rounding to distinguish them from structural containers.

## Components
Consistent styling across all interactive elements ensures a cohesive premium experience.

- **Buttons:** 
  - *Primary:* Dark Slate (#111827) with white text, 14px radius, subtle inner border for depth.
  - *Secondary:* White background with 1px border (#E2E8F0), 14px radius.
- **Cards:** 18px corner radius, 1px border, light mode uses white background, dark mode uses a subtle gradient from #1E293B to #0F172A.
- **Input Fields:** 14px radius, #F1F5F9 background, focus state transitions to a 2px Royal Blue ring with high-contrast label typography.
- **Charts:** Use a refined palette of Royal Blue, Emerald, and Slate. Lines should have a 2px stroke width and subtle area gradients beneath them to imply volume.
- **Voice Pulse (Unique Component):** A specialized component for Omni AI. Uses concentric, semi-transparent rings of Royal Blue (#2563EB) that animate with a "breath" effect to indicate the AI is listening or speaking.