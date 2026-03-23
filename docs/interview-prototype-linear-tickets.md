# Interview Prototype Linear-Ready Tickets

Status: Final local version

Source PRD: `docs/interview-prototype-prd.md`

Source slices: `docs/interview-prototype-slices.md`

Workflow: Linear-first, local-first. These tickets are the final local versions prepared for Linear and are not yet published.

## Suggested Linear Conventions

- **Project**: `Tenzing MVP`
- **Labels**:
  - `mvp`
  - `afk` or `hitl`
  - `risk`, `growth`, `account-page`, `auth`, `data`, `ai`, `decisions`, `review` as applicable
- **Priority**: set by dependency order and critical path, not inferred here

## Dependency Order

1. Authenticated Foundation And CSV Ingestion
2. Account Page With Structured State Scores
3. Note Interpretation And AI-Informed State Scores
4. Risk Queue And Homepage Risk Section
5. Growth Queue And Homepage Growth Section
6. Recommended Action And Decision History
7. Manual Product Review And Ranking Sanity Pass

## Ticket 1

**Title**: Authenticated Foundation And CSV Ingestion

**Type**: AFK

**Suggested labels**: `mvp`, `afk`, `auth`, `data`

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

**Linear body**

## Parent PRD

`docs/interview-prototype-prd.md`

## What to build

Create the first end-to-end authenticated path into the product: Google-only sign-in via Supabase, protected portfolio and account routes, and server-side CSV ingestion that exposes a stable account model to the rest of the application without serving the raw CSV to the browser. Bake in the PRD's data-boundary and credential rules from the start rather than treating them as a later hardening pass.

Use the PRD as the source of truth for:

- Implementation Decisions
- Security Considerations
- Testing Decisions
- User Stories 1, 2, 36, 37, 38, 44, 45, 46, 47

## Acceptance criteria

- [ ] Google sign-in is the only authentication method available in MVP.
- [ ] Unauthenticated users are blocked from portfolio, queue, and account-detail routes.
- [ ] The provided CSV is read server-side as the canonical account source.
- [ ] Ingestion applies the PRD's normalization rules for whitespace trimming, empty-to-null handling, numeric coercion, date parsing, and coercion fallback.
- [ ] `account_id` is treated as the canonical identifier for routes and downstream persistence usage.
- [ ] Browser clients do not receive the raw CSV file itself or server-held credentials.
- [ ] Tests cover CSV normalization behavior and authenticated route protection.

## Blocked by

None - can start immediately

## Notes for implementation

- Build from the PRD, not from this ticket alone.
- Do not duplicate raw account records into Supabase as the primary store.
- Keep server-only credentials and raw CSV access out of client code.

## Ticket 2

**Title**: Account Page With Structured State Scores

**Type**: AFK

**Suggested labels**: `mvp`, `afk`, `account-page`, `data`

**Blocked by**:

- Ticket 1

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

**Linear body**

## Parent PRD

`docs/interview-prototype-prd.md`

## What to build

Build a real account-detail page using only the structured, non-AI parts of the PRD. Compute and display the non-AI diagnostic signals and renewal context, show the raw source notes and expandable full-account-data area, and make the page useful even before note interpretation is integrated. AI-derived fields may be visibly unavailable in this slice as long as that state is intentional and clear.

Use the PRD as the source of truth for:

- Scoring Model
- Implementation Decisions
- Testing Decisions
- User Stories 9, 10, 11, 12, 13, 18, 19, 20, 25, 34, 39, 41

## Acceptance criteria

- [ ] The account page renders a title area, overview area, notes-and-evidence area, and expandable full-account-data area.
- [ ] The page computes and displays the PRD-defined non-AI state scores and renewal context on the required display scales.
- [ ] Missing or invalid source values reduce completeness and confidence as defined in the PRD rather than breaking rendering.
- [ ] Raw source notes are visible on the account page even before AI summary is available.
- [ ] AI-derived fields that are not yet implemented are shown as unavailable rather than guessed or silently omitted.
- [ ] Tests cover the structured scoring rules, hard-rule thresholds, completeness behavior, and deterministic outputs for this slice's state set.

