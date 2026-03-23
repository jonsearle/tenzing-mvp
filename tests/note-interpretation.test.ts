import {
  buildNormalizedNoteInterpretationInput,
  getAccountNoteInterpretation,
  requestNoteInterpretationFromOpenAI,
} from "@/lib/notes/interpretation";
import type { NormalizedAccountRecord } from "@/types/account";

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
    account_owner: null,
    csm_owner: null,
    support_tier: null,
    billing_frequency: null,
    billing_currency: null,
    note_sentiment_hint: "ignore me",
    recent_support_summary: "Support reports several escalations.",
    recent_customer_note: " Customer says trust is low. ",
    recent_sales_note: "Sales sees room to expand.",
    arr_gbp: 120000,
    seats_purchased: 100,
    seats_used: 20,
    latest_nps: -10,
    open_leads_count: null,
    avg_lead_score: null,
    open_tickets_count: 3,
    urgent_open_tickets_count: 4,
    sla_breaches_90d: null,
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

describe("note interpretation", () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  const originalModel = process.env.OPENAI_MODEL;

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalApiKey;
    process.env.OPENAI_MODEL = originalModel;
    vi.restoreAllMocks();
  });

  it("builds a contextual interpretation input from relative labels plus locked notes", async () => {
    const normalized = await buildNormalizedNoteInterpretationInput(createAccount());

    expect(normalized).toContain("arr_importance:");
    expect(normalized).toContain("renewal_urgency:");
    expect(normalized).toContain("adoption_context: very low overall adoption");
    expect(normalized).toContain("usage_context: sharp usage decline");
    expect(normalized).toContain("service_context: severe service pressure");
    expect(normalized).toContain(
      "recent_customer_note: customer says trust is low.",
    );
    expect(normalized).toContain(
      "recent_sales_note: sales sees room to expand.",
    );
    expect(normalized).toContain(
      "recent_support_summary: support reports several escalations.",
    );
    expect(normalized).not.toContain("ignore me");
  });

  it("returns unavailable and skips cache/model work when all notes are empty", async () => {
    const loadCachedInterpretation = vi.fn();
    const saveCachedInterpretation = vi.fn();
    const requestInterpretation = vi.fn();

    const result = await getAccountNoteInterpretation(
      createAccount({
        recent_customer_note: " ",
        recent_sales_note: null,
        recent_support_summary: "",
      }),
      {
        loadCachedInterpretation,
        saveCachedInterpretation,
        requestInterpretation,
      },
    );

    expect(result).toEqual({
      status: "unavailable",
      source: "empty",
      reason: "AI interpretation unavailable because all note fields are empty.",
      normalizedNoteText: null,
    });
    expect(loadCachedInterpretation).not.toHaveBeenCalled();
    expect(saveCachedInterpretation).not.toHaveBeenCalled();
    expect(requestInterpretation).not.toHaveBeenCalled();
  });

  it("reuses a successful cached interpretation when the normalized notes are unchanged", async () => {
    const normalizedInput = await buildNormalizedNoteInterpretationInput(createAccount());
    const loadCachedInterpretation = vi.fn().mockResolvedValue({
      accountId: "ACC-123",
      normalizedNoteText: normalizedInput,
      overallSummary: "Cached summary",
      relationshipVibe: "negative",
      growthVibe: "positive",
      primaryDriver: "Service pressure is dominating the account.",
      recommendedActionSummary: "Stabilise service before pushing expansion.",
      confidence: "medium",
      mixedSignals: ["Expansion interest exists despite trust concerns."],
      createdAt: null,
      updatedAt: null,
    });
    const saveCachedInterpretation = vi.fn();
    const requestInterpretation = vi.fn();

    const result = await getAccountNoteInterpretation(createAccount(), {
      loadCachedInterpretation,
      saveCachedInterpretation,
      requestInterpretation,
    });

    expect(result).toMatchObject({
      status: "available",
      source: "cache",
    });
    expect(requestInterpretation).not.toHaveBeenCalled();
    expect(saveCachedInterpretation).not.toHaveBeenCalled();
  });

  it("invalidates cache and stores a fresh result when the normalized notes change", async () => {
    const loadCachedInterpretation = vi.fn().mockResolvedValue({
      accountId: "ACC-123",
      normalizedNoteText: "older note text",
      overallSummary: "Old summary",
      relationshipVibe: "neutral",
      growthVibe: "neutral",
      createdAt: null,
      updatedAt: null,
    });
    const requestInterpretation = vi.fn().mockResolvedValue({
      overallSummary: "Fresh summary",
      relationshipVibe: "negative",
      growthVibe: "positive",
      primaryDriver: "Renewal risk is rising.",
      recommendedActionSummary: "Run a recovery plan with the sponsor.",
      confidence: "high",
      mixedSignals: ["Growth interest remains in sales notes."],
    });
    const saveCachedInterpretation = vi.fn().mockResolvedValue(undefined);

    const result = await getAccountNoteInterpretation(createAccount(), {
      loadCachedInterpretation,
      saveCachedInterpretation,
      requestInterpretation,
    });

    expect(result).toMatchObject({
      status: "available",
      source: "live",
      interpretation: {
        overallSummary: "Fresh summary",
        relationshipVibe: "negative",
        growthVibe: "positive",
        primaryDriver: "Renewal risk is rising.",
        recommendedActionSummary: "Run a recovery plan with the sponsor.",
        confidence: "high",
        mixedSignals: ["Growth interest remains in sales notes."],
      },
    });
    expect(requestInterpretation).toHaveBeenCalledWith(
      expect.stringContaining("account_name: example co"),
    );
    expect(requestInterpretation).toHaveBeenCalledWith(
      expect.stringContaining("recent_customer_note: customer says trust is low."),
    );
    expect(saveCachedInterpretation).toHaveBeenCalledTimes(1);
  });

  it("does not cache failed or invalid interpretation attempts", async () => {
    const saveCachedInterpretation = vi.fn();

    const result = await getAccountNoteInterpretation(createAccount(), {
      loadCachedInterpretation: vi.fn().mockResolvedValue(null),
      saveCachedInterpretation,
      requestInterpretation: vi.fn().mockRejectedValue(new Error("boom")),
    });

    expect(result).toEqual({
      status: "unavailable",
      source: "error",
      reason: "AI interpretation was unavailable for this view.",
      normalizedNoteText: await buildNormalizedNoteInterpretationInput(
        createAccount(),
      ),
    });
    expect(saveCachedInterpretation).not.toHaveBeenCalled();
  });

  it("parses the structured OpenAI response and sends the contextual account brief", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "gpt-4o-mini";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                overall_summary: "A concise summary.",
                relationship_vibe: "negative",
                growth_vibe: "neutral",
                primary_driver: "The account is under delivery pressure.",
                recommended_action_summary:
                  "Stabilise the account before pushing further growth.",
                confidence: "medium",
                mixed_signals: ["Sales notes still mention upside."],
              }),
            },
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await requestNoteInterpretationFromOpenAI(
      "customer says trust is low.\n\nsales sees room to expand.",
    );

    expect(result).toEqual({
      overallSummary: "A concise summary.",
      relationshipVibe: "negative",
      growthVibe: "neutral",
      primaryDriver: "The account is under delivery pressure.",
      recommendedActionSummary:
        "Stabilise the account before pushing further growth.",
      confidence: "medium",
      mixedSignals: ["Sales notes still mention upside."],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.openai.com/v1/chat/completions",
    );

    const requestInit = fetchMock.mock.calls[0]?.[1];
    const body = JSON.parse(String(requestInit?.body));

    expect(body.messages[0].content).toContain(
      "Reconcile conflicts explicitly instead of silently picking one signal.",
    );
    expect(body.messages[0].content).toContain(
      "Do not infer that ARR is healthy just because it is large, or that pipeline is attractive just because it exists.",
    );
    expect(body.messages[0].content).toContain(
      "Do not describe a renewal date itself as stable, healthy, or positive.",
    );
    expect(body.messages[1].content).toContain(
      "When notes and structured metrics conflict, explain the tension explicitly.",
    );
    expect(body.messages[1].content).toContain(
      "Do not describe a renewal date as stable; mention renewal only if it creates near-term pressure or is materially relevant.",
    );
    expect(body.messages[1].content).toContain(
      "Make primary_driver shorter than overall_summary, materially different from it, and focused on one urgent factor rather than a broad recap.",
    );
    expect(body.messages[1].content).toContain(
      "If the overall summary already covers several issues, primary_driver should name only the most decision-relevant one.",
    );
    expect(body.messages[1].content).toContain(
      "customer says trust is low.\n\nsales sees room to expand.",
    );
    expect(body.messages[1].content).not.toContain("ignore me");
  });

  it("derives a shorter primary driver when the model repeats the full summary", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "gpt-4o-mini";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                overall_summary:
                  "Nimbus People has healthy overall adoption metrics, but there are significant issues with declining usage and unresolved service pressures that are particularly affecting key teams. This situation is exacerbated by high renewal urgency due in 16 days, creating potential risks for future engagement.",
                relationship_vibe: "negative",
                growth_vibe: "neutral",
                primary_driver:
                  "Nimbus People has healthy overall adoption metrics, but there are significant issues with declining usage and unresolved service pressures that are particularly affecting key teams. This situation is exacerbated by high renewal urgency due in 16 days, creating potential risks for future engagement.",
                recommended_action_summary:
                  "Stabilise service and align on a renewal recovery plan.",
                confidence: "medium",
                mixed_signals: [],
              }),
            },
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await requestNoteInterpretationFromOpenAI(
      "nimbus people context",
    );

    expect(result.primaryDriver).not.toBe(result.overallSummary);
    expect(result.primaryDriver).toContain("renewal");
  });

  it("derives a distinct recommended action summary when the model repeats the overview", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "gpt-4o-mini";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                overall_summary:
                  "Nimbus People has healthy overall adoption metrics, but there are significant issues with declining usage and unresolved service pressures that are particularly affecting key teams. This situation is exacerbated by high renewal urgency due in 16 days, creating potential risks for future engagement.",
                relationship_vibe: "negative",
                growth_vibe: "neutral",
                primary_driver:
                  "This situation is exacerbated by high renewal urgency due in 16 days, creating potential risks for future engagement.",
                recommended_action_summary:
                  "Nimbus People has healthy overall adoption metrics, but there are significant issues with declining usage and unresolved service pressures that are particularly affecting key teams. This situation is exacerbated by high renewal urgency due in 16 days, creating potential risks for future engagement.",
                confidence: "medium",
                mixed_signals: [],
              }),
            },
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await requestNoteInterpretationFromOpenAI(
      "nimbus people context",
    );

    expect(result.recommendedActionSummary).not.toBe(result.overallSummary);
    expect(result.recommendedActionSummary.toLowerCase()).toContain("service");
  });
});
