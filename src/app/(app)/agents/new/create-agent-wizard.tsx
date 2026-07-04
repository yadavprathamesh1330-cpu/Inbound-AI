"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Icon } from "@/components/ui-custom/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AGENT_PRESETS } from "@/lib/agent-presets";
import type { Integration } from "@/generated/prisma/client";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
];

const OBJECTIVE_OPTIONS: {
  value: string;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "LEAD_COLLECTION",
    label: "Lead Collection",
    description: "Capture caller contact details and intent.",
    icon: "person_add",
  },
  {
    value: "APPOINTMENT_BOOKING",
    label: "Appointment Booking",
    description: "Book calls directly into your calendar.",
    icon: "calendar_month",
  },
  {
    value: "ANSWER_FAQS",
    label: "Answer FAQs",
    description: "Resolve common questions using your knowledge base.",
    icon: "help",
  },
  {
    value: "TRANSFER_CALLS",
    label: "Transfer Calls",
    description: "Route callers to the right teammate.",
    icon: "call_merge",
  },
  {
    value: "TAKE_MESSAGES",
    label: "Take Messages",
    description: "Record messages for callback follow-up.",
    icon: "edit_note",
  },
  {
    value: "CUSTOMER_SUPPORT",
    label: "Customer Support",
    description: "Resolve issues and support requests.",
    icon: "support_agent",
  },
  {
    value: "SALES",
    label: "Sales",
    description: "Recommend products and drive conversions.",
    icon: "shopping_cart",
  },
];

const INTEGRATION_META: Record<
  string,
  { label: string; icon: string }
> = {
  GOOGLE_SHEETS: { label: "Google Sheets", icon: "table_chart" },
  GOOGLE_CALENDAR: { label: "Google Calendar", icon: "calendar_month" },
  SLACK: { label: "Slack", icon: "forum" },
  WEBHOOK: { label: "Webhook", icon: "webhook" },
  HUBSPOT: { label: "HubSpot", icon: "hub" },
  SALESFORCE: { label: "Salesforce", icon: "mail" },
  ZOHO: { label: "Zoho", icon: "database" },
};

const wizardSchema = z.object({
  // Step 1
  businessName: z.string().min(1, "Business name is required"),
  industry: z.string().optional(),
  businessDescription: z.string().optional(),
  businessHoursMonFri: z.string().optional(),
  businessHoursSat: z.string().optional(),
  businessHoursSun: z.string().optional(),
  website: z.string().optional(),
  timezone: z.string().min(1),
  languages: z.string().min(1),

  // Step 3
  voiceGender: z.enum(["MALE", "FEMALE"]),
  voiceAccent: z.enum(["INDIAN", "AMERICAN", "BRITISH"]),
  speakingSpeed: z.number().min(0.5).max(2.0),
  voiceStyle: z.string().optional(),

  // Step 4
  systemPrompt: z.string().optional(),
  greeting: z.string().optional(),
  fallbackResponses: z.string().optional(),
  transferRules: z.string().optional(),
  businessRules: z.string().optional(),
  customInstructions: z.string().optional(),

  // Step 5
  objectives: z.array(z.string()).min(1, "Select at least one objective"),

  // Step 6
  phoneMode: z.enum(["buy", "existing"]),
  phoneNumber: z.string().optional(),
  workingHours: z.string().optional(),
  voicemailEnabled: z.boolean(),

  // Agent name (used across steps)
  name: z.string().min(1, "Agent name is required"),
});

type WizardValues = z.infer<typeof wizardSchema>;

const STEP_FIELDS: Record<number, (keyof WizardValues)[]> = {
  1: ["name", "businessName", "industry", "businessDescription", "website", "timezone", "languages"],
  2: [],
  3: ["voiceGender", "voiceAccent", "speakingSpeed", "voiceStyle"],
  4: ["systemPrompt", "greeting", "fallbackResponses", "transferRules", "businessRules", "customInstructions"],
  5: ["objectives"],
  6: ["phoneMode", "phoneNumber", "workingHours", "voicemailEnabled"],
  7: [],
};

