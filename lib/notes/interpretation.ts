import { cache } from "react";
import { z } from "zod";

import { getAllAccounts } from "@/lib/data/accounts";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import type { NormalizedAccountRecord } from "@/types/account";

const INTERPRETATION_TABLE = "account_note_interpretations";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_TIMEOUT_MS = 15_000;

const vibeSchema = z.enum(["positive", "neutral", "negative"]);
const confidenceSchema = z.enum(["high", "medium", "low"]);

const openAiInterpretationSchema = z.object({
  overall_summary: z.string().trim().min(1),
  relationship_vibe: vibeSchema,
  growth_vibe: vibeSchema,
  primary_driver: z.string().trim().min(1),
  recommended_action_summary: z.string().trim().min(1),
  confidence: confidenceSchema,
  mixed_signals: z.array(z.string().trim().min(1)).max(3),
});

const cacheRecordSchema = z.object({
  account_id: z.string().min(1),
  normalized_note_text: z.string().min(1),
  overall_account_summary: z.string().trim().min(1),
  relationship_vibe: vibeSchema,
  growth_vibe: vibeSchema,
  primary_driver: z.string().trim().min(1).nullish(),
  recommended_action_summary: z.string().trim().min(1).nullish(),
  confidence: confidenceSchema.nullish(),
  mixed_signals: z.array(z.string().trim().min(1)).max(3).nullish(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export type NoteVibe = z.infer<typeof vibeSchema>;

export type AccountNoteInterpretation = {
  accountId: string;
  normalizedNoteText: string;
  overallSummary: string;
  relationshipVibe: NoteVibe;
  growthVibe: NoteVibe;
  primaryDriver: string;
  recommendedActionSummary: string;
  confidence: z.infer<typeof confidenceSchema>;
  mixedSignals: string[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type AccountNoteInterpretationResult =
  | {
      status: "available";
      source: "cache" | "live";
      interpretation: AccountNoteInterpretation;
    }
  | {
      status: "unavailable";
      source: "empty" | "error";
      reason: string;
      normalizedNoteText: string | null;
    };

type CacheRecord = z.infer<typeof cacheRecordSchema>;

type InterpretationDeps = {
  loadCachedInterpretation?: (
    accountId: string,
  ) => Promise<AccountNoteInterpretation | null>;
  saveCachedInterpretation?: (
    interpretation: AccountNoteInterpretation,
  ) => Promise<void>;
  requestInterpretation?: (
    normalizedNoteText: string,
  ) => Promise<Omit<AccountNoteInterpretation, "accountId" | "normalizedNoteText" | "createdAt" | "updatedAt">>;
};

function mapCacheRecord(record: CacheRecord): AccountNoteInterpretation {
  const overallSummary = record.overall_account_summary;
  const primaryDriver = ensureDistinctPrimaryDriver(
    overallSummary,
    record.primary_driver ?? overallSummary,
  );

  return {
    accountId: record.account_id,
    normalizedNoteText: record.normalized_note_text,
    overallSummary,
    relationshipVibe: record.relationship_vibe,
    growthVibe: record.growth_vibe,
    primaryDriver,
    recommendedActionSummary: ensureDistinctRecommendedActionSummary(
      overallSummary,
      primaryDriver,
      record.recommended_action_summary ?? overallSummary,
    ),
    confidence: record.confidence ?? "medium",
    mixedSignals: record.mixed_signals ?? [],
    createdAt: record.created_at ?? null,
    updatedAt: record.updated_at ?? null,
  };
}

type PortfolioInterpretationContext = {
  arrValues: number[];
  pipelineValues: number[];
  contractionValues: number[];
};

function normalizeInterpretationText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function formatPrimaryDriverClause(clause: string) {
  const trimmed = clause.trim().replace(/\s+/g, " ");

  if (!trimmed) {
    return null;
  }

  const sentence = trimmed.replace(/[.;,:]+$/g, "");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

function derivePrimaryDriverFromSummary(summary: string) {
  const compactSummary = summary.trim().replace(/\s+/g, " ");

  if (!compactSummary) {
    return summary;
  }

  const clauses = compactSummary
    .split(/(?:[.;]|\bbut\b|\bhowever\b|\bwhile\b)/i)
    .map((clause) => formatPrimaryDriverClause(clause))
    .filter((clause): clause is string => Boolean(clause));
  const priorityKeywords = [
    "renewal",
    "urgent",
    "service",
    "support",
    "usage",
    "adoption",
    "nps",
    "sentiment",
    "contraction",
    "churn",
    "pipeline",
    "expansion",
  ];

  for (const keyword of priorityKeywords) {
    const matchingClause = clauses.find((clause) =>
      clause.toLowerCase().includes(keyword),
    );

    if (matchingClause) {
      return matchingClause;
    }
  }

  return clauses[0] ?? compactSummary;
}

function ensureDistinctPrimaryDriver(
  overallSummary: string,
  primaryDriver: string,
) {
  const normalizedSummary = normalizeInterpretationText(overallSummary);
  const normalizedDriver = normalizeInterpretationText(primaryDriver);

  if (!normalizedDriver) {
    return derivePrimaryDriverFromSummary(overallSummary);
  }

  if (
    normalizedDriver === normalizedSummary ||
    normalizedSummary.includes(normalizedDriver)
  ) {
    return derivePrimaryDriverFromSummary(overallSummary);
  }

  return primaryDriver.trim().replace(/\s+/g, " ");
}

function deriveRecommendedActionSummary(
  overallSummary: string,
  primaryDriver: string,
) {
  const normalizedSource = normalizeInterpretationText(
    [primaryDriver, overallSummary].filter(Boolean).join(" "),
  );

  if (
    normalizedSource.includes("renewal") &&
    (normalizedSource.includes("service") ||
      normalizedSource.includes("support"))
  ) {
    return "Escalate service recovery now and align the sponsor on a renewal stabilisation plan.";
  }

  if (
    normalizedSource.includes("service") ||
    normalizedSource.includes("support")
  ) {
    return "Escalate the service issues, close the critical gaps, and give the customer a clear recovery plan.";
  }

  if (
    normalizedSource.includes("usage") ||
    normalizedSource.includes("adoption")
  ) {
    return "Run targeted recovery outreach with the affected teams and track whether adoption begins to rebound.";
  }

  if (
    normalizedSource.includes("pipeline") ||
    normalizedSource.includes("expansion")
  ) {
    return "Validate the growth path with the sponsor and convert the next concrete expansion step.";
  }

  if (
    normalizedSource.includes("confidence") ||
    normalizedSource.includes("relationship")
  ) {
    return "Reset stakeholder alignment and document the next conversation needed to rebuild confidence.";
  }

  return "Use the current account signals to run a focused follow-up plan and confirm whether conditions improve over the next two weeks.";
}

function ensureDistinctRecommendedActionSummary(
  overallSummary: string,
  primaryDriver: string,
  recommendedActionSummary: string,
) {
  const normalizedSummary = normalizeInterpretationText(overallSummary);
  const normalizedRecommendation = normalizeInterpretationText(
    recommendedActionSummary,
  );

  if (
    !normalizedRecommendation ||
    normalizedRecommendation === normalizedSummary ||
    normalizedSummary.includes(normalizedRecommendation)
  ) {
    return deriveRecommendedActionSummary(overallSummary, primaryDriver);
  }

  return recommendedActionSummary.trim().replace(/\s+/g, " ");
}

const getPortfolioInterpretationContext = cache(
  async (): Promise<PortfolioInterpretationContext> => {
    const accounts = await getAllAccounts();

    return {
      arrValues: accounts
        .map((account) => account.arr_gbp)
        .filter((value): value is number => value !== null)
        .sort((left, right) => left - right),
      pipelineValues: accounts
        .map((account) => account.expansion_pipeline_gbp)
        .filter((value): value is number => value !== null)
        .sort((left, right) => left - right),
      contractionValues: accounts
        .map((account) => account.contraction_risk_gbp)
        .filter((value): value is number => value !== null)
        .sort((left, right) => left - right),
    };
  },
);

function getRelativePositionLabel(value: number | null, values: number[]) {
  if (value === null || values.length === 0) {
    return "Unavailable";
  }

  const belowOrEqual = values.filter((entry) => entry <= value).length;
  const percentile = values.length === 1 ? 100 : ((belowOrEqual - 1) / (values.length - 1)) * 100;

  if (percentile >= 75) {
    return "Top quartile in this portfolio";
  }

  if (percentile >= 50) {
    return "Upper half of this portfolio";
  }

  if (percentile >= 25) {
    return "Lower half of this portfolio";
  }

  return "Bottom quartile in this portfolio";
}

function getRenewalUrgencyLabel(account: NormalizedAccountRecord) {
  if (!account.renewal_date) {
    return "Unavailable";
  }

  const today = new Date();
  const renewalTimestamp = Date.parse(`${account.renewal_date}T00:00:00.000Z`);
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );

  if (Number.isNaN(renewalTimestamp)) {
    return "Unavailable";
  }

  const daysToRenewal = Math.max(
    0,
    Math.round((renewalTimestamp - todayUtc) / 86_400_000),
  );

  if (daysToRenewal <= 30) {
    return `High urgency (${daysToRenewal} days to renewal)`;
  }

  if (daysToRenewal <= 60) {
    return `Medium urgency (${daysToRenewal} days to renewal)`;
  }

  return `Lower urgency (${daysToRenewal} days to renewal)`;
}

function getAdoptionContextLabel(account: NormalizedAccountRecord) {
  if (
    account.seats_purchased === null ||
    account.seats_purchased <= 0 ||
    account.seats_used === null
  ) {
    return "Unavailable";
  }

  const seatUtilisation = account.seats_used / account.seats_purchased;

  if (seatUtilisation <= 0.25) {
    return "Very low overall adoption";
  }

  if (seatUtilisation <= 0.4) {
    return "Limited overall adoption";
  }

  if (seatUtilisation <= 0.6) {
    return "Partial overall adoption";
  }

  if (seatUtilisation <= 0.8) {
    return "Healthy overall adoption";
  }

  return "Very strong overall adoption";
}

function getUsageContextLabel(account: NormalizedAccountRecord) {
  if (
    account.usage_score_3m_ago === null ||
    account.usage_score_current === null
  ) {
    return "Unavailable";
  }

  const change = account.usage_score_current - account.usage_score_3m_ago;

  if (change <= -25) {
    return "Sharp usage decline";
  }

  if (change < 0) {
    return "Soft usage decline";
  }

  if (change === 0) {
    return "Flat usage trend";
  }

  if (change <= 20) {
    return "Moderate usage growth";
  }

  return "Strong usage growth";
}

function getServiceContextLabel(account: NormalizedAccountRecord) {
  const urgent = account.urgent_open_tickets_count ?? 0;
  const breaches = account.sla_breaches_90d ?? 0;
  const open = account.open_tickets_count ?? 0;

  if (urgent >= 4 || breaches >= 4) {
    return "Severe service pressure";
  }

  if (urgent >= 2 || breaches >= 2 || open >= 6) {
    return "Elevated service pressure";
  }

  if (open > 0) {
    return "Some service pressure";
  }

  return "Low current service pressure";
}

function getSentimentContextLabel(account: NormalizedAccountRecord) {
  if (account.latest_nps === null) {
    return "Unavailable";
  }

  if (account.latest_nps < 0) {
    return "Negative customer sentiment";
  }

  if (account.latest_nps < 30) {
    return "Mixed customer sentiment";
  }

  return "Positive customer sentiment";
}

function getDataGapLabels(account: NormalizedAccountRecord) {
  const checks = [
    ["renewal_date", account.renewal_date],
    ["arr_gbp", account.arr_gbp],
    ["seats_purchased", account.seats_purchased],
    ["seats_used", account.seats_used],
    ["usage_score_3m_ago", account.usage_score_3m_ago],
    ["usage_score_current", account.usage_score_current],
    ["latest_nps", account.latest_nps],
    ["open_tickets_count", account.open_tickets_count],
    ["urgent_open_tickets_count", account.urgent_open_tickets_count],
    ["sla_breaches_90d", account.sla_breaches_90d],
    ["expansion_pipeline_gbp", account.expansion_pipeline_gbp],
    ["contraction_risk_gbp", account.contraction_risk_gbp],
    ["recent_customer_note", account.recent_customer_note],
    ["recent_sales_note", account.recent_sales_note],
    ["recent_support_summary", account.recent_support_summary],
  ] as const;

  return checks
    .filter(([, value]) => value === null)
    .map(([label]) => label)
    .concat(Object.keys(account.coercion_failures).map((key) => `${key}_invalid`));
}

export async function buildNormalizedNoteInterpretationInput(
  account: NormalizedAccountRecord,
) {
  const noteFields = [
    ["recent_customer_note", account.recent_customer_note],
    ["recent_sales_note", account.recent_sales_note],
    ["recent_support_summary", account.recent_support_summary],
  ] as const;
  const noteContent = noteFields
    .map(([label, value]) => {
      const normalized = value?.trim().toLowerCase();
      return normalized ? `${label}: ${normalized}` : null;
    })
    .filter((value): value is string => Boolean(value));

  if (noteContent.length === 0) {
    return null;
  }

  const portfolioContext = await getPortfolioInterpretationContext();

  const contextLines = [
    `account_name: ${(account.account_name ?? "null").trim().toLowerCase()}`,
    `arr_importance: ${getRelativePositionLabel(account.arr_gbp, portfolioContext.arrValues).toLowerCase()}`,
    `renewal_urgency: ${getRenewalUrgencyLabel(account).toLowerCase()}`,
    `adoption_context: ${getAdoptionContextLabel(account).toLowerCase()}`,
    `usage_context: ${getUsageContextLabel(account).toLowerCase()}`,
    `service_context: ${getServiceContextLabel(account).toLowerCase()}`,
    `customer_sentiment_context: ${getSentimentContextLabel(account).toLowerCase()}`,
    `pipeline_context: ${getRelativePositionLabel(account.expansion_pipeline_gbp, portfolioContext.pipelineValues).toLowerCase()}`,
    `contraction_risk_context: ${getRelativePositionLabel(account.contraction_risk_gbp, portfolioContext.contractionValues).toLowerCase()}`,
    `data_gaps: ${
      getDataGapLabels(account)
        .map((label) => label.toLowerCase())
        .join(", ") || "none"
    }`,
    ...noteContent,
  ];

  return contextLines.join("\n");
}

export async function requestNoteInterpretationFromOpenAI(
  normalizedAccountContext: string,
) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You interpret account context for a decision-support product. Use the structured context labels and notes together. Reconcile conflicts explicitly instead of silently picking one signal. If notes suggest a problem in a subset of teams but the aggregate metric looks healthy, say that the metric is healthy overall but uneven in key teams. Do not restate note claims as global facts when the structured metrics point differently. Do not infer that ARR is healthy just because it is large, or that pipeline is attractive just because it exists. Treat commercial size as significance, not positivity. Do not describe a renewal date itself as stable, healthy, or positive. Only mention renewal timing when it creates urgency or materially affects the decision. Return only structured JSON with a concise account summary, relationship vibe, growth vibe, primary driver, recommended action summary, confidence, and up to three mixed-signal callouts. The primary driver must be distinct from the overall summary and isolate the single most urgent decision factor.",
        },
        {
          role: "user",
          content: [
            "Interpret this account context for leadership review.",
            "Use the metrics and notes together.",
            "Summarize the overall account context in 1-2 sentences.",
            "When notes and structured metrics conflict, explain the tension explicitly.",
            "Prefer wording like 'overall X, but Y in key teams' when that better matches the evidence.",
            "Do not describe a renewal date as stable; mention renewal only if it creates near-term pressure or is materially relevant.",
            "Classify relationship vibe as positive, neutral, or negative.",
            "Classify growth vibe as positive, neutral, or negative.",
            "Return a short primary driver explaining what matters most right now.",
            "Make primary_driver shorter than overall_summary, materially different from it, and focused on one urgent factor rather than a broad recap.",
            "If the overall summary already covers several issues, primary_driver should name only the most decision-relevant one.",
            "Return a short recommended action summary grounded in the evidence.",
            "Return confidence as high, medium, or low.",
            "Return mixed_signals as short bullet-like strings describing contradictions or ambiguity.",
            "",
            normalizedAccountContext,
          ].join("\n"),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "account_note_interpretation",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              overall_summary: {
                type: "string",
              },
              relationship_vibe: {
                type: "string",
                enum: ["positive", "neutral", "negative"],
              },
              growth_vibe: {
                type: "string",
                enum: ["positive", "neutral", "negative"],
              },
              primary_driver: {
                type: "string",
              },
              recommended_action_summary: {
                type: "string",
              },
              confidence: {
                type: "string",
                enum: ["high", "medium", "low"],
              },
              mixed_signals: {
                type: "array",
                items: {
                  type: "string",
                },
                maxItems: 3,
              },
            },
            required: [
              "overall_summary",
              "relationship_vibe",
              "growth_vibe",
              "primary_driver",
              "recommended_action_summary",
              "confidence",
              "mixed_signals",
            ],
          },
        },
      },
    }),
    signal: AbortSignal.timeout(OPENAI_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error("OpenAI response did not include structured content.");
  }

  const parsed = openAiInterpretationSchema.parse(JSON.parse(content));
  const primaryDriver = ensureDistinctPrimaryDriver(
    parsed.overall_summary,
    parsed.primary_driver,
  );

  return {
    overallSummary: parsed.overall_summary,
    relationshipVibe: parsed.relationship_vibe,
    growthVibe: parsed.growth_vibe,
    primaryDriver,
    recommendedActionSummary: ensureDistinctRecommendedActionSummary(
      parsed.overall_summary,
      primaryDriver,
      parsed.recommended_action_summary,
    ),
    confidence: parsed.confidence,
    mixedSignals: parsed.mixed_signals,
  };
}

