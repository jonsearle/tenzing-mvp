import { getRecommendedAction } from "@/lib/decisions";
import { findAccountById } from "@/lib/data/accounts";
import {
  getAccountNoteInterpretation,
  type AccountNoteInterpretationResult,
} from "@/lib/notes/interpretation";
import {
  computeStructuredAccountReview,
  type StructuredAccountReview,
  type StructuredStateScore,
} from "@/lib/scoring/account-detail";
import {
  getStateDisplayLabelFromCanonicalLabel,
  getStateDisplayValue,
} from "@/lib/scoring/state-display";
import {
  getRankedGrowthAccounts,
  type RankedGrowthAccount,
} from "@/lib/scoring/growth-queue";
import {
  getRankedRiskAccounts,
  type RankedRiskAccount,
} from "@/lib/scoring/risk-queue";

type ReviewQueue = "risk" | "growth";

type ReviewDeps = {
  getRiskAccounts?: (referenceDate?: Date) => Promise<RankedRiskAccount[]>;
  getGrowthAccounts?: (referenceDate?: Date) => Promise<RankedGrowthAccount[]>;
  findAccount?: typeof findAccountById;
  getInterpretation?: typeof getAccountNoteInterpretation;
};

export type ManualReviewSignal = {
  label: string;
  score: number;
};

export type ManualReviewEntry = {
  queue: ReviewQueue;
  rank: number;
  accountId: string;
  accountName: string;
  priorityLabel: string;
  priorityValue: number;
  recommendationAction: string | null;
  recommendationStateLabel: string | null;
  recommendationReason: StructuredReviewRecommendationReason;
  strongestSignals: ManualReviewSignal[];
  aiStatus: AccountNoteInterpretationResult["status"];
  aiSummary: string | null;
  aiReason: string | null;
  noteEvidenceLabels: string[];
  reviewHref: string;
};

export type ManualProductReview = {
  reviewedAt: string;
  riskEntries: ManualReviewEntry[];
  growthEntries: ManualReviewEntry[];
  checks: Array<{
    label: string;
    status: "ready";
    detail: string;
  }>;
};

type StructuredReviewRecommendationReason = ReturnType<
  typeof getRecommendedAction
>["reason"];

function getStrongestSignals(states: StructuredStateScore[]) {
  return states
    .filter((state): state is StructuredStateScore & { score: number } => {
      return state.score !== null && state.score > 0;
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((state) => ({
      label: getStateDisplayLabelFromCanonicalLabel(state.label) ?? state.label,
      score: getStateDisplayValue(state.key, state.score).displayScore ?? state.score,
    }));
}

function getNoteEvidenceLabels(review: AccountContext["account"]) {
  const fields = [
    {
      label: "Recent customer note",
      value: review.recent_customer_note,
    },
    {
      label: "Recent sales note",
      value: review.recent_sales_note,
    },
    {
      label: "Recent support summary",
      value: review.recent_support_summary,
    },
  ];

  return fields
    .filter((field) => Boolean(field.value))
    .map((field) => field.label);
}

type AccountContext = {
  account: NonNullable<Awaited<ReturnType<typeof findAccountById>>>;
  interpretation: AccountNoteInterpretationResult;
  review: StructuredAccountReview;
};

async function buildAccountContext(
  accountId: string,
  referenceDate: Date,
  deps: Required<ReviewDeps>,
): Promise<AccountContext | null> {
  const account = await deps.findAccount(accountId);

  if (!account) {
    return null;
  }

  const interpretation = await deps.getInterpretation(account);

  return {
    account,
    interpretation,
    review: computeStructuredAccountReview(account, interpretation, referenceDate),
  };
}

function toEntry(
  queue: ReviewQueue,
  rankedAccount: RankedRiskAccount | RankedGrowthAccount,
  context: AccountContext,
): ManualReviewEntry {
  const recommendation = getRecommendedAction(context.review);
  const priorityValue =
    queue === "risk"
      ? (rankedAccount as RankedRiskAccount).riskPriority
      : (rankedAccount as RankedGrowthAccount).growthPriority;

  return {
    queue,
    rank: rankedAccount.rank,
    accountId: rankedAccount.accountId,
    accountName: rankedAccount.accountName,
    priorityLabel: queue === "risk" ? "Risk Priority" : "Growth Priority",
    priorityValue,
    recommendationAction: recommendation.action,
    recommendationStateLabel: getStateDisplayLabelFromCanonicalLabel(
      recommendation.stateLabel,
    ),
    recommendationReason: recommendation.reason,
    strongestSignals: getStrongestSignals(context.review.states),
    aiStatus: context.interpretation.status,
    aiSummary:
      context.interpretation.status === "available"
        ? context.interpretation.interpretation.overallSummary
        : null,
    aiReason:
      context.interpretation.status === "unavailable"
        ? context.interpretation.reason
        : null,
    noteEvidenceLabels: getNoteEvidenceLabels(context.account),
    reviewHref: `/accounts/${rankedAccount.accountId}`,
  };
}

export async function buildManualProductReview(
  referenceDate: Date = new Date(),
  deps: ReviewDeps = {},
): Promise<ManualProductReview> {
  const resolvedDeps: Required<ReviewDeps> = {
    getRiskAccounts: deps.getRiskAccounts ?? getRankedRiskAccounts,
    getGrowthAccounts: deps.getGrowthAccounts ?? getRankedGrowthAccounts,
    findAccount: deps.findAccount ?? findAccountById,
    getInterpretation: deps.getInterpretation ?? getAccountNoteInterpretation,
  };

  const [riskAccounts, growthAccounts] = await Promise.all([
    resolvedDeps.getRiskAccounts(referenceDate),
    resolvedDeps.getGrowthAccounts(referenceDate),
  ]);
  const topRiskAccounts = riskAccounts.slice(0, 5);
  const topGrowthAccounts = growthAccounts.slice(0, 5);

  const [riskEntries, growthEntries] = await Promise.all([
    Promise.all(
      topRiskAccounts.map(async (rankedAccount) => {
        const context = await buildAccountContext(
          rankedAccount.accountId,
          referenceDate,
          resolvedDeps,
        );

        return context ? toEntry("risk", rankedAccount, context) : null;
      }),
    ),
    Promise.all(
      topGrowthAccounts.map(async (rankedAccount) => {
        const context = await buildAccountContext(
          rankedAccount.accountId,
          referenceDate,
          resolvedDeps,
        );

        return context ? toEntry("growth", rankedAccount, context) : null;
      }),
    ),
  ]);

  return {
    reviewedAt: referenceDate.toISOString(),
    riskEntries: riskEntries.filter((entry): entry is ManualReviewEntry => entry !== null),
    growthEntries: growthEntries.filter(
      (entry): entry is ManualReviewEntry => entry !== null,
    ),
    checks: [
      {
        label: "Top-five decision surface remains bounded",
        status: "ready",
        detail: `Loaded ${topRiskAccounts.length} risk accounts and ${topGrowthAccounts.length} growth accounts for manual review.`,
      },
      {
        label: "Evidence trail stays one click deeper",
        status: "ready",
        detail:
          "Each reviewed account links to the account page, where raw notes, AI summary status, and full source data remain visible.",
      },
      {
        label: "Recommendation grounding is inspectable",
        status: "ready",
        detail:
          "Each reviewed account includes strongest surfaced states alongside the default recommended action or explicit no-default state.",
      },
      {
        label: "Follow-up fixes stay separate",
        status: "ready",
        detail:
          "Use docs/manual-product-review-2026-03-21.md to record review findings and any follow-up work instead of silently folding changes into this slice.",
      },
    ],
  };
}
