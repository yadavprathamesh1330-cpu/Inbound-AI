import { z } from "zod";

type LoadStatusValue =
  | "NEW"
  | "BOOKED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

/** Plain scalar shape, valid for both Prisma create and update `data`. */
export interface LoadScalarData {
  reference?: string | null;
  originCity?: string | null;
  originState?: string | null;
  destCity?: string | null;
  destState?: string | null;
  equipment?: string | null;
  commodity?: string | null;
  brokerName?: string | null;
  brokerMc?: string | null;
  brokerPhone?: string | null;
  rateConUrl?: string | null;
  notes?: string | null;
  weightLbs?: number | null;
  rateCents?: number | null;
  pickupDate?: Date | null;
  deliveryDate?: Date | null;
  status?: LoadStatusValue;
}

/** Shared validation + mapping for load create/update payloads. */
export const loadInputSchema = z.object({
  reference: z.string().optional(),
  originCity: z.string().optional(),
  originState: z.string().optional(),
  destCity: z.string().optional(),
  destState: z.string().optional(),
  equipment: z.string().optional(),
  commodity: z.string().optional(),
  weightLbs: z.number().int().nonnegative().nullable().optional(),
  rateDollars: z.number().nonnegative().nullable().optional(),
  pickupDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  brokerName: z.string().optional(),
  brokerMc: z.string().optional(),
  brokerPhone: z.string().optional(),
  rateConUrl: z.string().optional(),
  notes: z.string().optional(),
  agentId: z.string().optional(),
  status: z
    .enum(["NEW", "BOOKED", "IN_TRANSIT", "DELIVERED", "CANCELLED"])
    .optional(),
});

export type LoadInput = z.infer<typeof loadInputSchema>;

function cleanStr(v: string | undefined): string | null | undefined {
  if (v === undefined) return undefined;
  const t = v.trim();
  return t === "" ? null : t;
}

function cleanDate(v: string | undefined): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v.trim() === "") return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/** Maps a validated LoadInput to a plain scalar data object. */
export function toLoadData(input: LoadInput): LoadScalarData {
  const data: LoadScalarData = {};
  const s = (k: keyof LoadInput) => cleanStr(input[k] as string | undefined);

  if ("reference" in input) data.reference = s("reference");
  if ("originCity" in input) data.originCity = s("originCity");
  if ("originState" in input) data.originState = s("originState");
  if ("destCity" in input) data.destCity = s("destCity");
  if ("destState" in input) data.destState = s("destState");
  if ("equipment" in input) data.equipment = s("equipment");
  if ("commodity" in input) data.commodity = s("commodity");
  if ("brokerName" in input) data.brokerName = s("brokerName");
  if ("brokerMc" in input) data.brokerMc = s("brokerMc");
  if ("brokerPhone" in input) data.brokerPhone = s("brokerPhone");
  if ("rateConUrl" in input) data.rateConUrl = s("rateConUrl");
  if ("notes" in input) data.notes = s("notes");
  if ("weightLbs" in input) data.weightLbs = input.weightLbs ?? null;
  if ("rateDollars" in input) {
    data.rateCents =
      input.rateDollars == null ? null : Math.round(input.rateDollars * 100);
  }
  if ("pickupDate" in input) data.pickupDate = cleanDate(input.pickupDate);
  if ("deliveryDate" in input) data.deliveryDate = cleanDate(input.deliveryDate);
  if (input.status) data.status = input.status;

  return data;
}
