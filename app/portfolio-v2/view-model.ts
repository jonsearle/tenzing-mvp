import { formatScore } from "@/lib/format";
import {
  type StructuredStateKey,
  type StructuredStateScore,
} from "@/lib/scoring/account-detail";
import { getAccountScoringContextMap } from "@/lib/scoring/shared";
import {
  getStateDisplayValue,
  type StateDisplayTone,
} from "@/lib/scoring/state-display";

export const RISK_STATE_KEYS = [
  "serviceFailure",
  "usageDecline",
  "lowAdoption",
  "lowNps",
] as const;

export type DetailStateMap = Map<StructuredStateKey, StructuredStateScore>;

export type TopAccountDetail = {
  states: DetailStateMap;
  expansionConfidenceBand: string | null;
  expansionConfidenceScore: number | null;
  queueNarrative: string | null;
};

export type CellPresentation = {
  label: string;
  score: string;
  tone: StateDisplayTone | "neutral";
};

export function truncateAccountName(name: string, maxLength = 24) {
  if (name.length <= maxLength) {
    return name;
  }

  return `${name.slice(0, maxLength - 1).trimEnd()}...`;
}

export function truncateNarrative(text: string, maxLength = 110) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}...`;
}

export function getQueueNarrative(
  details: Map<string, TopAccountDetail>,
  accountId: string,
) {
  return details.get(accountId)?.queueNarrative ?? null;
}

export function getCellToneClass(tone: StateDisplayTone | "neutral") {
  if (tone === "negative") {
    return "tone-negative";
  }

  if (tone === "warning") {
    return "tone-warning";
  }

  if (tone === "positive") {
    return "tone-positive";
  }

  return "tone-neutral";
}

export function getUnavailableCell(): CellPresentation {
  return {
    label: "Unavailable",
    score: "Unavailable",
    tone: "neutral",
  };
}

export function getRiskCell(
  details: Map<string, TopAccountDetail>,
  accountId: string,
  key: (typeof RISK_STATE_KEYS)[number],
  fallbackRawScore: number,
): CellPresentation {
  const state = details.get(accountId)?.states.get(key);

  if (!state || state.status === "unavailable" || state.score === null) {
    return getUnavailableCell();
  }

  const display = getStateDisplayValue(key, state.score ?? fallbackRawScore);

  return {
    label: display.band ?? "Unavailable",
    score: formatScore(display.displayScore),
    tone: display.tone ?? "neutral",
  };
}

export function getGrowthOpportunityCell(
  details: Map<string, TopAccountDetail>,
  accountId: string,
  fallbackRawScore: number,
): CellPresentation {
  const state = details.get(accountId)?.states.get("expansionOpportunity");

  if (!state || state.status === "unavailable" || state.score === null) {
    return getUnavailableCell();
  }

  const display = getStateDisplayValue(
    "expansionOpportunity",
    state.score ?? fallbackRawScore,
  );

  return {
    label: display.band ?? "Unavailable",
    score: formatScore(display.displayScore),
    tone: display.tone ?? "neutral",
  };
}

export function getExpansionConfidenceCell(
  details: Map<string, TopAccountDetail>,
  accountId: string,
): CellPresentation {
  const detail = details.get(accountId);

  if (!detail || detail.expansionConfidenceScore === null) {
    return getUnavailableCell();
  }

  if (detail.expansionConfidenceBand === "Confident") {
    return {
      label: detail.expansionConfidenceBand,
      score: formatScore(detail.expansionConfidenceScore),
      tone: "positive",
    };
  }

  if (detail.expansionConfidenceBand === "Neutral") {
    return {
      label: detail.expansionConfidenceBand,
      score: formatScore(detail.expansionConfidenceScore),
      tone: "warning",
    };
  }

  return {
    label: detail.expansionConfidenceBand ?? "Unavailable",
    score: formatScore(detail.expansionConfidenceScore),
    tone: "negative",
  };
}

export async function buildTopAccountDetails(accountIds: string[]) {
  const accountContextMap = await getAccountScoringContextMap();

  const detailEntries = await Promise.all(
    accountIds.map(async (accountId) => {
      const context = accountContextMap.get(accountId);

      if (!context) {
        return [accountId, null] as const;
      }

      return [
        accountId,
        {
          states: new Map(context.review.states.map((state) => [state.key, state])),
          expansionConfidenceBand: context.review.expansionConfidenceBand,
          expansionConfidenceScore: context.review.expansionConfidenceScore,
          queueNarrative:
            context.interpretation.status === "available"
              ? truncateNarrative(context.interpretation.interpretation.primaryDriver)
              : null,
        },
      ] as const;
    }),
  );

  return new Map(
    detailEntries.filter((entry): entry is [string, TopAccountDetail] => entry[1] !== null),
  );
}
