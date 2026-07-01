import { SiteNav } from "@/components/marketing/site-nav";
import { HeroSection } from "@/components/marketing/hero-section";
import { LiveDemoSection } from "@/components/marketing/live-demo-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { VoiceGallerySection } from "@/components/marketing/voice-gallery-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { SiteFooter } from "@/components/marketing/site-footer";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden bg-surface font-body-md text-on-surface selection:bg-primary/10 selection:text-primary">
      <SiteNav />
      <main className="pt-20">
        <HeroSection />
        <LiveDemoSection />
        <FeaturesSection />
        <VoiceGallerySection />
        <PricingSection />
        <FaqSection />
        <section className="px-margin-mobile py-unit-2xl text-center md:px-margin-desktop">
          <div className="mx-auto max-w-3xl rounded-3xl bg-gradient-to-br from-primary/10 to-transparent p-unit-xl glass-card">
            <h2 className="text-display-xl-mobile text-on-background mb-unit-md md:text-display-xl">
              Ready to scale your voice operations?
            </h2>
            <p className="text-body-lg text-body-lg text-on-surface-variant mb-unit-lg">
              Join 500+ businesses who&rsquo;ve automated their reception with
              Omni AI.
            </p>
            <div className="flex flex-col justify-center gap-unit-md sm:flex-row">
              <Link
                href="/signup"
                className="rounded-xl bg-primary px-12 py-5 text-headline-md text-headline-md font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Started Free
              </Link>
              <a
                href="mailto:sales@omni-ai.example.com"
                className="rounded-xl bg-on-background px-12 py-5 text-headline-md text-headline-md font-bold text-surface transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Schedule Demo
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