async function loadCachedInterpretationFromSupabase(accountId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from(INTERPRETATION_TABLE)
    .select("*")
    .eq("account_id", accountId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const parsed = cacheRecordSchema.safeParse(data);
  return parsed.success ? mapCacheRecord(parsed.data) : null;
}

async function saveCachedInterpretationToSupabase(
  interpretation: AccountNoteInterpretation,
) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from(INTERPRETATION_TABLE).upsert(
    {
      account_id: interpretation.accountId,
      normalized_note_text: interpretation.normalizedNoteText,
      overall_account_summary: interpretation.overallSummary,
      relationship_vibe: interpretation.relationshipVibe,
      growth_vibe: interpretation.growthVibe,
      primary_driver: interpretation.primaryDriver,
      recommended_action_summary: interpretation.recommendedActionSummary,
      confidence: interpretation.confidence,
      mixed_signals: interpretation.mixedSignals,
    },
    {
      onConflict: "account_id",
    },
  );

  if (!error) {
    return;
  }

  await supabase.from(INTERPRETATION_TABLE).upsert(
    {
      account_id: interpretation.accountId,
      normalized_note_text: interpretation.normalizedNoteText,
      overall_account_summary: interpretation.overallSummary,
      relationship_vibe: interpretation.relationshipVibe,
      growth_vibe: interpretation.growthVibe,
    },
    {
      onConflict: "account_id",
    },
  );
}

