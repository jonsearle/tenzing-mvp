"use server";

import { redirect } from "next/navigation";

import {
  ACTION_LIBRARY,
  getActionLibraryItem,
  saveAccountDecision,
} from "@/lib/decisions";
import { requireUser } from "@/lib/auth/session";

type SaveDecisionActionInput = {
  accountId: string;
  recommendedAction: string | null;
  recommendedStateLabel: string | null;
};

const validActions = new Set<string>(ACTION_LIBRARY.map((action) => action.label));

function isActionLabel(value: string): value is (typeof ACTION_LIBRARY)[number]["label"] {
  return validActions.has(value);
}

export async function saveDecisionActionV2(
  context: SaveDecisionActionInput,
  formData: FormData,
) {
  await requireUser(`/accounts-v2/${context.accountId}`);

  const selectedAction = String(formData.get("selectedAction") ?? "").trim();
  const userNote = String(formData.get("userNote") ?? "");

  if (!isActionLabel(selectedAction)) {
    redirect(`/accounts-v2/${context.accountId}?decisionStatus=missing-action`);
  }

  const recommendedAction = getActionLibraryItem(context.recommendedAction)?.label ?? null;
  const result = await saveAccountDecision({
    accountId: context.accountId,
    selectedAction,
    recommendedAction,
    recommendedStateLabel: context.recommendedStateLabel,
    userNote,
  });

  if (result.status === "saved") {
    redirect(`/accounts-v2/${context.accountId}?decisionStatus=saved`);
  }

  if (result.status === "unavailable") {
    redirect(`/accounts-v2/${context.accountId}?decisionStatus=unavailable`);
  }

  redirect(`/accounts-v2/${context.accountId}?decisionStatus=error`);
}
