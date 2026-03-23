# Interview Prototype PRD Slices

Status: Final local version

Source PRD: `docs/interview-prototype-prd.md`

Workflow: Linear-first, local-first. This file is the final local planning artifact and is not yet published to Linear or GitHub.

Planning principle: the PRD remains the single source of truth for product logic, formulas, and edge-case rules. These slices define delivery order, vertical scope, dependencies, and acceptance boundaries without duplicating the full spec.

## Proposed Breakdown

1. **Authenticated Foundation And CSV Ingestion**
   - **Type**: AFK
   - **Blocked by**: None - can start immediately
   - **User stories covered**: 1, 2, 36, 37, 38, 44, 45, 46, 47
2. **Account Page With Structured State Scores**
   - **Type**: AFK
   - **Blocked by**: Slice 1
   - **User stories covered**: 9, 10, 11, 12, 13, 18, 19, 20, 25, 34, 39, 41
3. **Note Interpretation And AI-Informed State Scores**
   - **Type**: AFK
   - **Blocked by**: Slice 2
   - **User stories covered**: 21, 22, 23, 24, 35, 37, 40
4. **Risk Queue And Homepage Risk Section**
   - **Type**: AFK
   - **Blocked by**: Slice 3
   - **User stories covered**: 3, 4, 6, 7, 8, 14, 16, 17, 42, 43
5. **Growth Queue And Homepage Growth Section**
   - **Type**: AFK
   - **Blocked by**: Slice 3
   - **User stories covered**: 3, 5, 6, 7, 8, 15, 16, 17, 40, 42, 43
6. **Recommended Action And Decision History**
   - **Type**: AFK
   - **Blocked by**: Slice 3
   - **User stories covered**: 26, 27, 28, 29, 30, 31, 32, 33, 37
7. **Manual Product Review And Ranking Sanity Pass**
   - **Type**: HITL
   - **Blocked by**: Slice 4, Slice 5, Slice 6
   - **User stories covered**: 40, 41, 42, 43

## Slice 1: Authenticated Foundation And CSV Ingestion

**Type**: AFK

**Blocked by**: None - can start immediately

**User stories addressed**:

- User story 1
- User story 2
- User story 36
- User story 37
- User story 38
- User story 44
- User story 45
- User story 46
- User story 47

**PRD areas to use**

- Problem Statement
- Solution
- User Stories 1, 2, 36, 37, 38, 44, 45, 46, 47
- Implementation Decisions
- Security Considerations
- Testing Decisions

**What to build**

Create the first end-to-end authenticated path into the product: Google-only sign-in via Supabase, protected portfolio and account routes, and server-side CSV ingestion that exposes a stable account model to the rest of the application without serving the raw CSV to the browser. This slice should bake in the PRD's data-boundary and credential rules from the start rather than deferring them to later cleanup.

**Acceptance criteria**

- [ ] Google sign-in is the only authentication method available in MVP.
- [ ] Unauthenticated users are blocked from portfolio, queue, and account-detail routes.
- [ ] The provided CSV is read server-side as the canonical account source.
- [ ] Ingestion applies the PRD's normalization rules for whitespace trimming, empty-to-null handling, numeric coercion, date parsing, and coercion fallback.
- [ ] `account_id` is treated as the canonical identifier for routes and downstream persistence usage.
- [ ] Browser clients do not receive the raw CSV file itself or server-held credentials.
- [ ] Tests cover CSV normalization behavior and authenticated route protection.

## Slice 2: Account Page With Structured State Scores

**Type**: AFK

**Blocked by**:

- Slice 1

**User stories addressed**:

- User story 9
- User story 10
- User story 11
- User story 12
- User story 13
- User story 18
- User story 19
- User story 20
- User story 25
- User story 34
- User story 39
- User story 41

**PRD areas to use**

- User Stories 9, 10, 11, 12, 13, 18, 19, 20, 25, 34, 39, 41
- Scoring Model
- Implementation Decisions
- Testing Decisions

**What to build**

