import {
  getStateDisplayDefinition,
  getStateDisplayLabelFromCanonicalLabel,
  getStateDisplayValue,
} from "@/lib/scoring/state-display";

describe("state display mapping", () => {
  it("maps canonical state keys to the locked user-facing labels", () => {
    expect(getStateDisplayDefinition("serviceFailure").label).toBe("Service Health");
    expect(getStateDisplayDefinition("lowAdoption").label).toBe("Adoption");
    expect(getStateDisplayDefinition("usageDecline").label).toBe("Usage Momentum");
    expect(getStateDisplayDefinition("relationshipRisk").label).toBe(
      "Relationship Strength",
    );
    expect(getStateDisplayDefinition("expansionOpportunity").label).toBe(
      "Growth Opportunity",
    );
    expect(getStateDisplayDefinition("lowNps").label).toBe("Customer Sentiment");
  });

  it("translates canonical state labels for recommendation and history surfaces", () => {
    expect(getStateDisplayLabelFromCanonicalLabel("Service Failure")).toBe(
      "Service Health",
    );
    expect(getStateDisplayLabelFromCanonicalLabel("Low NPS")).toBe(
      "Customer Sentiment",
    );
    expect(getStateDisplayLabelFromCanonicalLabel("Unknown label")).toBe(
      "Unknown label",
    );
    expect(getStateDisplayLabelFromCanonicalLabel(null)).toBeNull();
  });

  it("normalizes risk-style internal scores to a 0-bad 100-good display score", () => {
    expect(getStateDisplayValue("serviceFailure", 0)).toMatchObject({
      label: "Service Health",
      band: "Very Good",
      tone: "positive",
      displayScore: 100,
      rawScore: 0,
    });
    expect(getStateDisplayValue("serviceFailure", 19)).toMatchObject({
      band: "Very Good",
      displayScore: 81,
    });
    expect(getStateDisplayValue("serviceFailure", 20).band).toBe("Very Good");
    expect(getStateDisplayValue("serviceFailure", 21).band).toBe("Good");
    expect(getStateDisplayValue("serviceFailure", 40).band).toBe("Good");
    expect(getStateDisplayValue("serviceFailure", 41).band).toBe("OK");
    expect(getStateDisplayValue("serviceFailure", 60).band).toBe("OK");
    expect(getStateDisplayValue("serviceFailure", 61).band).toBe("Bad");
    expect(getStateDisplayValue("serviceFailure", 80)).toMatchObject({
      band: "Bad",
      tone: "negative",
    });
    expect(getStateDisplayValue("serviceFailure", 81)).toMatchObject({
      band: "Very Bad",
      tone: "negative",
    });
  });

  it("keeps growth opportunity aligned with the raw score direction", () => {
    expect(getStateDisplayValue("expansionOpportunity", 0)).toMatchObject({
      label: "Growth Opportunity",
      band: "None",
      tone: "negative",
      displayScore: 0,
    });
    expect(getStateDisplayValue("expansionOpportunity", 39).band).toBe("Limited");
    expect(getStateDisplayValue("expansionOpportunity", 59).band).toBe("Moderate");
    expect(getStateDisplayValue("expansionOpportunity", 79).band).toBe("Strong");
    expect(getStateDisplayValue("expansionOpportunity", 100)).toMatchObject({
      band: "Very High",
      tone: "positive",
      displayScore: 100,
    });
  });

  it("returns the agreed user-facing bands for the remaining state families", () => {
    expect(getStateDisplayValue("lowAdoption", 12)).toMatchObject({
      band: "Fully Embedded",
      displayScore: 88,
    });
    expect(getStateDisplayValue("usageDecline", 33).band).toBe("Growing");
    expect(getStateDisplayValue("relationshipRisk", 58).band).toBe("Mixed");
    expect(getStateDisplayValue("lowNps", 71).band).toBe("Weak");
  });

  it("returns null banding when a state score is unavailable", () => {
    expect(getStateDisplayValue("relationshipRisk", null)).toEqual({
      key: "relationshipRisk",
      label: "Relationship Strength",
      band: null,
      tone: null,
      displayScore: null,
      rawScore: null,
    });
  });

  it("clamps and rounds scores before banding", () => {
    expect(getStateDisplayValue("serviceFailure", -2.4)).toMatchObject({
      band: "Very Good",
      displayScore: 100,
      rawScore: 0,
    });
    expect(getStateDisplayValue("expansionOpportunity", 59.6)).toMatchObject({
      band: "Strong",
      displayScore: 60,
      rawScore: 60,
    });
    expect(getStateDisplayValue("lowNps", 140)).toMatchObject({
      band: "Negative",
      displayScore: 0,
      rawScore: 100,
    });
  });
});