const STEP_TITLES = [
  { title: "Business Information", subtitle: "Tell us about your brand. This helps the AI understand your voice and mission." },
  { title: "Knowledge Base", subtitle: "Upload documents, crawl your website, or add FAQs to train your agent." },
  { title: "Voice & Persona", subtitle: "Select the auditory identity for your agent." },
  { title: "Prompt & Behavior", subtitle: "Define exactly how your agent should speak and respond." },
  { title: "Primary Objectives", subtitle: "What should this agent prioritize during interactions?" },
  { title: "Phone Number", subtitle: "Connect a number so callers can reach this agent." },
  { title: "Integrations", subtitle: "Connect your agent to the tools your team already uses." },
];

const TOTAL_STEPS = 7;

export function CreateAgentWizard({ integrations }: { integrations: Integration[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedIntegrationIds, setSelectedIntegrationIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState(1);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [aiInstruction, setAiInstruction] = useState("");
  const [generatingPrompt, setGeneratingPrompt] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      name: "",
      businessName: "",
      industry: "",
      businessDescription: "",
      businessHoursMonFri: "9:00 AM - 6:00 PM",
      businessHoursSat: "10:00 AM - 2:00 PM",
      businessHoursSun: "Closed",
      website: "",
      timezone: "America/New_York",
      languages: "en",
      voiceGender: "FEMALE",
      voiceAccent: "AMERICAN",
      speakingSpeed: 1.0,
      voiceStyle: "",
      systemPrompt: "",
      greeting: "",
      fallbackResponses: "",
      transferRules: "",
      businessRules: "",
      customInstructions: "",
      objectives: [],
      phoneMode: "existing",
      phoneNumber: "",
      workingHours: "9:00 AM - 6:00 PM",
      voicemailEnabled: true,
    },
  });

  const values = watch();

  async function goNext() {
    const fields = STEP_FIELDS[step];
    if (fields.length > 0) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    if (step < TOTAL_STEPS) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      await handleSubmit(onSubmit)();
    }
  }

  function goBack() {
    if (step > 1) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }

  function applyPreset(id: string) {
    const preset = AGENT_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setPresetId(id);
    // Pre-fill; every field stays editable in later steps.
    const v = preset.values;
    setValue("name", v.name, { shouldValidate: true });
    setValue("industry", v.industry);
    setValue("voiceGender", v.voiceGender);
    setValue("voiceAccent", v.voiceAccent);
    setValue("voiceStyle", v.voiceStyle);
    setValue("systemPrompt", v.systemPrompt);
    setValue("greeting", v.greeting);
    setValue("fallbackResponses", v.fallbackResponses);
    setValue("transferRules", v.transferRules);
    setValue("businessRules", v.businessRules);
    setValue("objectives", v.objectives, { shouldValidate: true });
  }

  async function generateWithAI() {
    setGeneratingPrompt(true);
    try {
      const res = await fetch("/api/agents/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: values.businessName,
          industry: values.industry,
          businessDescription: values.businessDescription,
          objectives: values.objectives,
          instruction: aiInstruction || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't generate the prompt.");
        return;
      }
      setValue("systemPrompt", data.systemPrompt, { shouldValidate: true });
      // Only fill the greeting if the user hasn't written one yet.
      if (data.greeting && !values.greeting) {
        setValue("greeting", data.greeting);
      }
      toast.success("AI wrote your prompt — tweak it however you like.");
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setGeneratingPrompt(false);
    }
  }

  function toggleObjective(objective: string) {
    const current = values.objectives ?? [];
    const next = current.includes(objective)
      ? current.filter((o) => o !== objective)
      : [...current, objective];
    setValue("objectives", next, { shouldValidate: true });
  }

  function toggleIntegration(id: string) {
    setSelectedIntegrationIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }

  async function onSubmit(data: WizardValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          businessName: data.businessName,
          industry: data.industry || undefined,
          businessDescription: data.businessDescription || undefined,
          businessHours: {
            mon_fri: data.businessHoursMonFri || undefined,
            sat: data.businessHoursSat || undefined,
            sun: data.businessHoursSun || undefined,
          },
          website: data.website || undefined,
          timezone: data.timezone,
          languages: data.languages
            .split(",")
            .map((l) => l.trim())
            .filter(Boolean),
          voiceGender: data.voiceGender,
          voiceAccent: data.voiceAccent,
          speakingSpeed: data.speakingSpeed,
          voiceStyle: data.voiceStyle || undefined,
          systemPrompt: data.systemPrompt || undefined,
          greeting: data.greeting || undefined,
          fallbackResponses: data.fallbackResponses || undefined,
          transferRules: data.transferRules || undefined,
          businessRules: data.businessRules || undefined,
          customInstructions: data.customInstructions || undefined,
          objectives: data.objectives,
          phoneNumber:
            data.phoneMode === "existing" && data.phoneNumber?.trim()
              ? {
                  mode: "existing",
                  e164: data.phoneNumber.trim(),
                  workingHours: { mon_fri: data.workingHours || undefined },
                  voicemailEnabled: data.voicemailEnabled,
                }
              : undefined,
          integrationIds: selectedIntegrationIds,
        }),
      });

      if (!res.ok) throw new Error("Failed to create agent");
      const agent = await res.json();
      toast.success("Agent created");
      router.push(`/agents/${agent.id}`);
    } catch {
      toast.error("Could not create agent. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-8">
      <div className="glass-card relative flex w-full max-w-4xl flex-col overflow-hidden">
        {/* Header & progress */}
        <div className="flex flex-col items-center px-margin-mobile pb-4 pt-6 md:px-margin-desktop">
          <div className="mb-6 flex items-center gap-2">
            <span className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface">
              Omni AI
            </span>
            <div className="mx-2 h-4 w-px bg-outline-variant" />
            <span className="text-label-md font-label-md text-on-surface-variant">
              Agent Architect
            </span>
          </div>
          <div className="flex items-center gap-3">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
              const idx = i + 1;
              const active = idx === step;
              const done = idx < step;
              return (
                <div
                  key={idx}
                  className={cn(
                    "h-2 rounded-full bg-outline-variant transition-all",
                    active ? "w-8 bg-primary" : "w-2",
                    done && "bg-primary",
                  )}
                />
              );
            })}
          </div>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-outline">
            Step {step} of {TOTAL_STEPS}
          </p>
        </div>

        {/* Step content */}
        <div className="relative min-h-[420px] flex-grow overflow-hidden px-margin-mobile pb-4 md:px-margin-desktop">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.section
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col"
            >
              <div className="mb-6">
                <h1 className="font-headline-lg text-headline-lg text-on-surface">
                  {STEP_TITLES[step - 1].title}
                </h1>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  {STEP_TITLES[step - 1].subtitle}
                </p>
              </div>

              {step === 1 && (
                <div className="mb-unit-lg">
                  <Label className="mb-2 block text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Start from a trucking template (optional)
                  </Label>
                  <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
                    {AGENT_PRESETS.map((preset) => {
                      const selected = presetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyPreset(preset.id)}
                          className={cn(
                            "glass-card flex flex-col items-start gap-2 rounded-2xl p-unit-md text-left transition-all hover:scale-[1.01] active:scale-[0.99]",
                            selected
                              ? "border-2 border-primary shadow-md"
                              : "border border-outline-variant/40",
                          )}
                        >
                          <Icon
                            name={preset.icon}
                            className={cn("size-7", selected ? "text-primary" : "text-secondary")}
                          />
                          <span className="text-label-md font-bold text-on-surface">
                            {preset.label}
                          </span>
                          <span className="text-label-sm text-on-surface-variant">
                            {preset.tagline}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-label-sm text-on-surface-variant">
                    Templates pre-fill the prompt, voice, and objectives — you can edit everything in the next steps.
                  </p>
                </div>
              )}

              {step === 1 && (
                <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Agent Name
                    </Label>
                    <Input placeholder="e.g. Athena Support" {...register("name")} />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Business Name
                    </Label>
                    <Input placeholder="e.g. Summit Freight Lines" {...register("businessName")} />
                    {errors.businessName && (
                      <p className="text-xs text-destructive">{errors.businessName.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Industry
                    </Label>
                    <Input placeholder="e.g. Truck Dispatch, Parts Sales, Repair Shop" {...register("industry")} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Website
                    </Label>
                    <Input placeholder="e.g. summitfreightlines.com" {...register("website")} />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Business Description
                    </Label>
                    <Textarea
                      rows={3}
                      placeholder="Briefly describe what your business does..."
                      {...register("businessDescription")}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Timezone
                    </Label>
                    <Select
                      value={values.timezone}
                      onValueChange={(v) => setValue("timezone", v as string)}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Select timezone" />
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
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Languages
                    </Label>
                    <Input placeholder="en, es" {...register("languages")} />
                    <p className="text-xs text-outline">Comma-separated language codes.</p>
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Business Hours
                    </Label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <Input placeholder="Mon-Fri, e.g. 9am-6pm" {...register("businessHoursMonFri")} />
                      <Input placeholder="Saturday, e.g. 10am-2pm" {...register("businessHoursSat")} />
                      <Input placeholder="Sunday, e.g. Closed" {...register("businessHoursSun")} />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-grow flex-col gap-6">
                  <div className="flex cursor-not-allowed flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-low p-10 opacity-70">
                    <Icon name="upload_file" className="mb-2 size-10 text-primary/40" />
                    <p className="text-subtitle-lg font-subtitle-lg text-on-surface">
                      Upload PDFs, DOCX, or FAQs
                    </p>
                    <p className="text-label-sm text-on-surface-variant">
                      Coming soon — file upload isn&apos;t wired up yet.
                    </p>
                    <span className="mt-3 rounded-full bg-surface-container px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-outline">
                      Coming soon
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-px flex-grow bg-outline-variant" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                      Or
                    </span>
                    <div className="h-px flex-grow bg-outline-variant" />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2 rounded-2xl border border-outline-variant p-4 opacity-70">
                      <p className="flex items-center gap-2 text-label-md font-bold text-on-surface">
                        <Icon name="language" className="size-4" />
                        Website Crawl
                      </p>
                      <Input placeholder="https://yourwebsite.com" disabled />
                      <span className="w-fit rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-outline">
                        Coming soon
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 rounded-2xl border border-outline-variant p-4 opacity-70">
                      <p className="flex items-center gap-2 text-label-md font-bold text-on-surface">
                        <Icon name="help" className="size-4" />
                        FAQs
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        Add question/answer pairs for your agent.
                      </p>
                      <span className="w-fit rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-outline">
                        Coming soon
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 rounded-2xl border border-outline-variant p-4 opacity-70">
                      <p className="flex items-center gap-2 text-label-md font-bold text-on-surface">
                        <Icon name="shopping_cart" className="size-4" />
                        Services / Products
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        List what your business offers.
                      </p>
                      <span className="w-fit rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-outline">
                        Coming soon
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 rounded-2xl border border-outline-variant p-4 opacity-70">
                      <p className="flex items-center gap-2 text-label-md font-bold text-on-surface">
                        <Icon name="security" className="size-4" />
                        Policies
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        Refund, cancellation, and support policies.
                      </p>
                      <span className="w-fit rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-outline">
                        Coming soon
                      </span>
                    </div>
                  </div>
                  <p className="text-label-sm text-on-surface-variant">
                    You can skip this step for now and add knowledge sources later from the Knowledge Base page.
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-gutter">
                  <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                        Voice Gender
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["FEMALE", "MALE"] as const).map((gender) => (
                          <button
                            type="button"
                            key={gender}
                            onClick={() => setValue("voiceGender", gender)}
                            className={cn(
                              "flex items-center justify-center gap-2 rounded-xl border border-outline-variant py-3 text-label-md font-bold transition-all",
                              values.voiceGender === gender
                                ? "border-primary bg-primary/5 text-primary"
                                : "text-on-surface-variant hover:bg-surface-container-low",
                            )}
                          >
                            <Icon
                              name={gender === "FEMALE" ? "record_voice_over" : "mic"}
                              className="size-4"
                            />
                            {gender === "FEMALE" ? "Female" : "Male"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                        Voice Accent
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["AMERICAN", "BRITISH", "INDIAN"] as const).map((accent) => (
                          <button
                            type="button"
                            key={accent}
                            onClick={() => setValue("voiceAccent", accent)}
                            className={cn(
                              "rounded-xl border border-outline-variant py-3 text-label-sm font-bold transition-all",
                              values.voiceAccent === accent
                                ? "border-primary bg-primary/5 text-primary"
                                : "text-on-surface-variant hover:bg-surface-container-low",
                            )}
                          >
                            {accent[0] + accent.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                        Speaking Speed
                      </Label>
                      <span className="font-mono-label text-primary">
                        {values.speakingSpeed?.toFixed(2)}x
                      </span>
                    </div>
                    <Slider
                      min={0.5}
                      max={2.0}
                      step={0.05}
                      value={[values.speakingSpeed ?? 1.0]}
                      onValueChange={(v) => {
                        const arr = v as number[];
                        setValue("speakingSpeed", arr[0]);
                      }}
                    />
                    <div className="flex justify-between text-[11px] text-outline">
                      <span>0.5x (Slow)</span>
                      <span>1.0x (Normal)</span>
                      <span>2.0x (Fast)</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Voice Style
                    </Label>
                    <Input
                      placeholder="e.g. warm and professional, energetic and youthful"
                      {...register("voiceStyle")}
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
                  {/* Write with AI */}
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-unit-md md:col-span-2">
                    <div className="mb-1.5 flex items-center gap-2">
                      <Icon name="stars" className="size-5 text-primary" />
                      <p className="text-label-md font-bold text-on-surface">
                        Write with AI
                      </p>
                    </div>
                    <p className="mb-3 text-label-sm text-on-surface-variant">
                      Not sure what to write? Describe what this agent should do
                      and AI will draft a professional prompt from your business
                      info. You can edit it afterwards.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={aiInstruction}
                        onChange={(e) => setAiInstruction(e.target.value)}
                        placeholder="e.g. Answer dispatch calls, take load details, transfer breakdowns"
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={generateWithAI}
                        disabled={generatingPrompt}
                        className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-label-md font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                      >
                        <Icon
                          name={generatingPrompt ? "hourglass_empty" : "stars"}
                          className={cn("size-4", generatingPrompt && "animate-spin")}
                        />
                        {generatingPrompt ? "Writing…" : "Generate"}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      System Prompt
                    </Label>
                    <Textarea
                      rows={6}
                      placeholder="You are the voice agent for..."
                      {...register("systemPrompt")}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Greeting
                    </Label>
                    <Textarea
                      rows={2}
                      placeholder="Hi, thanks for calling..."
                      {...register("greeting")}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Fallback Responses
                    </Label>
                    <Textarea rows={3} {...register("fallbackResponses")} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Transfer Rules
                    </Label>
                    <Textarea rows={3} {...register("transferRules")} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Business Rules
                    </Label>
                    <Textarea rows={3} {...register("businessRules")} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Custom Instructions
                    </Label>
                    <Textarea rows={3} {...register("customInstructions")} />
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-3">
                  {OBJECTIVE_OPTIONS.map((objective) => {
                    const checked = values.objectives?.includes(objective.value);
                    return (
                      <div
                        key={objective.value}
                        onClick={() => toggleObjective(objective.value)}
                        className={cn(
                          "flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-shadow hover:shadow-md",
                          checked
                            ? "border-primary bg-primary/5"
                            : "border-outline-variant bg-surface",
                        )}
                      >
                        <div className="flex size-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                          <Icon name={objective.icon} className="size-5" />
                        </div>
                        <div className="flex-grow">
                          <p className="text-label-md font-bold text-on-surface">
                            {objective.label}
                          </p>
                          <p className="text-label-sm text-on-surface-variant">
                            {objective.description}
                          </p>
                        </div>
                        <Checkbox checked={checked} className="size-5" />
                      </div>
                    );
                  })}
                  {errors.objectives && (
                    <p className="text-xs text-destructive">{errors.objectives.message}</p>
                  )}
                </div>
              )}

              {step === 6 && (
                <div className="flex flex-col gap-gutter">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled
                      className="flex cursor-not-allowed flex-col items-start gap-2 rounded-2xl border border-outline-variant p-4 text-left opacity-60"
                    >
                      <Icon name="add_circle" className="size-6 text-primary" />
                      <p className="font-bold text-on-surface">Buy a number</p>
                      <p className="text-label-sm text-on-surface-variant">
                        Purchase a new Twilio number for this agent.
                      </p>
                      <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-outline">
                        Coming soon
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("phoneMode", "existing")}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all",
                        values.phoneMode === "existing"
                          ? "border-primary bg-primary/5"
                          : "border-outline-variant hover:bg-surface-container-low",
                      )}
                    >
                      <Icon name="call_merge" className="size-6 text-primary" />
                      <p className="font-bold text-on-surface">Connect existing number</p>
                      <p className="text-label-sm text-on-surface-variant">
                        Use a Twilio number you already own.
                      </p>
                    </button>
                  </div>

                  {values.phoneMode === "existing" && (
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                        Phone Number (E.164)
                      </Label>
                      <Input placeholder="+15551234567" {...register("phoneNumber")} />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Working Hours
                    </Label>
                    <Input placeholder="e.g. 9:00 AM - 6:00 PM" {...register("workingHours")} />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-outline-variant p-4">
                    <div>
                      <p className="text-label-md font-bold text-on-surface">Voicemail</p>
                      <p className="text-label-sm text-on-surface-variant">
                        Let callers leave a message outside working hours.
                      </p>
                    </div>
                    <Switch
                      checked={values.voicemailEnabled}
                      onCheckedChange={(v) => setValue("voicemailEnabled", !!v)}
                    />
                  </div>
                </div>
              )}

              {step === 7 && (
                <div className="flex flex-col gap-gutter">
                  {integrations.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-outline-variant p-8 text-center">
                      <Icon name="webhook" className="mx-auto mb-3 size-8 text-outline" />
                      <p className="text-label-md font-bold text-on-surface">
                        No integrations connected yet
                      </p>
                      <p className="mt-1 text-label-sm text-on-surface-variant">
                        Connect integrations from the Integrations page, then attach them to
                        agents here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {integrations.map((integration) => {
                        const meta = INTEGRATION_META[integration.provider];
                        const checked = selectedIntegrationIds.includes(integration.id);
                        const connected = integration.status === "CONNECTED";
                        return (
                          <div
                            key={integration.id}
                            onClick={() => connected && toggleIntegration(integration.id)}
                            className={cn(
                              "flex items-start gap-3 rounded-2xl border p-4 transition-all",
                              connected ? "cursor-pointer" : "cursor-not-allowed opacity-50",
                              checked
                                ? "border-primary bg-primary/5"
                                : "border-outline-variant bg-surface",
                            )}
                          >
                            <div className="flex size-12 items-center justify-center rounded-xl bg-surface-container-low shadow-sm">
                              <Icon name={meta?.icon ?? "webhook"} className="size-5 text-secondary" />
                            </div>
                            <div className="flex-grow">
                              <p className="font-bold text-on-surface">
                                {meta?.label ?? integration.provider}
                              </p>
                              <p className="text-label-sm text-on-surface-variant">
                                {connected ? "Connected" : "Not connected"}
                              </p>
                            </div>
                            <Checkbox checked={checked} disabled={!connected} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-label-sm text-on-surface-variant">
                    Only connected integrations can be attached to this agent. Manage
                    connections from the{" "}
                    <Link href="/integrations" className="text-secondary underline">
                      Integrations
                    </Link>{" "}
                    page.
                  </p>
                </div>
              )}
            </motion.section>
          </AnimatePresence>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low/50 px-margin-mobile py-4 md:px-margin-desktop">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2.5 font-semibold text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-30"
          >
            <Icon name="arrow_back" className="size-4" />
            Back
          </button>
          <div className="flex gap-3">
            <Link
              href="/agents"
              className="flex items-center px-4 py-2.5 font-semibold text-on-surface-variant transition-colors hover:text-on-surface"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={goNext}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-primary px-8 py-2.5 font-bold text-primary-foreground shadow-lg shadow-primary/10 transition-transform hover:scale-[0.99] disabled:opacity-60"
            >
              {step === TOTAL_STEPS ? (
                <>
                  {submitting ? "Launching…" : "Launch Agent"}
                  <Icon name="rocket_launch" className="size-4" />
                </>
              ) : (
                <>
                  Next
                  <Icon name="arrow_forward" className="size-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