Build a real account-detail page using only the structured, non-AI parts of the PRD. Compute and display the non-AI diagnostic signals and renewal context, show the raw source notes and expandable full-account-data area, and make the page useful even before note interpretation is integrated. AI-derived fields may be visibly unavailable in this slice as long as that state is intentional and clear.

**Acceptance criteria**

- [ ] The account page renders a title area, overview area, notes-and-evidence area, and expandable full-account-data area.
- [ ] The page computes and displays the PRD-defined non-AI state scores and renewal context on the required `0-100` or display scales.
- [ ] Missing or invalid source values reduce completeness and confidence as defined in the PRD rather than breaking rendering.
- [ ] Raw source notes are visible on the account page even before AI summary is available.
- [ ] AI-derived fields that are not yet implemented are shown as unavailable rather than guessed or silently omitted.
- [ ] Tests cover the structured scoring rules, hard-rule thresholds, completeness behavior, and deterministic outputs for this slice's state set.

## Slice 3: Note Interpretation And AI-Informed State Scores

**Type**: AFK

**Blocked by**:

- Slice 2

**User stories addressed**:

- User story 21
- User story 22
- User story 23
- User story 24
- User story 35
- User story 37
- User story 40

**PRD areas to use**

- User Stories 21, 22, 23, 24, 35, 37, 40
- Note Interpretation
- Relationship Risk
- Expansion Opportunity
- Expansion Confidence
- Implementation Decisions
- Testing Decisions

**What to build**

Integrate the PRD's bounded account-interpretation path into the account page. Use the locked note fields plus a compact structured account brief, make one structured OpenAI call per account view when needed, cache only successful outputs in Supabase, derive the AI-informed state signals from the returned vibes, and keep the account page resilient when notes are empty or interpretation fails.

**Acceptance criteria**

- [ ] Only `recent_customer_note`, `recent_sales_note`, and `recent_support_summary` are used as note inputs for interpretation.
- [ ] A successful interpretation stores only the PRD-defined cache fields in Supabase.
- [ ] Cached interpretation is reused when the normalized account-context string is unchanged.
- [ ] A changed normalized account-context string causes a fresh interpretation attempt.
- [ ] Empty-note accounts make no OpenAI call and show AI-derived fields as unavailable.
- [ ] Failed or invalid OpenAI responses do not block account-page rendering.
- [ ] The account page displays the AI summary plus the PRD-defined AI-informed fields after interpretation is available.
- [ ] Tests cover caching, invalidation, empty-note handling, and mocked OpenAI behavior.

## Slice 4: Risk Queue And Homepage Risk Section

**Type**: AFK

**Blocked by**:

- Slice 3

**User stories addressed**:

- User story 3
- User story 4
- User story 6
- User story 7
- User story 8
- User story 14
- User story 16
- User story 17
- User story 42
- User story 43

**PRD areas to use**

- User Stories 3, 4, 6, 7, 8, 14, 16, 17, 42, 43
- Renewal Display And Urgency
- Ranking Model: Biggest Risks
- Homepage model
- Queue-page model
- Current risk review table columns
- Testing Decisions

**What to build**

Implement the full `Biggest Risks` path end to end: compute the PRD-defined risk ranking outputs, surface the risk half of the homepage decision surface, and provide the full risk queue page with links into account detail. This slice owns the risk section of the homepage, not the complete homepage by itself.

**Acceptance criteria**

- [ ] Risk ranking follows the exact PRD formulas, weights, percentile rules, and tie-breakers.
- [ ] The homepage risk section shows the top five risk accounts with the PRD-defined summary fields.
- [ ] The full `All Risk Accounts` page shows the PRD-defined risk review columns without `Relationship Risk` / `Relationship Strength`.
- [ ] Each surfaced risk account links to the corresponding account page.
- [ ] Tests confirm deterministic ordering, percentile tie handling, and renewal bucket behavior.

## Slice 5: Growth Queue And Homepage Growth Section

**Type**: AFK

**Blocked by**:

- Slice 3

**User stories addressed**:

- User story 3
- User story 5
- User story 6
- User story 7
- User story 8
- User story 15
- User story 16
- User story 17
- User story 40
- User story 42
- User story 43

**PRD areas to use**

