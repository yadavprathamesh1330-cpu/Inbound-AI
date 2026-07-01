import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  AgentStatus,
  VoiceGender,
  VoiceAccent,
  AgentObjective,
  CallStatus,
  Sentiment,
  LeadStage,
  KnowledgeSourceType,
  KnowledgeStatus,
  IntegrationProvider,
  IntegrationStatus,
  SubscriptionPlan,
  SubscriptionStatus,
} from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function daysAgo(n: number, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log("Seeding Omni AI demo data...");

  await prisma.notification.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.agentIntegration.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.call.deleteMany();
  await prisma.knowledgeDocument.deleteMany();
  await prisma.phoneNumber.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const org = await prisma.organization.create({
    data: {
      name: "Summit Realty Group",
      slug: "summit-realty",
      website: "https://summitrealtygroup.example.com",
      timezone: "America/New_York",
    },
  });

  const [owner, admin] = await Promise.all([
    prisma.user.create({
      data: {
        authId: "seed-owner-ava-whitfield",
        email: "ava@summitrealtygroup.example.com",
        name: "Ava Whitfield",
        role: "OWNER",
        organizationId: org.id,
      },
    }),
    prisma.user.create({
      data: {
        authId: "seed-admin-marcus-chen",
        email: "marcus@summitrealtygroup.example.com",
        name: "Marcus Chen",
        role: "ADMIN",
        organizationId: org.id,
      },
    }),
  ]);

  await prisma.subscription.create({
    data: {
      organizationId: org.id,
      plan: SubscriptionPlan.GROWTH,
      status: SubscriptionStatus.ACTIVE,
      minutesIncluded: 10000,
      minutesUsed: 4280,
      currentPeriodStart: daysAgo(26),
      currentPeriodEnd: daysAgo(-4),
      stripeCustomerId: "cus_seed_demo",
      stripeSubscriptionId: "sub_seed_demo",
    },
  });

  const agentDefs = [
    {
      name: "Clara",
      businessName: "Summit Realty Group",
      industry: "Real Estate",
      voiceGender: VoiceGender.FEMALE,
      voiceAccent: VoiceAccent.AMERICAN,
      objectives: [
        AgentObjective.CUSTOMER_SUPPORT,
        AgentObjective.ANSWER_FAQS,
      ],
      role: "Inbound Support",
      totalCalls: 1402,
      successRate: 99.2,
      status: AgentStatus.PUBLISHED,
    },
    {
      name: "Max",
      businessName: "Summit Realty Group",
      industry: "Real Estate",
      voiceGender: VoiceGender.MALE,
      voiceAccent: VoiceAccent.AMERICAN,
      objectives: [AgentObjective.SALES, AgentObjective.LEAD_COLLECTION],
      role: "Outbound Sales",
      totalCalls: 985,
      successRate: 97.8,
      status: AgentStatus.PUBLISHED,
    },
    {
      name: "Luna",
      businessName: "Summit Realty Group",
      industry: "Real Estate",
      voiceGender: VoiceGender.FEMALE,
      voiceAccent: VoiceAccent.BRITISH,
      objectives: [AgentObjective.APPOINTMENT_BOOKING],
      role: "Appointments",
      totalCalls: 2110,
      successRate: 98.1,
      status: AgentStatus.PUBLISHED,
    },
    {
      name: "Arthur",
      businessName: "Summit Realty Group",
      industry: "Real Estate",
      voiceGender: VoiceGender.MALE,
      voiceAccent: VoiceAccent.BRITISH,
      objectives: [AgentObjective.TAKE_MESSAGES],
      role: "Survey Lead",
      totalCalls: 756,
      successRate: 96.5,
      status: AgentStatus.PAUSED,
    },
  ];

  const agents = [];
  for (const def of agentDefs) {
    const agent = await prisma.agent.create({
      data: {
        name: def.name,
        status: def.status,
        businessName: def.businessName,
        industry: def.industry,
        businessDescription: `${def.role} agent for ${def.businessName}, handling ${def.objectives
          .join(", ")
          .toLowerCase()}.`,
        businessHours: { mon_fri: "9:00-18:00", sat: "10:00-14:00", sun: "closed" },
        website: "https://summitrealtygroup.example.com",
        timezone: "America/New_York",
        languages: ["en"],
        voiceGender: def.voiceGender,
        voiceAccent: def.voiceAccent,
        speakingSpeed: 1.0,
        voiceStyle: "warm-professional",
        systemPrompt: `You are ${def.name}, the ${def.role} voice agent for ${def.businessName}. Be concise, warm, and professional.`,
        greeting: `Hi, thanks for calling ${def.businessName}, this is ${def.name}. How can I help you today?`,
        fallbackResponses: "I'm not fully sure about that - let me get a teammate to follow up with you.",
        transferRules: "Transfer to a human when the caller explicitly asks for a person, or after 2 failed clarifications.",
        businessRules: "Never quote final pricing. Always collect a callback number before ending the call.",
        objectives: def.objectives,
        totalCalls: def.totalCalls,
        successRate: def.successRate,
        organizationId: org.id,
      },
    });
    agents.push(agent);
  }

  const [clara, max, luna, arthur] = agents;

  await prisma.phoneNumber.create({
    data: {
      e164: "+15550123001",
      label: "Main line",
      voicemailEnabled: true,
      workingHours: { mon_fri: "9:00-18:00" },
      organizationId: org.id,
      agentId: clara.id,
    },
  });
  await prisma.phoneNumber.create({
    data: {
      e164: "+15550123002",
      label: "Appointments line",
      voicemailEnabled: true,
      workingHours: { mon_fri: "9:00-18:00" },
      organizationId: org.id,
      agentId: luna.id,
    },
  });

  const knowledgeDefs = [
    { title: "Listings FAQ", sourceType: KnowledgeSourceType.FAQ, status: KnowledgeStatus.READY, chunkCount: 42, agentId: clara.id },
    { title: "Company Brochure.pdf", sourceType: KnowledgeSourceType.PDF, status: KnowledgeStatus.READY, chunkCount: 18, sizeBytes: 2_400_000, agentId: clara.id },
    { title: "summitrealtygroup.example.com", sourceType: KnowledgeSourceType.WEBSITE, status: KnowledgeStatus.READY, chunkCount: 96, sourceUrl: "https://summitrealtygroup.example.com", agentId: max.id },
    { title: "Pricing & Commission Policy.docx", sourceType: KnowledgeSourceType.DOCX, status: KnowledgeStatus.INDEXING, chunkCount: 0, sizeBytes: 540_000, agentId: max.id },
    { title: "Appointment Booking Rules.txt", sourceType: KnowledgeSourceType.TXT, status: KnowledgeStatus.READY, chunkCount: 6, sizeBytes: 12_000, agentId: luna.id },
    { title: "Neighborhood Guides.pdf", sourceType: KnowledgeSourceType.PDF, status: KnowledgeStatus.FAILED, chunkCount: 0, sizeBytes: 8_100_000, agentId: null },
  ];
  for (const k of knowledgeDefs) {
    await prisma.knowledgeDocument.create({
      data: { ...k, organizationId: org.id },
    });
  }

  const callSeeds = [
    { agent: clara, name: "Johnathan Smith", phone: "+15550120001", status: CallStatus.COMPLETED, sentiment: Sentiment.POSITIVE, score: 92, duration: 252, day: 0, hour: 10, minute: 42, summary: "Inquired about Q4 enterprise pricing and volume discounts.", service: "Enterprise listing package", next: "Send pricing sheet" },
    { agent: clara, name: "Sarah Williams", phone: "+15550120002", status: CallStatus.IN_PROGRESS, sentiment: Sentiment.NEUTRAL, score: 45, duration: 105, day: 0, hour: 10, minute: 38, summary: "Requested callback for technical support regarding portal access.", service: "Portal support", next: "Callback within 1 hour" },
    { agent: max, name: "Anonymous", phone: "+15550120003", status: CallStatus.FAILED, sentiment: Sentiment.NEGATIVE, score: 5, duration: 12, day: 0, hour: 10, minute: 15, summary: "Call dropped before AI could engage. Probable network issue.", service: null, next: "Retry outbound call" },
    { agent: max, name: "Tech Global Corp", phone: "+15550120004", status: CallStatus.COMPLETED, sentiment: Sentiment.POSITIVE, score: 98, duration: 502, day: 0, hour: 9, minute: 55, summary: "High-intent demo scheduled for Monday. Lead score updated.", service: "Commercial office space", next: "Confirm demo Monday 2pm" },
    { agent: luna, name: "Priya Patel", phone: "+15550120005", status: CallStatus.COMPLETED, sentiment: Sentiment.POSITIVE, score: 88, duration: 340, day: 1, hour: 14, minute: 5, summary: "Booked a viewing for the downtown loft listing.", service: "Downtown loft viewing", next: "Send confirmation email" },
    { agent: luna, name: "Daniel Ortiz", phone: "+15550120006", status: CallStatus.VOICEMAIL, sentiment: Sentiment.NEUTRAL, score: 30, duration: 40, day: 1, hour: 16, minute: 20, summary: "Left voicemail requesting a callback about rescheduling.", service: "Reschedule viewing", next: "Callback tomorrow" },
    { agent: arthur, name: "Grace Kim", phone: "+15550120007", status: CallStatus.COMPLETED, sentiment: Sentiment.NEUTRAL, score: 60, duration: 180, day: 2, hour: 11, minute: 0, summary: "Completed post-viewing satisfaction survey.", service: "Satisfaction survey", next: "No action needed" },
    { agent: clara, name: "Omar Haddad", phone: "+15550120008", status: CallStatus.COMPLETED, sentiment: Sentiment.POSITIVE, score: 77, duration: 210, day: 2, hour: 13, minute: 30, summary: "Asked about pet policy and move-in timeline.", service: "Pet-friendly rental", next: "Send pet policy doc" },
    { agent: max, name: "Linda Foster", phone: "+15550120009", status: CallStatus.MISSED, sentiment: null, score: null, duration: null, day: 3, hour: 9, minute: 10, summary: null, service: null, next: "Call back ASAP" },
    { agent: luna, name: "Chen Wei", phone: "+15550120010", status: CallStatus.COMPLETED, sentiment: Sentiment.POSITIVE, score: 95, duration: 410, day: 3, hour: 15, minute: 45, summary: "Booked appointment for waterfront condo tour.", service: "Waterfront condo", next: "Confirm tour Thursday 10am" },
    { agent: clara, name: "Isabella Rossi", phone: "+15550120011", status: CallStatus.COMPLETED, sentiment: Sentiment.NEGATIVE, score: 22, duration: 95, day: 4, hour: 12, minute: 0, summary: "Frustrated about delayed maintenance response.", service: "Maintenance complaint", next: "Escalate to property manager" },
    { agent: max, name: "Grand Vista Holdings", phone: "+15550120012", status: CallStatus.COMPLETED, sentiment: Sentiment.POSITIVE, score: 90, duration: 610, day: 5, hour: 10, minute: 20, summary: "Discussed bulk acquisition of 12 units.", service: "Bulk acquisition", next: "Prepare proposal deck" },
  ];

  const calls = [];
  for (const c of callSeeds) {
    const startedAt = daysAgo(c.day, c.hour, c.minute);
    const call = await prisma.call.create({
      data: {
        organizationId: org.id,
        agentId: c.agent.id,
        callerName: c.name,
        callerPhone: c.phone,
        status: c.status,
        direction: "inbound",
        startedAt,
        endedAt: c.duration ? new Date(startedAt.getTime() + c.duration * 1000) : null,
        durationSeconds: c.duration,
        sentiment: c.sentiment,
        leadScore: c.score,
        summary: c.summary,
        recordingUrl: c.status === CallStatus.COMPLETED ? `https://recordings.example.com/${org.slug}/${c.phone}.mp3` : null,
        transcript: c.summary
          ? [
              { speaker: "agent", text: c.agent.greeting },
              { speaker: "caller", text: c.summary },
              { speaker: "agent", text: "Got it, I'll take care of that for you right away." },
            ]
          : undefined,
        extractedName: c.name !== "Anonymous" ? c.name : null,
        extractedInterestedService: c.service,
        nextAction: c.next,
      },
    });
    calls.push({ call, seed: c });
  }

  const leadStageForScore = (score: number | null) => {
    if (score === null) return LeadStage.NEW;
    if (score >= 90) return LeadStage.WON;
    if (score >= 75) return LeadStage.APPOINTMENT;
    if (score >= 50) return LeadStage.QUALIFIED;
    if (score >= 20) return LeadStage.NEW;
    return LeadStage.LOST;
  };

  const leads = [];
  for (const { call, seed } of calls) {
    if (!seed.service) continue;
    const lead = await prisma.lead.create({
      data: {
        organizationId: org.id,
        agentId: seed.agent.id,
        callId: call.id,
        name: seed.name,
        phone: seed.phone,
        email: seed.name !== "Anonymous" ? `${seed.name.toLowerCase().replace(/\s+/g, ".")}@example.com` : null,
        stage: leadStageForScore(seed.score),
        interestedService: seed.service,
        score: seed.score,
        notes: seed.summary,
      },
    });
    leads.push(lead);
  }

  const appointmentCandidates = leads.filter((l) => l.stage === LeadStage.APPOINTMENT || l.stage === LeadStage.WON);
  for (const [i, lead] of appointmentCandidates.entries()) {
    const start = daysAgo(-(i + 1), 10 + i, 0);
    await prisma.appointment.create({
      data: {
        organizationId: org.id,
        leadId: lead.id,
        title: `Property tour with ${lead.name}`,
        startsAt: start,
        endsAt: new Date(start.getTime() + 45 * 60 * 1000),
        location: "Summit Realty Group - Main Office",
        notes: lead.notes,
      },
    });
  }

  const integrationDefs: {
    provider: IntegrationProvider;
    status: IntegrationStatus;
    config?: object;
  }[] = [
    { provider: IntegrationProvider.GOOGLE_SHEETS, status: IntegrationStatus.CONNECTED, config: { spreadsheetName: "Omni AI - Call Log" } },
    { provider: IntegrationProvider.GOOGLE_CALENDAR, status: IntegrationStatus.CONNECTED, config: { calendarName: "Summit Realty Appointments" } },
    { provider: IntegrationProvider.SLACK, status: IntegrationStatus.DISCONNECTED },
    { provider: IntegrationProvider.WEBHOOK, status: IntegrationStatus.CONNECTED, config: { url: "https://hooks.example.com/omni-ai" } },
    { provider: IntegrationProvider.HUBSPOT, status: IntegrationStatus.DISCONNECTED },
    { provider: IntegrationProvider.SALESFORCE, status: IntegrationStatus.DISCONNECTED },
    { provider: IntegrationProvider.ZOHO, status: IntegrationStatus.DISCONNECTED },
  ];
  for (const i of integrationDefs) {
    await prisma.integration.create({
      data: {
        organizationId: org.id,
        provider: i.provider,
        status: i.status,
        config: i.config,
        connectedAt: i.status === IntegrationStatus.CONNECTED ? daysAgo(20) : null,
      },
    });
  }

  await prisma.apiKey.create({
    data: {
      organizationId: org.id,
      name: "Production server key",
      keyPrefix: "oai_live_",
      keyHash: "seed-demo-hash-not-a-real-secret",
      lastUsedAt: daysAgo(1),
    },
  });

  await prisma.notification.createMany({
    data: [
      { organizationId: org.id, title: "Luna booked a new appointment", body: "Waterfront condo tour confirmed for Thursday 10am." },
      { organizationId: org.id, title: "Knowledge document failed to index", body: "Neighborhood Guides.pdf needs to be re-uploaded." },
      { organizationId: org.id, title: "Minutes usage at 43%", body: "4,280 of 10,000 minutes used this billing period." },
    ],
  });

  console.log(`Seed complete: org=${org.slug}, users=${[owner, admin].length}, agents=${agents.length}, calls=${calls.length}, leads=${leads.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
