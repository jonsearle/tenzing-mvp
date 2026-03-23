import {
  ACTION_LIBRARY,
  buildDecisionRecord,
  getActionExecutionPlan,
  getRecommendedAction,
} from "@/lib/decisions";
import type { StructuredAccountReview } from "@/lib/scoring/account-detail";
import type { NormalizedAccountRecord } from "@/types/account";

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

function createAccount(
  overrides: Partial<NormalizedAccountRecord> = {},
): NormalizedAccountRecord {
  return {
    account_id: "ACC-123",
    row_number: 2,
    coercion_failures: {},
    external_account_ref: null,
    account_name: "Example Co",
    website: null,
    industry: null,
    segment: null,
    region: null,
    account_status: null,
    lifecycle_stage: null,
    account_owner: "Alice Johnson",
    csm_owner: "Tom Willis",
    support_tier: null,
    billing_frequency: null,
    billing_currency: null,
    note_sentiment_hint: null,
    recent_support_summary: null,
    recent_customer_note: null,
    recent_sales_note: null,
    arr_gbp: 120000,
    seats_purchased: 100,
    seats_used: 20,
    latest_nps: -10,
    open_leads_count: null,
    avg_lead_score: null,
    open_tickets_count: 3,
    urgent_open_tickets_count: 4,
    sla_breaches_90d: 2,
    avg_csat_90d: null,
    mrr_3m_ago_gbp: null,
    mrr_current_gbp: null,
    usage_score_3m_ago: 80,
    usage_score_current: 50,
    overdue_amount_gbp: null,
    expansion_pipeline_gbp: 40000,
    contraction_risk_gbp: null,
    contract_start_date: null,
    renewal_date: "2026-04-15",
    last_lead_activity_date: null,
    last_qbr_date: null,
    latest_note_date: null,
    ...overrides,
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

describe("action execution planning", () => {
  it("derives a concrete service recovery plan from the recommended action", () => {
    expect(
      getActionExecutionPlan(
        "Escalate Support And Stabilise Service",
        createAccount(),
        createReview({
          serviceFailure: 85,
        }),
      ),
    ).toEqual({
      owner: "Tom Willis (CSM owner)",
      suggestedTiming: "This week",
      successMetric:
        "Urgent tickets and SLA breaches trend down from today’s baseline.",
      twoWeekCheck:
        "Confirm whether urgent tickets are below 3 and no new SLA breach pattern is forming.",
    });
  });

  it("derives an expansion workflow from the recommended action", () => {
    expect(
      getActionExecutionPlan(
        "Progress Expansion Opportunity",
        createAccount({
          account_owner: "Farah Malik",
          expansion_pipeline_gbp: 105180,
        }),
        createReview({
          expansionOpportunity: 80,
          serviceFailure: 10,
          lowAdoption: 15,
          usageDecline: 20,
          relationshipRisk: 0,
          lowNps: 0,
        }),
      ),
    ).toEqual({
      owner: "Farah Malik (Account owner)",
      suggestedTiming: "Within 2 weeks",
      successMetric:
        "Expansion pipeline advances through a concrete commercial next step.",
      twoWeekCheck:
        "Check whether the current pipeline of GBP 105,180 has moved into a scheduled demo, proposal, or leadership discussion.",
    });
  });

  it("returns null when there is no recommended action", () => {
    expect(getActionExecutionPlan(null, createAccount(), createReview({}))).toBeNull();
  });
});
