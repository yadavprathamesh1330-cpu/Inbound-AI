import { z } from "zod";

const base = {
  type: z.enum(["BROKER", "CARRIER", "DRIVER", "SHIPPER", "OTHER"]).optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  mcNumber: z.string().optional(),
  dotNumber: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
};

export const contactCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  ...base,
});

export const contactUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  ...base,
});

export type ContactInput = z.infer<typeof contactUpdateSchema>;

export interface ContactScalarData {
  type?: "BROKER" | "CARRIER" | "DRIVER" | "SHIPPER" | "OTHER";
  name?: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  mcNumber?: string | null;
  dotNumber?: string | null;
  city?: string | null;
  state?: string | null;
  notes?: string | null;
}

function cleanStr(v: string | undefined): string | null | undefined {
  if (v === undefined) return undefined;
  const t = v.trim();
  return t === "" ? null : t;
}

export function toContactData(input: ContactInput): ContactScalarData {
  const data: ContactScalarData = {};
  if (input.type) data.type = input.type;
  if (input.name !== undefined) data.name = input.name.trim();
  if ("company" in input) data.company = cleanStr(input.company);
  if ("phone" in input) data.phone = cleanStr(input.phone);
  if ("email" in input) data.email = cleanStr(input.email);
  if ("mcNumber" in input) data.mcNumber = cleanStr(input.mcNumber);
  if ("dotNumber" in input) data.dotNumber = cleanStr(input.dotNumber);
  if ("city" in input) data.city = cleanStr(input.city);
  if ("state" in input) data.state = cleanStr(input.state);
  if ("notes" in input) data.notes = cleanStr(input.notes);
  return data;
}
