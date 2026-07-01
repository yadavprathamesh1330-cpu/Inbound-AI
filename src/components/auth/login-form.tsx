"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui-custom/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MagneticButton } from "@/components/ui-custom/magnetic-button";
import Link from "next/link";

const schema = z.object({
  email: z.string().email("Enter a valid work email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const SUPABASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  async function onSubmit(values: z.infer<typeof schema>) {
    if (!SUPABASE_CONFIGURED) {
      toast.error("Supabase isn't configured yet — see .env.example");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    router.push(searchParams.get("next") ?? "/dashboard");
    router.refresh();
  }

  async function handleOAuth(provider: "google") {
    if (!SUPABASE_CONFIGURED) {
      toast.error("Supabase isn't configured yet — see .env.example");
      return;
    }
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <div className="glass-card rounded-xl border-outline-variant/30 p-unit-xl shadow-sm">
      {!SUPABASE_CONFIGURED && (
        <div className="mb-unit-lg rounded-lg border border-amber-200 bg-amber-50 p-unit-sm text-label-sm text-amber-800">
          Supabase Auth isn&rsquo;t configured yet. Add
          NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY to .env to
          enable sign-in.
        </div>
      )}
      <div className="mb-unit-xl space-y-unit-md">
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          className="flex h-14 w-full items-center justify-center gap-unit-md rounded-xl border border-outline-variant bg-white transition-all duration-200 hover:bg-surface-container-low"
        >
          <Icon name="language" className="size-5 text-secondary" />
          <span className="text-label-md text-label-md text-on-surface">
            Continue with Google
          </span>
        </button>
      </div>

      <div className="relative mb-unit-xl flex items-center">
        <div className="grow border-t border-outline-variant" />
        <span className="mx-4 shrink text-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
          Or email
        </span>
        <div className="grow border-t border-outline-variant" />
      </div>

      <form className="space-y-unit-lg" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-unit-xs">
          <Label htmlFor="email">Work Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            className="h-12"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-label-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-unit-xs">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <a href="#" className="text-label-sm text-label-sm text-secondary hover:underline">
              Forgot?
            </a>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="h-12 pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            >
              <Icon name="visibility" className="size-5" />
            </button>
          </div>
          {errors.password && (
            <p className="text-label-sm text-destructive">{errors.password.message}</p>
          )}
        </div>
        <MagneticButton
          type="submit"
          disabled={loading}
          className="flex h-14 w-full items-center justify-center gap-unit-sm text-label-md text-label-md disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In to Omni"}
          {!loading && <Icon name="arrow_forward" className="size-5" />}
        </MagneticButton>
      </form>

      <div className="mt-unit-xl text-center">
        <p className="text-body-md text-body-md text-on-surface-variant">
          Don&rsquo;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-secondary hover:underline">
            Create a workspace
          </Link>
        </p>
      </div>
    </div>
  );
}
