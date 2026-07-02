"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui-custom/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MagneticButton } from "@/components/ui-custom/magnetic-button";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Australia/Sydney",
];

const schema = z.object({
  orgName: z.string().min(2, "Enter your business name"),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  timezone: z.string().min(1),
});

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { timezone: "America/New_York", website: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setLoading(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ? "Please check the form and try again." : "Something went wrong.");
      return;
    }
    toast.success("Workspace created — let's build your first agent.");
    router.push("/agents/new?onboarding=1");
  }

  return (
    <div className="mesh-gradient flex min-h-screen items-center justify-center bg-background px-margin-mobile py-unit-2xl md:px-margin-desktop">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="mb-unit-xl text-center">
          <div className="mx-auto mb-unit-md flex size-14 items-center justify-center rounded-2xl bg-primary">
            <Icon name="smart_toy" className="size-7 text-primary-foreground" />
          </div>
          <h1 className="text-headline-lg text-headline-lg text-on-surface">
            Welcome to Omni AI
          </h1>
          <p className="mt-unit-sm text-body-md text-body-md text-on-surface-variant">
            Let&rsquo;s set up your workspace before we build your first AI
            voice agent.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="glass-card space-y-unit-lg rounded-2xl p-unit-xl"
        >
          <div className="space-y-unit-xs">
            <Label htmlFor="orgName">Business Name</Label>
            <Input
              id="orgName"
              placeholder="Summit Freight Lines"
              className="h-12"
              {...register("orgName")}
            />
            {errors.orgName && (
              <p className="text-label-sm text-destructive">{errors.orgName.message}</p>
            )}
          </div>

          <div className="space-y-unit-xs">
            <Label htmlFor="website">Website (optional)</Label>
            <Input
              id="website"
              placeholder="https://yourbusiness.com"
              className="h-12"
              {...register("website")}
            />
            {errors.website && (
              <p className="text-label-sm text-destructive">{errors.website.message}</p>
            )}
          </div>

          <div className="space-y-unit-xs">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={watch("timezone")}
              onValueChange={(v) => v && setValue("timezone", v)}
            >
              <SelectTrigger id="timezone" className="h-12 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <MagneticButton
            type="submit"
            disabled={loading}
            className="flex h-14 w-full items-center justify-center gap-unit-sm text-label-md text-label-md disabled:opacity-60"
          >
            {loading ? "Setting up..." : "Continue to create your agent"}
            {!loading && <Icon name="arrow_forward" className="size-5" />}
          </MagneticButton>
        </form>
      </motion.div>
    </div>
  );
}