## Blocked by

- Ticket 1

## Notes for implementation

- Keep the PRD as the source of truth for formulas and edge cases.
- This slice intentionally stops short of OpenAI interpretation.

## Ticket 3

**Title**: Note Interpretation And AI-Informed State Scores

**Type**: AFK

**Suggested labels**: `mvp`, `afk`, `account-page`, `ai`

**Blocked by**:

- Ticket 2

**User stories addressed**:

- User story 21
- User story 22
- User story 23
- User story 24
- User story 35
- User story 37
- User story 40

**Linear body**

## Parent PRD

`docs/interview-prototype-prd.md`

## What to build

Integrate the PRD's bounded account-interpretation path into the account page. Use the locked note fields plus a compact structured account brief, make one structured OpenAI call per account view when needed, cache only successful outputs in Supabase, derive the AI-informed state signals from the returned vibes, and keep the account page resilient when notes are empty or interpretation fails.

Use the PRD as the source of truth for:

- Note Interpretation
- Relationship Risk
- Expansion Opportunity
- Expansion Confidence
- Implementation Decisions
- Testing Decisions

## Acceptance criteria

- [ ] Only `recent_customer_note`, `recent_sales_note`, and `recent_support_summary` are used as note inputs for interpretation.
- [ ] A successful interpretation stores only the PRD-defined cache fields in Supabase.
- [ ] Cached interpretation is reused when the normalized account-context string is unchanged.
- [ ] A changed normalized account-context string causes a fresh interpretation attempt.
- [ ] Empty-note accounts make no OpenAI call and show AI-derived fields as unavailable.
- [ ] Failed or invalid OpenAI responses do not block account-page rendering.
- [ ] The account page displays the AI summary plus the PRD-defined AI-informed fields after interpretation is available.
- [ ] Tests cover caching, invalidation, empty-note handling, and mocked OpenAI behavior.

## Blocked by

- Ticket 2

## Notes for implementation

- This ticket is intentionally bounded: interpretation and action framing only.
- Do not let AI become a hidden ranking engine.

## Ticket 4

**Title**: Risk Queue And Homepage Risk Section

**Type**: AFK

**Suggested labels**: `mvp`, `afk`, `risk`

**Blocked by**:

- Ticket 3

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

**Linear body**

## Parent PRD

`docs/interview-prototype-prd.md`

## What to build

Implement the full `Biggest Risks` path end to end: compute the PRD-defined risk ranking outputs, surface the risk half of the homepage decision surface, and provide the full risk queue page with links into account detail. This ticket owns the risk section of the homepage, not the complete homepage by itself.

Current note:

- `Relationship Risk` remains available on account detail as supporting context, but is not shown as a risk-queue column and does not affect deterministic risk rank.

Use the PRD as the source of truth for:

- Renewal Display And Urgency
- Ranking Model: Biggest Risks
- Homepage model
- Queue-page model
- Current risk review table columns
- Testing Decisions

## Acceptance criteria

- [ ] Risk ranking follows the exact PRD formulas, weights, percentile rules, and tie-breakers.
- [ ] The homepage risk section shows the top five risk accounts with the PRD-defined summary fields.
- [ ] The full `All Risk Accounts` page shows the PRD-defined risk review columns.
- [ ] Each surfaced risk account links to the corresponding account page.
- [ ] Tests confirm deterministic ordering, percentile tie handling, and renewal bucket behavior.

## Blocked by

- Ticket 3

## Notes for implementation

- This is one half of the homepage.
- The homepage is only fully complete when Ticket 5 is also done.

## Ticket 5

**Title**: Growth Queue And Homepage Growth Section

**Type**: AFK

**Suggested labels**: `mvp`, `afk`, `growth`

**Blocked by**:

- Ticket 3

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

**Linear body**

## Parent PRD

`docs/interview-prototype-prd.md`

## What to build

