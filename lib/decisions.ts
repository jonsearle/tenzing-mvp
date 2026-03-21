import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import type { StructuredAccountReview, StructuredStateScore } from "@/lib/scoring/account-detail";

const DECISION_TABLE = "account_decisions";

export const ACTION_LIBRARY = [
  {
    id: "service_failure",
    label: "Escalate Support And Stabilise Service",
    description:
      "Escalate the account's open service issues, reduce urgent tickets, and bring recent SLA performance back under control.",
  },
  {
    id: "low_adoption",
    label: "Launch Adoption Recovery Plan",
    description:
      "Identify where usage is not spreading across purchased seats and run a focused plan to improve adoption.",
  },
  {
    id: "usage_decline",
    label: "Run Usage Recovery Outreach",
    description:
      "Re-engage the account with a usage-focused follow-up to recover declining product activity.",
  },
  {
    id: "relationship_risk",
    label: "Hold Relationship Reset",
    description:
      "Run a direct relationship reset with the customer to address concerns, rebuild trust, and clarify the path forward.",
  },
  {
    id: "low_nps",
    label: "Review Low NPS And Close Issues",
    description:
      "Review the reasons behind low NPS, prioritise the key issues, and confirm which fixes or follow-ups should happen next.",
  },
  {
    id: "expansion_opportunity",
    label: "Progress Expansion Opportunity",
    description: "Carry out product and roadmap demos with senior leadership.",
  },
] as const;

export type ActionLibraryItem = (typeof ACTION_LIBRARY)[number];
export type ActionLabel = ActionLibraryItem["label"];

const ACTION_LABELS = ACTION_LIBRARY.map((action) => action.label) as [
  ActionLabel,
  ...ActionLabel[],
];

export const DEFAULT_RECOMMENDATION_BY_STATE = {
  serviceFailure: "Escalate Support And Stabilise Service",
  lowAdoption: "Launch Adoption Recovery Plan",
  usageDecline: "Run Usage Recovery Outreach",
  relationshipRisk: "Hold Relationship Reset",
  lowNps: "Review Low NPS And Close Issues",
  expansionOpportunity: "Progress Expansion Opportunity",
} as const satisfies Record<StructuredStateScore["key"], ActionLabel>;

export type RecommendationOutcome = "accepted" | "overridden" | "none";

const decisionRecordSchema = z.object({
  account_id: z.string().min(1),
  selected_action: z.enum(ACTION_LABELS),
  default_recommended_action: z.enum(ACTION_LABELS).nullable(),
  default_recommended_state: z.string().min(1).nullable(),
  recommendation_outcome: z.enum(["accepted", "overridden", "none"]),
  user_note: z.string().nullable(),
  created_at: z.string().nullish(),
});

export type AccountDecision = {
  accountId: string;
  selectedAction: ActionLabel;
  defaultRecommendedAction: ActionLabel | null;
  defaultRecommendedState: string | null;
  recommendationOutcome: RecommendationOutcome;
  userNote: string | null;
  createdAt: string | null;
};

export type RecommendedAction = {
  action: ActionLabel | null;
  stateLabel: string | null;
  reason: "highest_state" | "tie" | "all_zero";
};

export type SaveAccountDecisionInput = {
  accountId: string;
  selectedAction: ActionLabel;
  recommendedAction: ActionLabel | null;
  recommendedStateLabel: string | null;
  userNote?: string | null;
};

type DecisionRecord = z.infer<typeof decisionRecordSchema>;

function mapDecisionRecord(record: DecisionRecord): AccountDecision {
  return {
    accountId: record.account_id,
    selectedAction: record.selected_action,
    defaultRecommendedAction: record.default_recommended_action,
    defaultRecommendedState: record.default_recommended_state,
    recommendationOutcome: record.recommendation_outcome,
    userNote: record.user_note,
    createdAt: record.created_at ?? null,
  };
}

export function getActionLibraryItem(actionLabel: string | null | undefined) {
  if (!actionLabel) {
    return null;
  }

  return ACTION_LIBRARY.find((action) => action.label === actionLabel) ?? null;
}

export function getRecommendedAction(review: StructuredAccountReview): RecommendedAction {
  const relevantStates = review.states.filter(
    (state) => state.score !== null && state.score > 0,
  );

  if (relevantStates.length === 0) {
    return {
      action: null,
      stateLabel: null,
      reason: "all_zero",
    };
  }

  const highestScore = Math.max(...relevantStates.map((state) => state.score ?? 0));
  const highestStates = relevantStates.filter((state) => state.score === highestScore);

  if (highestStates.length !== 1) {
    return {
      action: null,
      stateLabel: null,
      reason: "tie",
    };
  }

  const selectedState = highestStates[0];

  return {
    action: DEFAULT_RECOMMENDATION_BY_STATE[selectedState.key],
    stateLabel: selectedState.label,
    reason: "highest_state",
  };
}

export function buildDecisionRecord(input: SaveAccountDecisionInput) {
  const trimmedNote = input.userNote?.trim() ?? "";
  const recommendationOutcome: RecommendationOutcome =
    input.recommendedAction === null
      ? "none"
      : input.selectedAction === input.recommendedAction
        ? "accepted"
        : "overridden";

  return {
    account_id: input.accountId,
    selected_action: input.selectedAction,
    default_recommended_action: input.recommendedAction,
    default_recommended_state: input.recommendedStateLabel,
    recommendation_outcome: recommendationOutcome,
    user_note: trimmedNote.length > 0 ? trimmedNote : null,
  };
}

export async function listAccountDecisions(accountId: string) {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from(DECISION_TABLE)
    .select(
      "account_id, selected_action, default_recommended_action, default_recommended_state, recommendation_outcome, user_note, created_at",
    )
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data
    .map((record) => decisionRecordSchema.safeParse(record))
    .filter((result) => result.success)
    .map((result) => mapDecisionRecord(result.data));
}

export async function saveAccountDecision(input: SaveAccountDecisionInput) {
  const record = buildDecisionRecord(input);

  if (!hasSupabaseEnv()) {
    return {
      status: "unavailable" as const,
      reason: "Supabase is not configured for decision persistence.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from(DECISION_TABLE).insert(record);

  if (error) {
    return {
      status: "error" as const,
      reason: "Decision could not be saved.",
    };
  }

  return {
    status: "saved" as const,
    decision: mapDecisionRecord({
      ...record,
      created_at: null,
    }),
  };
}
