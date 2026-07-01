import { Suspense } from "react";
import { AuthVisualPanel } from "@/components/auth/auth-visual-panel";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen">
      <AuthVisualPanel />
      <section className="relative flex w-full items-center justify-center bg-surface p-margin-mobile lg:w-1/2 md:p-margin-desktop">
        <div className="absolute left-margin-mobile top-8 lg:hidden">
          <span className="text-headline-md text-headline-md font-bold tracking-tight text-primary">
            Omni AI
          </span>
        </div>
        <div className="w-full max-w-md">
          <div className="mb-unit-xl text-center lg:text-left">
            <h2 className="text-headline-lg text-headline-lg mb-unit-xs text-on-surface">
              Welcome back
            </h2>
            <p className="text-body-md text-body-md text-on-surface-variant">
              Sign in to your enterprise dashboard.
            </p>
          </div>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
        <div className="absolute bottom-8 left-0 flex w-full flex-col items-center justify-center gap-unit-md px-margin-mobile opacity-60 md:flex-row md:gap-unit-xl">
          <a href="#" className="text-label-sm text-label-sm text-on-surface-variant hover:text-secondary">
            Privacy Policy
          </a>
          <a href="#" className="text-label-sm text-label-sm text-on-surface-variant hover:text-secondary">
            Terms of Service
          </a>
          <span className="hidden size-1 rounded-full bg-outline-variant md:block" />
          <span className="text-label-sm text-label-sm text-on-surface-variant">
            &copy; {new Date().getFullYear()} Omni AI
          </span>
        </div>
      </section>
    </main>
  );
}