Implement the full `Best Growth Opportunities` path end to end: compute the PRD-defined growth ranking outputs, surface the growth half of the homepage decision surface, and provide the full growth queue page with links into account detail. This ticket owns the growth section of the homepage, not the complete homepage by itself.

Use the PRD as the source of truth for:

- Ranking Model: Best Growth Opportunities
- Homepage model
- Queue-page model
- Current growth review table columns
- Testing Decisions

## Acceptance criteria

- [ ] Growth ranking follows the exact PRD formulas, weights, percentile rules, and tie-breakers.
- [ ] The homepage growth section shows the top five growth accounts with the PRD-defined summary fields.
- [ ] The full `All Growth Accounts` page shows the PRD-defined growth review columns.
- [ ] Each surfaced growth account links to the corresponding account page.
- [ ] Tests confirm deterministic ordering, percentile tie handling, and the PRD's clamping and scoring behavior for growth ranking.

## Blocked by

- Ticket 3

## Notes for implementation

- This is one half of the homepage.
- The homepage is only fully complete when Ticket 4 is also done.

## Ticket 6

**Title**: Recommended Action And Decision History

**Type**: AFK

**Suggested labels**: `mvp`, `afk`, `account-page`, `decisions`

**Blocked by**:

- Ticket 3

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

**Linear body**

## Parent PRD

`docs/interview-prototype-prd.md`

## What to build

Add the action-taking workflow to the account page. Preselect the recommended action when the PRD says one exists, allow override from the fixed action library, persist the final choice and context in Supabase as append-only history, and show a lightweight decision history on the account page. Include the PRD's lightweight `30` day monitoring concept only as framing, not as an active workflow.

Use the PRD as the source of truth for:

- User Stories 26, 27, 28, 29, 30, 31, 32, 33, 37
- Implementation Decisions for recommendation and persistence
- Testing Decisions

## Acceptance criteria

- [ ] Default action selection follows the PRD's fixed state-to-action mapping rules.
- [ ] No action is preselected when all relevant state scores are `0` or the highest relevant score is tied.
- [ ] The selector is populated only from the fixed MVP action library.
- [ ] Saving records only the PRD-defined decision fields in append-only history.
- [ ] Recommendation outcome is stored as `accepted`, `overridden`, or `none` using the PRD rules.
- [ ] Decision history is visible on the account page in a lightweight format.
- [ ] Tests cover default selection logic, zero and tie handling, override behavior, and persisted decision outcomes.

## Blocked by

- Ticket 3

## Notes for implementation

- Keep the history lightweight.
- Do not expand this into a workflow engine or active review loop.

## Ticket 7

**Title**: Manual Product Review And Ranking Sanity Pass

**Type**: HITL

**Suggested labels**: `mvp`, `hitl`, `review`

**Blocked by**:

- Ticket 4
- Ticket 5
- Ticket 6

**User stories addressed**:

- User story 40
- User story 41
- User story 42
- User story 43

**Linear body**

## Parent PRD

`docs/interview-prototype-prd.md`

## What to build

Run a deliberate human review of the finished MVP against the PRD's review goals. Confirm that the top-ranked accounts and recommended actions feel defensible on the challenge dataset, that the evidence trail is understandable, and that the product reads as a decision surface rather than a dashboard.

Use the PRD as the source of truth for:

- MVP Success Criteria
- Testing Decisions
- User Stories 40, 41, 42, 43

## Acceptance criteria

- [ ] A human reviews the top-ranked risk and growth outputs against the PRD formulas and product intent.
- [ ] A human reviews whether evidence, AI summaries, and recommended actions feel grounded rather than opaque.
- [ ] A human reviews whether the implemented UI remains clear, minimal, and decision-focused.
- [ ] Follow-up fixes discovered during review are captured separately rather than silently folded into the approved MVP scope.

## Blocked by

- Ticket 4
- Ticket 5
- Ticket 6

## Notes for implementation

- This is a review gate, not a hidden implementation bucket.
- New work discovered here should be captured separately.
