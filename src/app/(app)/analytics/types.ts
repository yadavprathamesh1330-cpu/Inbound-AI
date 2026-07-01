import type { CallStatus, LeadStage, Sentiment } from "@/generated/prisma/client";

export interface AnalyticsCall {
  id: string;
  status: CallStatus;
  /** ISO string */
  startedAt: string;
  durationSeconds: number | null;
  sentiment: Sentiment | null;
  agentId: string;
  agentName: string;
}

export interface AnalyticsLead {
  id: string;
  stage: LeadStage;
  /** ISO string */
  createdAt: string;
}

export interface AnalyticsAppointment {
  id: string;
  /** ISO string */
  startsAt: string;
}
