# State Display Rollout Slices

Date: 2026-03-22

Parent spec:

- `docs/product-definition-spec.md`

## Slice 1: Lock Display Terminology And Band Rules

**Type**: AFK

**Blocked by**: None - can start immediately

**What to build**

Update the live product spec so the team has one clear source of truth for the new user-facing state labels, shared `0-100` thresholds, reversed display-direction rules for five states, and the explicit non-goal that scoring and recommendation logic do not change.

**Acceptance criteria**

- [ ] The live spec distinguishes canonical internal state names from user-facing display labels.
- [ ] The live spec records the final five-band display labels for all six states.
- [ ] The live spec states that ranking formulas, recommendation mapping, and saved decision behavior do not change in this rollout.

## Slice 2: Add Shared Display Mapping Helper

**Type**: AFK

**Blocked by**:

- Slice 1

**What to build**

Implement one shared helper that converts canonical state keys plus raw `0-100` scores into user-facing display labels, display bands, and matching visual direction. This helper should be the only place that knows which states invert their display meaning.

**Acceptance criteria**

- [ ] One shared helper maps each canonical state key to its user-facing display label.
- [ ] The helper returns the correct band for each score threshold.
- [ ] The helper reverses band direction for every state except `Growth Opportunity`.
- [ ] Tests cover threshold boundaries and inverted-direction behavior.

## Slice 3: Roll The New Labels Through User-Facing Surfaces

**Type**: AFK

**Blocked by**:

- Slice 2

**What to build**

Update the portfolio page, both queue pages, and the account detail page to use the new user-facing labels and display bands while still showing the underlying `0-100` score for transparency during rollout.

**Acceptance criteria**

- [ ] Homepage risk and growth tables use the new user-facing labels.
- [ ] Account detail state cards show the new labels and bands.
- [ ] Score presentation stays inspectable during rollout by keeping the numeric `0-100` score visible.
- [ ] No recommendation behavior changes as a result of the label rollout.

## Slice 4: Update Review And Decision-Grounding Surfaces

**Type**: AFK

**Blocked by**:

- Slice 2

**What to build**

Update the manual review flow and recommendation-grounding views so reviewers see the new user-facing labels while the app still maps recommendations from the canonical internal state keys.

**Acceptance criteria**

- [ ] Manual review strongest-signal output uses the new user-facing labels.
- [ ] Account recommendation context remains grounded in the same underlying state as before.
- [ ] No saved-decision schema changes are required for this rollout.

## Slice 5: Regression Validation And Release Check

**Type**: HITL

**Blocked by**:

- Slice 3
- Slice 4

**What to build**

Run a focused regression pass to prove that this is a presentation-layer improvement only: queue ordering stays the same, recommendation defaults stay the same, and the new labels read clearly across the key screens.

**Acceptance criteria**

- [ ] Risk queue ordering is unchanged before and after the rollout.
- [ ] Growth queue ordering is unchanged before and after the rollout.
- [ ] Recommended actions for sampled accounts are unchanged before and after the rollout.
- [ ] A human review signs off that the new labels and bands read clearly on portfolio, queue, account detail, and manual review screens.