- User Stories 3, 5, 6, 7, 8, 15, 16, 17, 40, 42, 43
- Ranking Model: Best Growth Opportunities
- Homepage model
- Queue-page model
- Current growth review table columns
- Testing Decisions

**What to build**

Implement the full `Best Growth Opportunities` path end to end: compute the PRD-defined growth ranking outputs, surface the growth half of the homepage decision surface, and provide the full growth queue page with links into account detail. This slice owns the growth section of the homepage, not the complete homepage by itself.

**Acceptance criteria**

- [ ] Growth ranking follows the exact PRD formulas, weights, percentile rules, and tie-breakers.
- [ ] The homepage growth section shows the top five growth accounts with the PRD-defined summary fields.
- [ ] The full `All Growth Accounts` page shows the PRD-defined growth review columns.
- [ ] Each surfaced growth account links to the corresponding account page.
- [ ] Tests confirm deterministic ordering, percentile tie handling, and the PRD's clamping and scoring behavior for growth ranking.

## Slice 6: Recommended Action And Decision History

**Type**: AFK

**Blocked by**:

- Slice 3

**User stories addressed**:

- User story 26
- User story 27
- User story 28
- User story 29
- User story 30
- User story 31
- User story 32
- User story 33
- User story 37

**PRD areas to use**

- User Stories 26, 27, 28, 29, 30, 31, 32, 33, 37
- Implementation Decisions for recommendation and persistence
- Testing Decisions

**What to build**

Add the action-taking workflow to the account page. Preselect the recommended action when the PRD says one exists, allow override from the fixed action library, persist the final choice and context in Supabase as append-only history, and show a lightweight decision history on the account page. Include the PRD's lightweight `30` day monitoring concept only as framing, not as an active workflow.

**Acceptance criteria**

- [ ] Default action selection follows the PRD's fixed state-to-action mapping rules.
- [ ] No action is preselected when all relevant state scores are `0` or the highest relevant score is tied.
- [ ] The selector is populated only from the fixed MVP action library.
- [ ] Saving records only the PRD-defined decision fields in append-only history.
- [ ] Recommendation outcome is stored as `accepted`, `overridden`, or `none` using the PRD rules.
- [ ] Decision history is visible on the account page in a lightweight format.
- [ ] Tests cover default selection logic, zero and tie handling, override behavior, and persisted decision outcomes.

## Slice 7: Manual Product Review And Ranking Sanity Pass

**Type**: HITL

**Blocked by**:

- Slice 4
- Slice 5
- Slice 6

**User stories addressed**:

- User story 40
- User story 41
- User story 42
- User story 43

**PRD areas to use**

- MVP Success Criteria
- Testing Decisions
- User Stories 40, 41, 42, 43

**What to build**

Run a deliberate human review of the finished MVP against the PRD's review goals. Confirm that the top-ranked accounts and recommended actions feel defensible on the challenge dataset, that the evidence trail is understandable, and that the product reads as a decision surface rather than a dashboard.

**Acceptance criteria**

- [ ] A human reviews the top-ranked risk and growth outputs against the PRD formulas and product intent.
- [ ] A human reviews whether evidence, AI summaries, and recommended actions feel grounded rather than opaque.
- [ ] A human reviews whether the implemented UI remains clear, minimal, and decision-focused.
- [ ] Follow-up fixes discovered during review are captured separately rather than silently folded into the approved MVP slices.

## Notes For Implementation

- Build from the PRD, not from this file alone.
- Use these slices to decide ordering, ownership, and done-ness.
- When a slice needs detailed formulas or edge cases, read the referenced PRD sections rather than copying rules into the ticket body.
- Slice 4 and Slice 5 can run in parallel after Slice 3, but the homepage is only fully complete when both are done.

## Linear-Ready Titles

1. Authenticated Foundation And CSV Ingestion
2. Account Page With Structured State Scores
3. Note Interpretation And AI-Informed State Scores
4. Risk Queue And Homepage Risk Section
5. Growth Queue And Homepage Growth Section
6. Recommended Action And Decision History
7. Manual Product Review And Ranking Sanity Pass