const getDefaultAccountInterpretation = cache(
  async (accountId: string, normalizedNoteText: string) => {
    const cached = await loadCachedInterpretationFromSupabase(accountId);

    if (cached && cached.normalizedNoteText === normalizedNoteText) {
      return {
        status: "available" as const,
        source: "cache" as const,
        interpretation: cached,
      };
    }

    const fresh = await requestNoteInterpretationFromOpenAI(normalizedNoteText);
    const interpretation: AccountNoteInterpretation = {
      accountId,
      normalizedNoteText,
      overallSummary: fresh.overallSummary,
      relationshipVibe: fresh.relationshipVibe,
      growthVibe: fresh.growthVibe,
      primaryDriver: fresh.primaryDriver,
      recommendedActionSummary: fresh.recommendedActionSummary,
      confidence: fresh.confidence,
      mixedSignals: fresh.mixedSignals,
      createdAt: cached?.createdAt ?? null,
      updatedAt: cached?.updatedAt ?? null,
    };

    await saveCachedInterpretationToSupabase(interpretation);

    return {
      status: "available" as const,
      source: "live" as const,
      interpretation,
    };
  },
);

export async function getAccountNoteInterpretation(
  account: Pick<
    NormalizedAccountRecord,
    keyof NormalizedAccountRecord
  >,
  deps: InterpretationDeps = {},
): Promise<AccountNoteInterpretationResult> {
  const normalizedNoteText = await buildNormalizedNoteInterpretationInput(
    account as NormalizedAccountRecord,
  );

  if (!normalizedNoteText) {
    return {
      status: "unavailable",
      source: "empty",
      reason: "AI interpretation unavailable because all note fields are empty.",
      normalizedNoteText: null,
    };
  }

  const usingDefaultDeps =
    deps.loadCachedInterpretation === undefined &&
    deps.saveCachedInterpretation === undefined &&
    deps.requestInterpretation === undefined;

  if (usingDefaultDeps) {
    try {
      return await getDefaultAccountInterpretation(
        account.account_id,
        normalizedNoteText,
      );
    } catch {
      return {
        status: "unavailable",
        source: "error",
        reason: "AI interpretation was unavailable for this view.",
        normalizedNoteText,
      };
    }
  }

  const loadCachedInterpretation =
    deps.loadCachedInterpretation ?? loadCachedInterpretationFromSupabase;
  const saveCachedInterpretation =
    deps.saveCachedInterpretation ?? saveCachedInterpretationToSupabase;
  const requestInterpretation =
    deps.requestInterpretation ?? requestNoteInterpretationFromOpenAI;

  try {
    const cached = await loadCachedInterpretation(account.account_id);

    if (cached && cached.normalizedNoteText === normalizedNoteText) {
      return {
        status: "available",
        source: "cache",
        interpretation: cached,
      };
    }

    const fresh = await requestInterpretation(normalizedNoteText);
    const interpretation: AccountNoteInterpretation = {
      accountId: account.account_id,
      normalizedNoteText,
      overallSummary: fresh.overallSummary,
      relationshipVibe: fresh.relationshipVibe,
      growthVibe: fresh.growthVibe,
      primaryDriver: fresh.primaryDriver,
      recommendedActionSummary: fresh.recommendedActionSummary,
      confidence: fresh.confidence,
      mixedSignals: fresh.mixedSignals,
      createdAt: cached?.createdAt ?? null,
      updatedAt: cached?.updatedAt ?? null,
    };

    await saveCachedInterpretation(interpretation);

    return {
      status: "available",
      source: "live",
      interpretation,
    };
  } catch {
    return {
      status: "unavailable",
      source: "error",
      reason: "AI interpretation was unavailable for this view.",
      normalizedNoteText,
    };
  }
}
