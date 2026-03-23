import type { NormalizedAccountRecord } from "@/types/account";
import type { AccountNoteInterpretationResult, NoteVibe } from "@/lib/notes/interpretation";

const DAY_IN_MS = 86_400_000;
const EXPANSION_PIPELINE_WEIGHT = 0.9;
const EXPANSION_CONFIDENCE_WEIGHT = 0.1;

export const STRUCTURED_STATE_ORDER = [
  "serviceFailure",
  "lowAdoption",
  "usageDecline",
  "relationshipRisk",
  "expansionOpportunity",
  "lowNps",
] as const;

export type StructuredStateKey = (typeof STRUCTURED_STATE_ORDER)[number];

export type StructuredStateScore = {
  key: StructuredStateKey;
  label: string;
  score: number | null;
  confidence: number | null;
  status: "available" | "unavailable";
  reason?: string;
};

export type StructuredStateAssessment = {
  key: StructuredStateKey;
  label: string;
  value: number | null;
  confidenceValue: number | null;
  status: "available" | "unavailable";
  reason?: string;
};

export type RenewalContext = {
  renewalDate: string | null;
  daysToRenewal: number | null;
  renewalScore: number;
};

export type StructuredAccountReview = {
  states: StructuredStateScore[];
  renewal: RenewalContext;
  pipelinePotential: number | null;
  expansionConfidenceScore: number | null;
  expansionConfidenceBand: string | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toDisplayScale(value: number) {
  return Math.round(value * 100);
}

function completeness(values: Array<number | string | null>) {
  const populated = values.filter((value) => value !== null).length;
  return values.length === 0 ? 0 : populated / values.length;
}

function createStructuredState(
  key: StructuredStateKey,
  label: string,
  value: number,
  confidenceValue: number,
): StructuredStateAssessment {
  return {
    key,
    label,
    value,
    confidenceValue,
    status: "available",
  };
}

function createUnavailableState(
  key: StructuredStateKey,
  label: string,
  reason: string,
): StructuredStateAssessment {
  return {
    key,
    label,
    value: null,
    confidenceValue: null,
    status: "unavailable",
    reason,
  };
}

function toStructuredStateScore(
  assessment: StructuredStateAssessment,
): StructuredStateScore {
  return {
    key: assessment.key,
    label: assessment.label,
    score:
      assessment.value === null ? null : toDisplayScale(assessment.value),
    confidence:
      assessment.confidenceValue === null
        ? null
        : toDisplayScale(assessment.confidenceValue),
    status: assessment.status,
    reason: assessment.reason,
  };
}

function getRelationshipRiskStrength(vibe: NoteVibe) {
  if (vibe === "negative") {
    return 1;
  }

  if (vibe === "neutral") {
    return 0.5;
  }

  return 0;
}

export function getExpansionConfidenceScore(growthVibe: NoteVibe) {
  if (growthVibe === "positive") {
    return 100;
  }

  if (growthVibe === "neutral") {
    return 50;
  }

  return 0;
}

export function getExpansionConfidenceBand(growthVibe: NoteVibe) {
  if (growthVibe === "positive") {
    return "Confident";
  }

  if (growthVibe === "neutral") {
    return "Neutral";
  }

  return "Not Confident";
}

export function getUtcDayTimestamp(value: Date) {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

export function getDaysToRenewal(
  renewalDate: string | null,
  referenceDate: Date = new Date(),
) {
  if (!renewalDate) {
    return null;
  }

  const renewalTimestamp = Date.parse(`${renewalDate}T00:00:00.000Z`);

  if (Number.isNaN(renewalTimestamp)) {
    return null;
  }

  const diff = Math.round((renewalTimestamp - getUtcDayTimestamp(referenceDate)) / DAY_IN_MS);
  return Math.max(0, diff);
}

export function getRenewalScore(daysToRenewal: number | null) {
  if (daysToRenewal === null) {
    return 0;
  }

  if (daysToRenewal <= 30) {
    return 100;
  }

  if (daysToRenewal <= 60) {
    return 75;
  }

  if (daysToRenewal <= 120) {
    return 50;
  }

  if (daysToRenewal <= 180) {
    return 25;
  }

  return 0;
}

function computeServiceFailure(account: NormalizedAccountRecord) {
  const confidenceValue = completeness([
    account.open_tickets_count,
    account.urgent_open_tickets_count,
    account.sla_breaches_90d,
  ]);

  let strength = 0;

  if (
    account.open_tickets_count !== null &&
    account.urgent_open_tickets_count !== null &&
    account.sla_breaches_90d !== null
  ) {
    strength =
      0.25 * Math.min(account.open_tickets_count / 10, 1) +
      0.4 * Math.min(account.urgent_open_tickets_count / 5, 1) +
      0.35 * Math.min(account.sla_breaches_90d / 5, 1);
  }

  if (
    (account.urgent_open_tickets_count ?? 0) >= 4 ||
    (account.sla_breaches_90d ?? 0) >= 4
  ) {
    strength = Math.max(strength, 0.75);
  }

  return createStructuredState(
    "serviceFailure",
    "Service Failure",
    clamp(strength, 0, 1) * confidenceValue,
    confidenceValue,
  );
}

function computeLowAdoption(account: NormalizedAccountRecord) {
  const confidenceValue = completeness([
    account.seats_purchased,
    account.seats_used,
  ]);

  let strength = 0;

  if (
    account.seats_purchased !== null &&
    account.seats_purchased > 0 &&
    account.seats_used !== null
  ) {
    const seatUtilisation = clamp(account.seats_used / account.seats_purchased, 0, 1);
    strength = 1 - seatUtilisation;

    if (seatUtilisation <= 0.25) {
      strength = Math.max(strength, 0.75);
    }
  }

  return createStructuredState(
    "lowAdoption",
    "Low Adoption",
    clamp(strength, 0, 1) * confidenceValue,
    confidenceValue,
  );
}

function computeUsageDecline(account: NormalizedAccountRecord) {
  const confidenceValue = completeness([
    account.usage_score_3m_ago,
    account.usage_score_current,
  ]);

  let strength = 0;

  if (
    account.usage_score_3m_ago !== null &&
    account.usage_score_current !== null
  ) {
    const decline = account.usage_score_3m_ago - account.usage_score_current;
    strength = clamp(decline / 40, 0, 1);

    if (decline >= 25) {
      strength = Math.max(strength, 0.75);
    }
  }

  return createStructuredState(
    "usageDecline",
    "Usage Decline",
    strength * confidenceValue,
    confidenceValue,
  );
}

function computeLowNps(account: NormalizedAccountRecord) {
  const confidenceValue = completeness([account.latest_nps]);
  let strength = 0;

  if (account.latest_nps !== null) {
    strength = clamp((50 - account.latest_nps) / 100, 0, 1);
  }

  return createStructuredState(
    "lowNps",
    "Low NPS",
    strength * confidenceValue,
    confidenceValue,
  );
}

function computeRelationshipRisk(
  account: NormalizedAccountRecord,
  interpretationResult: AccountNoteInterpretationResult | null,
) {
  if (interpretationResult?.status !== "available") {
    return createUnavailableState(
      "relationshipRisk",
      "Relationship Risk",
      interpretationResult?.reason ?? "AI interpretation unavailable.",
    );
  }

  const confidenceValue = completeness([
    account.recent_customer_note,
    account.recent_sales_note,
    account.recent_support_summary,
  ]);

  return createStructuredState(
    "relationshipRisk",
    "Relationship Risk",
    getRelationshipRiskStrength(
      interpretationResult.interpretation.relationshipVibe,
    ) * confidenceValue,
    confidenceValue,
  );
}

function computeExpansionOpportunity(
  account: NormalizedAccountRecord,
  interpretationResult: AccountNoteInterpretationResult | null,
) {
  if (interpretationResult?.status !== "available") {
    return createUnavailableState(
      "expansionOpportunity",
      "Expansion Opportunity",
      interpretationResult?.reason ?? "AI interpretation unavailable.",
    );
  }

  const confidenceValue = completeness([
    account.expansion_pipeline_gbp,
    account.recent_customer_note,
    account.recent_sales_note,
  ]);
  const pipelineNorm =
    account.expansion_pipeline_gbp === null
      ? 0
      : Math.min(account.expansion_pipeline_gbp / 50_000, 1);
  const expansionConfidence =
    getExpansionConfidenceScore(interpretationResult.interpretation.growthVibe) /
    100;
  const strength = clamp(
    EXPANSION_PIPELINE_WEIGHT * pipelineNorm +
      EXPANSION_CONFIDENCE_WEIGHT * expansionConfidence,
    0,
    1,
  );

  return createStructuredState(
    "expansionOpportunity",
    "Expansion Opportunity",
    strength * confidenceValue,
    confidenceValue,
  );
}

export function computeStructuredStateAssessments(
  account: NormalizedAccountRecord,
  interpretationResult: AccountNoteInterpretationResult | null = null,
): StructuredStateAssessment[] {
  return [
    computeServiceFailure(account),
    computeLowAdoption(account),
    computeUsageDecline(account),
    computeRelationshipRisk(account, interpretationResult),
    computeExpansionOpportunity(account, interpretationResult),
    computeLowNps(account),
  ];
}

export function computeStructuredAccountReview(
  account: NormalizedAccountRecord,
  interpretationResult: AccountNoteInterpretationResult | null = null,
  referenceDate: Date = new Date(),
): StructuredAccountReview {
  const daysToRenewal = getDaysToRenewal(account.renewal_date, referenceDate);
  const expansionConfidenceScore =
    interpretationResult?.status === "available"
      ? getExpansionConfidenceScore(interpretationResult.interpretation.growthVibe)
      : null;
  const expansionConfidenceBand =
    interpretationResult?.status === "available"
      ? getExpansionConfidenceBand(interpretationResult.interpretation.growthVibe)
      : null;

  return {
    states: computeStructuredStateAssessments(
      account,
      interpretationResult,
    ).map(toStructuredStateScore),
    renewal: {
      renewalDate: account.renewal_date,
      daysToRenewal,
      renewalScore: getRenewalScore(daysToRenewal),
    },
    pipelinePotential: account.expansion_pipeline_gbp,
    expansionConfidenceScore,
    expansionConfidenceBand,
  };
}
