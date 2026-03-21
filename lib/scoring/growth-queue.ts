import { getAllAccounts } from "@/lib/data/accounts";
import { getAccountNoteInterpretation } from "@/lib/notes/interpretation";
import {
  computeStructuredAccountReview,
  computeStructuredStateAssessments,
  type StructuredAccountReview,
  type StructuredStateAssessment,
  type StructuredStateKey,
} from "@/lib/scoring/account-detail";
import { computePercentileRankScores } from "@/lib/scoring/risk-queue";
import type { NormalizedAccountRecord } from "@/types/account";

type GrowthRankingInput = {
  account: NormalizedAccountRecord;
  review: StructuredAccountReview;
  assessments: StructuredStateAssessment[];
};

export type RankedGrowthAccount = {
  rank: number;
  accountId: string;
  accountName: string;
  arrGbp: number | null;
  renewalDate: string | null;
  daysToRenewal: number | null;
  pipelinePotential: number | null;
  growthScore: number;
  expansionOpportunity: number;
  expansionConfidence: number | null;
  expansionConfidenceBand: string | null;
  growthPriority: number;
  serviceFailure: number;
  relationshipRisk: number;
  usageDecline: number;
  lowAdoption: number;
  lowNps: number;
};

function getNumericStateValue(
  assessments: StructuredStateAssessment[],
  key: StructuredStateKey,
) {
  return assessments.find((assessment) => assessment.key === key)?.value ?? 0;
}

function toDisplayScore(value: number) {
  return value * 100;
}

function getGrowthImportanceRaw(account: NormalizedAccountRecord) {
  return (account.arr_gbp ?? 0) + 0.75 * (account.expansion_pipeline_gbp ?? 0);
}

export function rankGrowthAccounts(inputs: GrowthRankingInput[]) {
  const growthScores = computePercentileRankScores(
    inputs.map((input) => ({
      accountId: input.account.account_id,
      value: getGrowthImportanceRaw(input.account),
    })),
  );

  return inputs
    .map((input) => {
      const expansionOpportunity = Math.min(
        Math.max(
          getNumericStateValue(input.assessments, "expansionOpportunity"),
          0,
        ),
        1,
      );
      const growthScore = growthScores.get(input.account.account_id) ?? 0;
      const growthPriority =
        0.65 * toDisplayScore(expansionOpportunity) + 0.35 * growthScore;

      return {
        account: input.account,
        review: input.review,
        rankTieData: {
          expansionOpportunity,
          growthScore,
          growthPriority,
        },
        serviceFailure: toDisplayScore(
          getNumericStateValue(input.assessments, "serviceFailure"),
        ),
        relationshipRisk: toDisplayScore(
          getNumericStateValue(input.assessments, "relationshipRisk"),
        ),
        usageDecline: toDisplayScore(
          getNumericStateValue(input.assessments, "usageDecline"),
        ),
        lowAdoption: toDisplayScore(
          getNumericStateValue(input.assessments, "lowAdoption"),
        ),
        lowNps: toDisplayScore(getNumericStateValue(input.assessments, "lowNps")),
      };
    })
    .sort((left, right) => {
      if (right.rankTieData.growthPriority !== left.rankTieData.growthPriority) {
        return right.rankTieData.growthPriority - left.rankTieData.growthPriority;
      }

      if (
        right.rankTieData.expansionOpportunity !==
        left.rankTieData.expansionOpportunity
      ) {
        return (
          right.rankTieData.expansionOpportunity -
          left.rankTieData.expansionOpportunity
        );
      }

      if (right.rankTieData.growthScore !== left.rankTieData.growthScore) {
        return right.rankTieData.growthScore - left.rankTieData.growthScore;
      }

      return left.account.account_id.localeCompare(right.account.account_id);
    })
    .map((entry, index): RankedGrowthAccount => ({
      rank: index + 1,
      accountId: entry.account.account_id,
      accountName: entry.account.account_name ?? entry.account.account_id,
      arrGbp: entry.account.arr_gbp,
      renewalDate: entry.review.renewal.renewalDate,
      daysToRenewal: entry.review.renewal.daysToRenewal,
      pipelinePotential: entry.review.pipelinePotential,
      growthScore: entry.rankTieData.growthScore,
      expansionOpportunity: toDisplayScore(
        entry.rankTieData.expansionOpportunity,
      ),
      expansionConfidence: entry.review.expansionConfidenceScore,
      expansionConfidenceBand: entry.review.expansionConfidenceBand,
      growthPriority: entry.rankTieData.growthPriority,
      serviceFailure: entry.serviceFailure,
      relationshipRisk: entry.relationshipRisk,
      usageDecline: entry.usageDecline,
      lowAdoption: entry.lowAdoption,
      lowNps: entry.lowNps,
    }));
}

export async function getRankedGrowthAccounts(referenceDate: Date = new Date()) {
  const accounts = await getAllAccounts();
  const inputs = await Promise.all(
    accounts.map(async (account) => {
      const interpretation = await getAccountNoteInterpretation(account);
      return {
        account,
        review: computeStructuredAccountReview(
          account,
          interpretation,
          referenceDate,
        ),
        assessments: computeStructuredStateAssessments(account, interpretation),
      };
    }),
  );

  return rankGrowthAccounts(inputs);
}
