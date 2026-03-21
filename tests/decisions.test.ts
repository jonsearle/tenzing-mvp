import {
  ACTION_LIBRARY,
  buildDecisionRecord,
  getRecommendedAction,
} from "@/lib/decisions";
import type { StructuredAccountReview } from "@/lib/scoring/account-detail";

function createReview(
  scores: Partial<Record<StructuredAccountReview["states"][number]["key"], number | null>>,
): StructuredAccountReview {
  return {
    states: [
      {
        key: "serviceFailure",
        label: "Service Failure",
        score: scores.serviceFailure ?? 0,
        confidence: 100,
        status: "available",
      },
      {
        key: "lowAdoption",
        label: "Low Adoption",
        score: scores.lowAdoption ?? 0,
        confidence: 100,
        status: "available",
      },
      {
        key: "usageDecline",
        label: "Usage Decline",
        score: scores.usageDecline ?? 0,
        confidence: 100,
        status: "available",
      },
      {
        key: "relationshipRisk",
        label: "Relationship Risk",
        score: scores.relationshipRisk ?? 0,
        confidence: 100,
        status: "available",
      },
      {
        key: "expansionOpportunity",
        label: "Expansion Opportunity",
        score: scores.expansionOpportunity ?? 0,
        confidence: 100,
        status: "available",
      },
      {
        key: "lowNps",
        label: "Low NPS",
        score: scores.lowNps ?? 0,
        confidence: 100,
        status: "available",
      },
    ],
    renewal: {
      renewalDate: "2026-04-15",
      daysToRenewal: 25,
      renewalScore: 100,
    },
    pipelinePotential: 50000,
    expansionConfidenceScore: 100,
    expansionConfidenceBand: "Confident",
  };
}

describe("decision recommendation logic", () => {
  it("uses the fixed action library for this MVP slice", () => {
    expect(ACTION_LIBRARY.map((action) => action.label)).toEqual([
      "Escalate Support And Stabilise Service",
      "Launch Adoption Recovery Plan",
      "Run Usage Recovery Outreach",
      "Hold Relationship Reset",
      "Review Low NPS And Close Issues",
      "Progress Expansion Opportunity",
    ]);
  });

  it("preselects the mapped action for a unique highest relevant state", () => {
    const recommendation = getRecommendedAction(
      createReview({
        lowAdoption: 83,
        usageDecline: 75,
        lowNps: 40,
      }),
    );

    expect(recommendation).toEqual({
      action: "Launch Adoption Recovery Plan",
      stateLabel: "Low Adoption",
      reason: "highest_state",
    });
  });

  it("returns no default action when all state scores are zero", () => {
    const recommendation = getRecommendedAction(createReview({}));

    expect(recommendation).toEqual({
      action: null,
      stateLabel: null,
      reason: "all_zero",
    });
  });

  it("returns no default action when the highest relevant score is tied", () => {
    const recommendation = getRecommendedAction(
      createReview({
        serviceFailure: 70,
        lowNps: 70,
        usageDecline: 35,
      }),
    );

    expect(recommendation).toEqual({
      action: null,
      stateLabel: null,
      reason: "tie",
    });
  });
});

describe("decision persistence shaping", () => {
  it("stores accepted outcomes when the saved action matches the default", () => {
    expect(
      buildDecisionRecord({
        accountId: "ACC-123",
        selectedAction: "Hold Relationship Reset",
        recommendedAction: "Hold Relationship Reset",
        recommendedStateLabel: "Relationship Risk",
        userNote: " Customer asked for executive follow-up. ",
      }),
    ).toEqual({
      account_id: "ACC-123",
      selected_action: "Hold Relationship Reset",
      default_recommended_action: "Hold Relationship Reset",
      default_recommended_state: "Relationship Risk",
      recommendation_outcome: "accepted",
      user_note: "Customer asked for executive follow-up.",
    });
  });

  it("stores overridden outcomes when the user changes the default", () => {
    expect(
      buildDecisionRecord({
        accountId: "ACC-123",
        selectedAction: "Review Low NPS And Close Issues",
        recommendedAction: "Launch Adoption Recovery Plan",
        recommendedStateLabel: "Low Adoption",
        userNote: "",
      }),
    ).toEqual({
      account_id: "ACC-123",
      selected_action: "Review Low NPS And Close Issues",
      default_recommended_action: "Launch Adoption Recovery Plan",
      default_recommended_state: "Low Adoption",
      recommendation_outcome: "overridden",
      user_note: null,
    });
  });

  it("stores none when no default recommendation existed", () => {
    expect(
      buildDecisionRecord({
        accountId: "ACC-123",
        selectedAction: "Progress Expansion Opportunity",
        recommendedAction: null,
        recommendedStateLabel: null,
      }),
    ).toEqual({
      account_id: "ACC-123",
      selected_action: "Progress Expansion Opportunity",
      default_recommended_action: null,
      default_recommended_state: null,
      recommendation_outcome: "none",
      user_note: null,
    });
  });
});
