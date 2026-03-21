import { getAllAccounts } from "@/lib/data/accounts";
import { getAccountNoteInterpretation } from "@/lib/notes/interpretation";
import {
  computeStructuredAccountReview,
  computeStructuredStateAssessments,
  type StructuredAccountReview,
  type StructuredStateAssessment,
  type StructuredStateKey,
} from "@/lib/scoring/account-detail";
import type { NormalizedAccountRecord } from "@/types/account";

type RiskRankingInput = {
  account: NormalizedAccountRecord;
  review: StructuredAccountReview;
  assessments: StructuredStateAssessment[];
};

export type RankedRiskAccount = {
  rank: number;
  accountId: string;
  accountName: string;
  arrGbp: number | null;
  renewalDate: string | null;
  daysToRenewal: number | null;
  renewalScore: number;
  arrPotentialScore: number;
  riskSeverity: number;
  riskPriority: number;
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

function getRiskImportanceRaw(account: NormalizedAccountRecord) {
  return (account.arr_gbp ?? 0) + 0.2 * (account.expansion_pipeline_gbp ?? 0);
}

export function computePercentileRankScores(
  values: Array<{
    accountId: string;
    value: number;
  }>,
) {
  if (values.length === 0) {
    return new Map<string, number>();
  }

  if (values.length === 1) {
    return new Map([[values[0].accountId, 100]]);
  }

  const sorted = [...values].sort((left, right) => left.value - right.value);
  const scores = new Map<string, number>();

  let index = 0;

  while (index < sorted.length) {
    let tieEnd = index;

    while (
      tieEnd + 1 < sorted.length &&
      sorted[tieEnd + 1].value === sorted[index].value
    ) {
      tieEnd += 1;
    }

    const averageRank = ((index + 1) + (tieEnd + 1)) / 2;
    const percentile = 100 * ((averageRank - 1) / (sorted.length - 1));

    for (let tieIndex = index; tieIndex <= tieEnd; tieIndex += 1) {
      scores.set(sorted[tieIndex].accountId, percentile);
    }

    index = tieEnd + 1;
  }

  return scores;
}

export function rankRiskAccounts(inputs: RiskRankingInput[]) {
  const importanceScores = computePercentileRankScores(
    inputs.map((input) => ({
      accountId: input.account.account_id,
      value: getRiskImportanceRaw(input.account),
    })),
  );

  const ranked = inputs
    .map((input) => {
      const serviceFailure = getNumericStateValue(
        input.assessments,
        "serviceFailure",
      );
      const relationshipRisk = getNumericStateValue(
        input.assessments,
        "relationshipRisk",
      );
      const usageDecline = getNumericStateValue(input.assessments, "usageDecline");
      const lowAdoption = getNumericStateValue(input.assessments, "lowAdoption");
      const lowNps = getNumericStateValue(input.assessments, "lowNps");
      const riskSeverity =
        (serviceFailure +
          relationshipRisk +
          usageDecline +
          0.9 * lowAdoption +
          0.8 * lowNps) /
        4.6;
      const arrPotentialScore =
        importanceScores.get(input.account.account_id) ?? 0;
      const riskPriority =
        0.6 * toDisplayScore(riskSeverity) +
        0.25 * arrPotentialScore +
        0.15 * input.review.renewal.renewalScore;

      return {
        account: input.account,
        review: input.review,
        rankTieData: {
          riskSeverity,
          arrPotentialScore,
          riskPriority,
        },
        serviceFailure: toDisplayScore(serviceFailure),
        relationshipRisk: toDisplayScore(relationshipRisk),
        usageDecline: toDisplayScore(usageDecline),
        lowAdoption: toDisplayScore(lowAdoption),
        lowNps: toDisplayScore(lowNps),
      };
    })
    .sort((left, right) => {
      if (right.rankTieData.riskPriority !== left.rankTieData.riskPriority) {
        return right.rankTieData.riskPriority - left.rankTieData.riskPriority;
      }

      if (right.rankTieData.riskSeverity !== left.rankTieData.riskSeverity) {
        return right.rankTieData.riskSeverity - left.rankTieData.riskSeverity;
      }

      if (
        right.rankTieData.arrPotentialScore !== left.rankTieData.arrPotentialScore
      ) {
        return (
          right.rankTieData.arrPotentialScore - left.rankTieData.arrPotentialScore
        );
      }

      return left.account.account_id.localeCompare(right.account.account_id);
    })
    .map((entry, index): RankedRiskAccount => ({
      rank: index + 1,
      accountId: entry.account.account_id,
      accountName: entry.account.account_name ?? entry.account.account_id,
      arrGbp: entry.account.arr_gbp,
      renewalDate: entry.review.renewal.renewalDate,
      daysToRenewal: entry.review.renewal.daysToRenewal,
      renewalScore: entry.review.renewal.renewalScore,
      arrPotentialScore: entry.rankTieData.arrPotentialScore,
      riskSeverity: toDisplayScore(entry.rankTieData.riskSeverity),
      riskPriority: entry.rankTieData.riskPriority,
      serviceFailure: entry.serviceFailure,
      relationshipRisk: entry.relationshipRisk,
      usageDecline: entry.usageDecline,
      lowAdoption: entry.lowAdoption,
      lowNps: entry.lowNps,
    }));

  return ranked;
}

export async function getRankedRiskAccounts(referenceDate: Date = new Date()) {
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

  return rankRiskAccounts(inputs);
}
