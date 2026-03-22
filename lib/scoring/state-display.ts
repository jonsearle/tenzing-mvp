import type { StructuredStateKey } from "@/lib/scoring/account-detail";

type ScoreBand = {
  min: number;
  max: number;
};

export type StateDisplayTone = "positive" | "warning" | "negative";

export type StateDisplayDefinition = {
  key: StructuredStateKey;
  canonicalLabel: string;
  label: string;
  bands: [string, string, string, string, string];
};

export type StateDisplayValue = {
  key: StructuredStateKey;
  label: string;
  band: string | null;
  tone: StateDisplayTone | null;
  displayScore: number | null;
  rawScore: number | null;
};

const DISPLAY_BANDS: [ScoreBand, ScoreBand, ScoreBand, ScoreBand, ScoreBand] = [
  { min: 0, max: 19 },
  { min: 20, max: 39 },
  { min: 40, max: 59 },
  { min: 60, max: 79 },
  { min: 80, max: 100 },
];

export const STATE_DISPLAY_DEFINITIONS: Record<
  StructuredStateKey,
  StateDisplayDefinition
> = {
  serviceFailure: {
    key: "serviceFailure",
    canonicalLabel: "Service Failure",
    label: "Service Health",
    bands: ["Very Bad", "Bad", "OK", "Good", "Very Good"],
  },
  lowAdoption: {
    key: "lowAdoption",
    canonicalLabel: "Low Adoption",
    label: "Adoption",
    bands: ["Very Low", "Limited", "Partial", "Healthy", "Fully Embedded"],
  },
  usageDecline: {
    key: "usageDecline",
    canonicalLabel: "Usage Decline",
    label: "Usage Momentum",
    bands: ["Sharp Decline", "Soft Decline", "Flat", "Growing", "Strong Growth"],
  },
  relationshipRisk: {
    key: "relationshipRisk",
    canonicalLabel: "Relationship Risk",
    label: "Relationship Strength",
    bands: ["At Risk", "Fragile", "Mixed", "Stable", "Strong"],
  },
  expansionOpportunity: {
    key: "expansionOpportunity",
    canonicalLabel: "Expansion Opportunity",
    label: "Growth Opportunity",
    bands: ["None", "Limited", "Moderate", "Strong", "Very High"],
  },
  lowNps: {
    key: "lowNps",
    canonicalLabel: "Low NPS",
    label: "Customer Sentiment",
    bands: ["Negative", "Weak", "Neutral", "Positive", "Strong"],
  },
};

function clampDisplayScore(score: number) {
  return Math.min(Math.max(Math.round(score), 0), 100);
}

function getBandIndex(score: number) {
  return DISPLAY_BANDS.findIndex((band) => score >= band.min && score <= band.max);
}

function getDisplayTone(bandIndex: number): StateDisplayTone {
  if (bandIndex >= 3) {
    return "positive";
  }

  if (bandIndex === 2) {
    return "warning";
  }

  return "negative";
}

function toDisplayScore(key: StructuredStateKey, rawScore: number) {
  if (key === "expansionOpportunity") {
    return rawScore;
  }

  return 100 - rawScore;
}

export function getStateDisplayDefinition(key: StructuredStateKey) {
  return STATE_DISPLAY_DEFINITIONS[key];
}

export function getStateDisplayLabelFromCanonicalLabel(label: string | null | undefined) {
  if (!label) {
    return null;
  }

  return (
    Object.values(STATE_DISPLAY_DEFINITIONS).find(
      (definition) => definition.canonicalLabel === label,
    )?.label ?? label
  );
}

export function getStateDisplayValue(
  key: StructuredStateKey,
  rawScore: number | null,
): StateDisplayValue {
  const definition = getStateDisplayDefinition(key);

  if (rawScore === null) {
    return {
      key,
      label: definition.label,
      band: null,
      tone: null,
      displayScore: null,
      rawScore: null,
    };
  }

  const clampedRawScore = clampDisplayScore(rawScore);
  const clampedDisplayScore = clampDisplayScore(toDisplayScore(key, clampedRawScore));
  const bandIndex = getBandIndex(clampedDisplayScore);
  const resolvedBandIndex = bandIndex === -1 ? DISPLAY_BANDS.length - 1 : bandIndex;

  return {
    key,
    label: definition.label,
    band: definition.bands[resolvedBandIndex],
    tone: getDisplayTone(resolvedBandIndex),
    displayScore: clampedDisplayScore,
    rawScore: clampedRawScore,
  };
}
