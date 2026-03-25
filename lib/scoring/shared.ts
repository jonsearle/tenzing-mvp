import { cache } from "react";

import { getAllAccounts } from "@/lib/data/accounts";
import {
  getAccountNoteInterpretations,
  type AccountNoteInterpretationResult,
} from "@/lib/notes/interpretation";
import {
  computeStructuredAccountReview,
  computeStructuredStateAssessments,
  getUtcDayTimestamp,
  type StructuredAccountReview,
  type StructuredStateAssessment,
} from "@/lib/scoring/account-detail";
import type { NormalizedAccountRecord } from "@/types/account";

export type AccountScoringContext = {
  account: NormalizedAccountRecord;
  interpretation: AccountNoteInterpretationResult;
  review: StructuredAccountReview;
  assessments: StructuredStateAssessment[];
};

const getSharedAccountScoringContexts = cache(async (referenceDayKey: string) => {
  const referenceDate = new Date(Number(referenceDayKey));
  const accounts = await getAllAccounts();
  const interpretations = await getAccountNoteInterpretations(accounts);

  return accounts.map((account): AccountScoringContext => {
    const interpretation = interpretations.get(account.account_id) ?? {
      status: "unavailable",
      source: "error",
      reason: "AI interpretation was unavailable for this view.",
      normalizedNoteText: null,
    };

    return {
      account,
      interpretation,
      review: computeStructuredAccountReview(account, interpretation, referenceDate),
      assessments: computeStructuredStateAssessments(account, interpretation),
    };
  });
});

export async function getAccountScoringContexts(referenceDate: Date = new Date()) {
  return getSharedAccountScoringContexts(
    String(getUtcDayTimestamp(referenceDate)),
  );
}

export async function getAccountScoringContextMap(
  referenceDate: Date = new Date(),
) {
  const contexts = await getAccountScoringContexts(referenceDate);

  return new Map(
    contexts.map((context) => [context.account.account_id, context] as const),
  );
}
