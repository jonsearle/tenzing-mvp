import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import type { NormalizedAccountRecord } from "@/types/account";

const INTERPRETATION_TABLE = "account_note_interpretations";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_TIMEOUT_MS = 15_000;

const vibeSchema = z.enum(["positive", "neutral", "negative"]);

const openAiInterpretationSchema = z.object({
  overall_summary: z.string().trim().min(1),
  relationship_vibe: vibeSchema,
  growth_vibe: vibeSchema,
});

const cacheRecordSchema = z.object({
  account_id: z.string().min(1),
  normalized_note_text: z.string().min(1),
  overall_account_summary: z.string().trim().min(1),
  relationship_vibe: vibeSchema,
  growth_vibe: vibeSchema,
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
  return {
    accountId: record.account_id,
    normalizedNoteText: record.normalized_note_text,
    overallSummary: record.overall_account_summary,
    relationshipVibe: record.relationship_vibe,
    growthVibe: record.growth_vibe,
    createdAt: record.created_at ?? null,
    updatedAt: record.updated_at ?? null,
  };
}

export function buildNormalizedNoteInterpretationInput(
  account: Pick<
    NormalizedAccountRecord,
    "recent_customer_note" | "recent_sales_note" | "recent_support_summary"
  >,
) {
  const fields = [
    account.recent_customer_note,
    account.recent_sales_note,
    account.recent_support_summary,
  ];

  const normalizedFields = fields
    .map((value) => value?.trim().toLowerCase() ?? null)
    .filter((value): value is string => Boolean(value));

  return normalizedFields.length === 0 ? null : normalizedFields.join("\n\n");
}

export async function requestNoteInterpretationFromOpenAI(
  normalizedNoteText: string,
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
            "You interpret account notes for a decision-support product. Return only structured JSON containing an overall summary, a relationship vibe, and a growth vibe. Do not infer extra fields.",
        },
        {
          role: "user",
          content: [
            "Interpret this normalized account-note text.",
            "Summarize the overall account context in 1-2 sentences.",
            "Classify relationship vibe as positive, neutral, or negative.",
            "Classify growth vibe as positive, neutral, or negative.",
            "",
            normalizedNoteText,
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
            },
            required: [
              "overall_summary",
              "relationship_vibe",
              "growth_vibe",
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

  return {
    overallSummary: parsed.overall_summary,
    relationshipVibe: parsed.relationship_vibe,
    growthVibe: parsed.growth_vibe,
  };
}

async function loadCachedInterpretationFromSupabase(accountId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from(INTERPRETATION_TABLE)
    .select(
      "account_id, normalized_note_text, overall_account_summary, relationship_vibe, growth_vibe, created_at, updated_at",
    )
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

export async function getAccountNoteInterpretation(
  account: Pick<
    NormalizedAccountRecord,
    | "account_id"
    | "recent_customer_note"
    | "recent_sales_note"
    | "recent_support_summary"
  >,
  deps: InterpretationDeps = {},
): Promise<AccountNoteInterpretationResult> {
  const normalizedNoteText = buildNormalizedNoteInterpretationInput(account);

  if (!normalizedNoteText) {
    return {
      status: "unavailable",
      source: "empty",
      reason: "AI interpretation unavailable because all note fields are empty.",
      normalizedNoteText: null,
    };
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
