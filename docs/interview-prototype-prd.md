# Tenzing MVP PRD

Date: 2026-03-21
Status: Draft

## Problem Statement

Tenzing needs an internal product, `Tenzing MVP`, that helps leadership quickly decide which portfolio accounts require attention and why. The challenge is not to create another dashboard, but to turn a single operational CSV into a decision-oriented product that highlights the accounts with the biggest risk and the best growth potential, explains the reasoning in a defensible way, and helps the user record what should happen next.

`Tenzing MVP` must work with imperfect account data, mixed signals, and free-text notes. It also needs to show that AI improves the workflow in a practical, bounded way rather than acting as an opaque ranking engine. Leadership should be able to sign in, review ranked accounts, drill into an account, inspect the evidence, choose or adjust a recommended action, and save that decision.

## Solution

Build `Tenzing MVP` as a web-based authenticated product that uses the provided CSV as the core account data source and produces two decision queues:

- `Biggest Risks`
- `Best Growth Opportunities`

The product will calculate diagnostic state scores from structured CSV fields, combine them into separate ranking models for risk and growth, and use OpenAI in a bounded interpretation layer that reviews a compact account brief plus recent notes. The LLM will help explain what matters most, highlight mixed signals, and sharpen action framing without deciding the ranking itself. Supabase will provide Google sign-in, persistence for saved decisions, and caching of interpretation outputs so that results are reused until the underlying account context changes.

The user experience will center on:

- a homepage showing the top five risk accounts and top five growth accounts
- dedicated queue pages for the full ranked lists
- an account page showing state scores, renewal context, raw notes, AI-generated account interpretation, and full supporting data
- a recommended action workflow that preselects an action based on the account’s highest relevant state, gives a concrete execution brief, and still lets the user override it
- saved decision history so `Tenzing MVP` preserves a lightweight record of chosen actions

`Tenzing MVP` will use a familiar web stack, with the exact framework left open as long as it supports fast delivery, clear server/client data boundaries, and straightforward Supabase and OpenAI integration.

## User Stories

1. As a leadership user, I want to sign in with Google, so that only authorised users can access portfolio account recommendations.
2. As a leadership user, I want the app to load from a single CSV-backed dataset, so that `Tenzing MVP` is grounded in the provided challenge data.
3. As a leadership user, I want to land on a homepage with the most important decisions surfaced first, so that I can review priorities quickly.
4. As a leadership user, I want to see a `Biggest Risks` section, so that I can identify accounts that may need intervention.
5. As a leadership user, I want to see a `Best Growth Opportunities` section, so that I can identify accounts worth proactive commercial attention.
6. As a leadership user, I want each homepage section to show only the top five accounts, so that the page stays focused and digestible.
7. As a leadership user, I want to navigate to full risk and growth queues, so that I can inspect the whole ranked portfolio.
8. As a leadership user, I want risk and growth to be ranked separately, so that downside and upside are not collapsed into one confusing list.
9. As a leadership user, I want account ranking to reflect explicit formulas, so that the prioritisation is explainable and defensible.
10. As a leadership user, I want diagnostic states to be separated from account importance and renewal urgency, so that I can understand what is wrong versus why it matters now.
11. As a leadership user, I want state scores displayed on a `0-100` scale, so that I can compare accounts consistently.
12. As a leadership user, I want the product to show `Service Failure`, `Low Adoption`, `Usage Decline`, `Expansion Opportunity`, and `Low NPS` in the main ranking views, with `Relationship Risk` available on account detail as supporting context, so that I can see the major dimensions driving the recommendation without over-weighting AI-derived relationship tone in ranking.
13. As a leadership user, I want renewal information shown separately, so that I can understand urgency without confusing it with diagnosis.
14. As a leadership user, I want the risk queue to combine severity, account importance, and renewal timing, so that the ranking reflects both account condition and business significance.
15. As a leadership user, I want the growth queue to combine opportunity strength and commercial upside, so that likely expansion targets rise to the top.
16. As a leadership user, I want the homepage cards or rows to show the most relevant summary metrics, so that I can triage accounts without opening every detail page.
17. As a leadership user, I want to drill into any surfaced account, so that I can inspect the reasoning and supporting evidence.
18. As a leadership user, I want the account page title area to show account identity and ARR, so that I can anchor my review quickly.
19. As a leadership user, I want the account overview to show renewal date, days to renewal, state scores, pipeline potential, and expansion confidence, so that I can understand the full context of the recommendation.
20. As a leadership user, I want to see the raw source notes used in interpretation, so that I can verify the AI output against the original evidence.
21. As a leadership user, I want a concise AI-generated overall account summary, so that I can absorb recent account context quickly.
22. As a leadership user, I want AI interpretation to stay bounded to explanation and action framing rather than direct ranking, so that AI contributes useful synthesis without becoming a hidden scoring system.
23. As a leadership user, I want the app to reuse cached note interpretation results when notes have not changed, so that pages load faster and OpenAI usage stays efficient.
24. As a leadership user, I want new note interpretation to run only when an account is first viewed or its underlying notes change, so that the system behaves predictably.
25. As a leadership user, I want the account page to show all raw account data in an expandable section, so that I can inspect the source record when needed without cluttering the page by default.
26. As a leadership user, I want a recommended action preselected for the account, so that the system helps me move from diagnosis to action.
27. As a leadership user, I want the recommended action to map to the most relevant account state, so that the proposed next step feels grounded in the evidence.
28. As a leadership user, I want the action area to include an owner, suggested timing, success metric, and two-week check, so that I can move from recommendation to an actionable plan.
29. As a leadership user, I want to change the preselected action before saving, so that I retain human judgment and control.
30. As a leadership user, I want to add a short note with my decision, so that I can capture context that the system does not know.
31. As a leadership user, I want the product to record whether I accepted or changed the default recommendation, so that future learning can distinguish agreement from override.
32. As a leadership user, I want a simple decision history on the account page, so that I can see what actions have already been chosen.
33. As a leadership user, I want action tracking tied to the state that prompted the action, so that the saved decision remains grounded in the account diagnosis.
34. As a product owner, I want the product to reference a lightweight `30` day monitoring concept, so that `Tenzing MVP` hints at a learning loop without implementing an active review workflow in MVP.
35. As a product owner, I want `Tenzing MVP` to handle nulls and incomplete records explicitly through completeness logic, so that missing data reduces confidence rather than silently breaking rankings.
36. As a product owner, I want the note source fields locked to `recent_customer_note`, `recent_sales_note`, and `recent_support_summary`, so that the MVP remains tightly scoped and testable.
37. As a product owner, I want Google sign-in to be the only authentication method in MVP, so that auth scope stays small.
38. As a product owner, I want Supabase to store authentication state, saved decisions, and cached OpenAI outputs, so that we avoid building custom persistence for `Tenzing MVP`.
39. As a product owner, I want the CSV to remain the source of truth for account records, so that `Tenzing MVP` stays aligned with the interview challenge.
40. As a product owner, I want the app architecture to separate ingestion, scoring, interpretation, ranking, and persistence concerns, so that `Tenzing MVP` can evolve cleanly if taken further.
41. As an evaluator, I want to see that AI improves the quality and speed of understanding full account context, so that `Tenzing MVP` demonstrates a practical use of LLMs.
42. As an evaluator, I want to inspect the ranking logic and evidence trail, so that I can judge whether the prioritisation is defensible rather than arbitrary.
43. As an evaluator, I want the product to feel decision-oriented instead of dashboard-oriented, so that it directly answers the brief.
44. As an evaluator, I want `Tenzing MVP` to make sensible trade-offs around imperfect data and limited scope, so that it feels realistic for the time available.
45. As a product owner, I want account source data to stay server-side, so that raw CSV contents are not exposed directly to browsers or unauthorised users.
46. As a product owner, I want Supabase to avoid becoming the primary store for raw account records in MVP, so that the CSV remains the canonical source and the persistence layer stays scoped.
47. As a product owner, I want secrets and service credentials kept out of client code, so that access to Supabase and OpenAI remains properly controlled.
48. As a leadership user, I want authenticated access enforced on portfolio pages and account detail routes, so that sensitive account data is not accessible without sign-in.

## MVP Success Criteria

- A leadership user can sign in, reach the homepage, and review the top `5` risk accounts plus top `5` growth accounts without needing access to the raw CSV.
- A leadership user can open an account page and understand why the account is surfaced by seeing the displayed state scores, renewal context, raw notes, AI-generated interpretation, and supporting source data.
- The ranking output is deterministic for a given CSV snapshot and follows the formulas defined in this PRD.
- The recommended action flow is usable end-to-end: a default action is preselected, a concrete execution brief is shown, the user can override the action, the final choice can be saved, and decision history is visible on the account page.
- Cached OpenAI interpretation is reused when the underlying normalized account-context input has not changed, and refreshed when it does change.
- The MVP demonstrates bounded AI usage clearly: OpenAI contributes an overall account interpretation, primary driver, recommended-action framing, mixed-signal callouts, and relationship/growth vibe classifications only, and does not act as a hidden end-to-end ranking engine.
- The MVP is ready for review when the core authenticated flows, deterministic scoring behavior, note-interpretation caching, and decision persistence all work reliably against the provided challenge dataset.

## Scoring Model

### Shared Scoring Conventions

- diagnostic state formulas produce raw values on a `0-1` scale unless otherwise stated
- when a state score is displayed in review tables or used inside final weighted priority formulas, convert it to a `0-100` scale by multiplying by `100`

`completeness(...)` is defined as:

```text
number of populated required fields / total required fields
```

Rules:

- a field is populated when it has a present, non-empty value
- completeness stays on a `0-1` scale
- the relevant state strength is multiplied by its completeness score
- if a field fails ingestion coercion into the required normalized type, preserve the original source value for display/debugging but treat the field as missing for scoring and completeness

When the PRD says `normalized position within the dataset`, use percentile rank across the full current dataset.

Current implementation rules:

- sort accounts by the raw metric ascending
- use `average_rank` as the `1`-based rank position after tie averaging
- convert position to a `0-100` percentile score with:

```text
percentile = 100 x (average_rank - 1) / (n - 1)
```

- if the dataset contains only one account, percentile rank is `100`
- when multiple accounts tie, assign the average tied position to all tied accounts

### Note Interpretation

OpenAI is used to interpret full account context in MVP.

Current implementation rules:

- normalize a compact account brief plus `recent_customer_note`, `recent_sales_note`, and `recent_support_summary` into a single text block before sending to OpenAI
- this normalized account-context string is also used as the cache key for invalidation
- if all three note fields are missing or empty after trimming, do not call OpenAI
- if all three note fields are missing or empty after trimming, store no interpretation cache row and treat the AI interpretation as unavailable for that view
- one OpenAI call per account returns a single structured result containing:
  - an overall account summary for display
  - a relationship vibe of `positive`, `neutral`, or `negative`
  - a growth vibe of `positive`, `neutral`, or `negative`
  - a short primary driver for why the account stands out
  - a short recommended-action summary grounded in the combined evidence
  - optional mixed-signal callouts for ambiguous accounts
- `Expansion Confidence` is derived by the application from the growth vibe; it is not returned directly by OpenAI
- if an OpenAI call fails, times out, or returns invalid structured output, do not block account-page rendering; show the page without AI interpretation for that view and allow a later view to retry
- cache only successful structured interpretation results
- cache and reuse the full result until the underlying normalized account-context string changes

Interpretation cache record:

- `account_id`
- normalized account-context string used as the cache key
- overall account summary
- relationship vibe
- growth vibe
- created timestamp
- updated timestamp

The interpretation cache does not store a full copy of the account record.

Spec boundary:

- the live spec locks the note-source fields and required interpretation outputs
- prompt design, examples, thresholds, and model or provider implementation details remain outside the product spec source of truth

### State Set

- Service Failure
- Low Adoption
- Usage Decline
- Relationship Risk
- Expansion Opportunity
- Low NPS

Renewal is not a diagnostic state in MVP.

- renewal information is displayed separately
- renewal urgency is handled as a ranking factor

### Diagnostic State Severity

Each state score answers:

- how strong is this condition on this account?

Diagnostic state severity does not include:

- ARR
- account importance
- renewal urgency
- state priority multipliers

### State Inputs

#### Service Failure

Derived from:

- `open_tickets_count`
- `urgent_open_tickets_count`
- `sla_breaches_90d`

Notes:

- `avg_csat_90d` removed from MVP
- confidence based on completeness of the required fields

Calculation:

```text
Service Failure Strength =
  0.25 x min(open_tickets_count / 10, 1.0)
+ 0.40 x min(urgent_open_tickets_count / 5, 1.0)
+ 0.35 x min(sla_breaches_90d / 5, 1.0)
```

Hard rule:

```text
if urgent_open_tickets_count >= 4
or sla_breaches_90d >= 4
then Service Failure Strength = at least 0.75
```

```text
Service Failure =
  Service Failure Strength
  x completeness(open_tickets_count, urgent_open_tickets_count, sla_breaches_90d)
```

#### Low Adoption

Derived from:

- `seats_purchased`
- `seats_used`

Calculation:

```text
if seats_purchased is missing, zero, or not a valid positive number:
  Low Adoption Strength = 0
else:
  seat_utilisation = min(max(seats_used / seats_purchased, 0), 1)

Low Adoption Strength = 1 - seat_utilisation
```

Hard rule:

```text
if seat_utilisation <= 0.25
then Low Adoption Strength = at least 0.75
```

```text
Low Adoption =
  Low Adoption Strength
  x completeness(seats_purchased, seats_used)
```

#### Usage Decline

Derived from:

- `usage_score_3m_ago`
- `usage_score_current`

Calculation:

```text
decline = usage_score_3m_ago - usage_score_current
Usage Decline Strength = clamp(decline / 40, 0, 1)
```

Hard rule:

```text
if decline >= 25
then Usage Decline Strength = at least 0.75
```

```text
Usage Decline =
  Usage Decline Strength
  x completeness(usage_score_3m_ago, usage_score_current)
```

#### Relationship Risk

Derived from:

- `recent_customer_note`
- `recent_sales_note`
- `recent_support_summary`

Notes:

- based on OpenAI note interpretation from the note fields above
- `latest_nps` removed from this state

Current note interpretation returns:

- an overall relationship vibe of `positive`, `neutral`, or `negative`

Calculation:

```text
Relationship Risk Strength =
  1.00 if relationship vibe = negative
  0.50 if relationship vibe = neutral
  0.00 if relationship vibe = positive
```

```text
Relationship Risk =
  Relationship Risk Strength
  x completeness(recent_customer_note, recent_sales_note, recent_support_summary)
```

#### Expansion Opportunity

Derived from:

- `expansion_pipeline_gbp`
- `recent_sales_note`
- `recent_customer_note`

Notes:

- based on structured commercial indicators plus OpenAI note interpretation
- the scoring output is clamped to the `0-1` range before completeness is applied
- this state blends opportunity size with credibility of expansion happening

Current note interpretation returns:

- an overall growth vibe of `positive`, `neutral`, or `negative`

#### Expansion Confidence

`Expansion Confidence` is a separate growth-facing note signal.

Purpose:

- make the note-derived growth signal visible separately from raw pipeline size
- avoid letting note interpretation dominate the ranking formula

Current model definition:

- `Expansion Confidence` is defined by the overall growth vibe from OpenAI note interpretation
- `Expansion Confidence` is a displayed sentiment-derived signal, not a true evidence-quality score
- raw pipeline size is not itself the confidence signal
- display `Expansion Confidence` on a `0-100` scale
- also display a user-facing confidence band using these labels:
  - `Confident`
  - `Neutral`
  - `Not Confident`

Calculation:

```text
pipeline_norm = min(expansion_pipeline_gbp / 50000, 1.0)
```

```text
Expansion Confidence =
  100 if growth vibe = positive
  50 if growth vibe = neutral
  0 if growth vibe = negative
```

```text
Expansion Confidence Band =
  Confident if growth vibe = positive
  Neutral if growth vibe = neutral
  Not Confident if growth vibe = negative
```

```text
Expansion Opportunity Strength =
  0.90 x pipeline_norm
+ 0.10 x (Expansion Confidence / 100)
```

```text
Expansion Opportunity =
  Expansion Opportunity Strength
  x completeness(
      expansion_pipeline_gbp,
      recent_customer_note,
      recent_sales_note
    )
```

The current growth ranking uses `Expansion Opportunity` directly after the `0-100` scale conversion below.

- the separate `Expansion Opportunity` state priority multiplier of `0.7` is not applied inside `Final Growth Priority`

#### Low NPS

Derived from:

- `latest_nps`

Notes:

- low NPS is an important warning signal
- this state represents severity of low NPS, not raw positive sentiment

Calculation:

```text
Low NPS = clamp((50 - latest_nps) / 100, 0, 1) x completeness(latest_nps)
```

### Confidence

Confidence remains in MVP where it is useful:

- `Service Failure`: completeness of ticket and breach fields
- `Low Adoption`: completeness of seat fields
- `Usage Decline`: completeness of usage fields
- `Relationship Risk`: completeness of note fields
- `Expansion Opportunity`: completeness of pipeline and note fields
- `Low NPS`: presence of latest NPS

### State Priority Multipliers

These are prioritisation judgments, not part of diagnosis.

- `Service Failure` = `1.0`
- `Relationship Risk` = `1.0`
- `Usage Decline` = `1.0`
- `Low NPS` = `0.8`
- `Low Adoption` = `0.9`
- `Expansion Opportunity` = `0.7`

Notes:

- renewal is excluded from this multiplier set
- renewal is handled separately as account-level urgency

### Account Importance

Account importance is split by decision type.

#### Risk Importance

Used for the `Biggest Risks` queue.

```text
Risk Importance = arr_gbp + 0.20 * expansion_pipeline_gbp
```

Current MVP rule:

- do not cap pipeline uplift by ARR inside `Risk Importance`

Interpretation:

- current value is the main anchor
- pipeline matters modestly

#### Growth Importance

Used for the `Best Growth Opportunities` queue.

```text
Growth Importance = arr_gbp + 0.75 * expansion_pipeline_gbp
```

Current MVP rule:

- do not cap pipeline uplift by ARR inside `Growth Importance`

Interpretation:

- future upside matters much more here
- current ARR still matters, but less than in the risk queue

### Renewal Display And Urgency

Renewal is handled in two ways:

- displayed separately in the UI as renewal date / days to renewal
- applied separately in ranking as renewal urgency

Renewal urgency is a simple stepped score:

```text
0-30 days -> 100
31-60 days -> 75
61-120 days -> 50
121-180 days -> 25
181+ days -> 0
```

Current implementation rules:

- `Days to renewal` is measured in whole calendar days as `renewal_date - today`
- if `renewal_date` is missing or invalid, display `Days to renewal` as blank and use `Renewal Score = 0`
- if `renewal_date` is in the past, treat it as `0` days for renewal urgency scoring, so `Renewal Score = 100`

### Ranking Model

#### Biggest Risks

First compute `Risk Severity`:

```text
Risk Severity =
(
  Service Failure
+ Usage Decline
+ 0.9 x Low Adoption
+ 0.8 x Low NPS
) / 3.7
```

Interpretation:

- `Service Failure` and `Usage Decline` count fully
- `Low Adoption` counts slightly less
- `Low NPS` counts slightly less again
- `Relationship Risk` remains visible in the account review, but does not move the deterministic risk rank

Then compute `ARR+Potential Score`.

First:

```text
Risk Importance Raw = arr_gbp + 0.20 * expansion_pipeline_gbp
```

Then convert that to a `0-100` score relative to the accounts in the dataset:

```text
ARR+Potential Score =
  percentile rank of Risk Importance Raw within the dataset,
  with ties averaged
```

Then compute `Renewal Score` using the stepped urgency buckets above.

```text
Final Risk Priority =
  60% x (Risk Severity x 100)
+ 25% x ARR+Potential Score
+ 15% x Renewal Score
```

Tie-breaking:

- sort by `Final Risk Priority` descending
- if tied, sort by `Risk Severity` descending
- if still tied, sort by `ARR+Potential Score` descending
- if still tied, sort by `account_id` ascending

#### Best Growth Opportunities

```text
Final Growth Priority =
  65% x (Expansion Opportunity x 100)
+ 35% x Growth Score
```

Where:

- `Growth Score` = the account's percentile rank within the dataset using `Growth Importance`, with ties averaged
- `Expansion Opportunity` is clamped to the `0-1` range before the `x 100` conversion above
- the `0.7` state priority multiplier for `Expansion Opportunity` is not applied in this formula

Tie-breaking:

- sort by `Final Growth Priority` descending
- if tied, sort by `Expansion Opportunity` descending
- if still tied, sort by `Growth Score` descending
- if still tied, sort by `account_id` ascending

## Implementation Decisions

- Build a web application in a familiar full-stack web framework that supports authenticated routes, server-side data loading, and straightforward API integration.
- Use the provided CSV as the canonical source for account records and derived scoring inputs.
- Implement a CSV ingestion layer that reads the dataset, normalises types, and exposes a stable account model to the rest of the application.
- Use `account_id` from the source CSV as the canonical account identifier for routes, interpretation-cache records, and saved decision records; `account_name` is display-only.
- Limit MVP data cleaning to lightweight ingestion safeguards only:
  - trim obvious whitespace issues in string fields
  - normalize empty strings and missing values to nulls
  - coerce numeric fields into usable number types where possible
  - parse date fields into a consistent date representation
  - preserve the original source value when coercion fails and treat the field as missing for scoring purposes
- Do not add manual record correction, external enrichment, fuzzy entity repair, or speculative backfilling in MVP.
- Keep the raw CSV server-side and do not expose the source file itself to the browser.
- Do not load the raw account dataset into Supabase as the primary account store for MVP.
- Use Supabase only for authentication, saved decisions, and cached OpenAI interpretation outputs, not as the canonical source for account records.
- Keep derived scoring logic in a dedicated ranking engine rather than scattering formulas across UI components.
- Implement separate diagnostic state calculators for `Service Failure`, `Low Adoption`, `Usage Decline`, `Relationship Risk`, `Expansion Opportunity`, and `Low NPS`.
- Apply completeness weighting exactly where defined in the product spec so missing data affects confidence and severity consistently.
- Keep diagnostic state severity distinct from ranking multipliers, account importance, and renewal urgency.
- Implement two ranking pipelines: one for `Biggest Risks` and one for `Best Growth Opportunities`.
- Use percentile ranking across the current dataset for normalized importance scores, with tied positions averaged.
- Treat renewal as a ranking factor and display field, not as a diagnostic state.
- Use this homepage model:
  - homepage has two sections:
    - `Biggest Risks`
    - `Best Growth Opportunities`
  - rank accounts separately for each section
  - show the top `5` ranked accounts in each section
  - visually emphasize larger / more important state scores
  - show renewal information separately as contextual account information
  - keep underlying evidence one click deeper
  - provide navigation to:
    - `All Risk Accounts`
    - `All Growth Accounts`
- In `Homepage Risk Account Content`, each surfaced `Biggest Risks` account shows:
  - rank number
  - account name
  - `ARR`
  - `Service Failure`
  - `Relationship Risk`
  - `Usage Decline`
  - `Low Adoption`
  - `Low NPS`
  - days to renewal
  - a button linking to that account's page
- In `Homepage Growth Account Content`, each surfaced `Best Growth Opportunities` account shows:
  - rank number
  - account name
  - current `ARR`
  - pipeline potential
  - an `Expansion Confidence` score on a `0-100` scale, derived from the note-based growth signal
  - an `Expansion Confidence` band of `Confident`, `Neutral`, or `Not Confident`
  - a button linking to that account's page
- Use this queue-page model:
  - `All Risk Accounts` shows the full ranked `Biggest Risks` queue
  - `All Growth Accounts` shows the full ranked `Best Growth Opportunities` queue
  - both pages are accessible from the homepage
  - `All Growth Accounts` includes `Expansion Confidence` as a formal column
- Use these current risk review table columns:
  - `Rank`: Accounts sorted by `Final Risk Priority`, highest first.
  - `Account`: `account_name`
  - `ARR £`: `arr_gbp`
  - `Renewal Date`: `renewal_date`
  - `Days`: `renewal_date - today`
  - `Renewal Score`: The stepped urgency bucket from the renewal rules above.
  - `ARR+Potential Score`: The account's percentile-ranked `Risk Importance Raw` position within the dataset, scaled to `0-100` with ties averaged.
  - `Risk Severity`: The weighted average of the negative state scores:
```text
(
  Service Failure
+ Usage Decline
+ 0.9 x Low Adoption
+ 0.8 x Low NPS
) / 3.7
```
  - `Risk Priority`: The final weighted risk ranking score:
```text
60% x (Risk Severity x 100)
+ 25% x ARR+Potential Score
+ 15% x Renewal Score
```
  - `Service Failure`: The calculated `Service Failure` state score above, displayed on a `0-100` scale.
  - `Usage Decline`: The calculated `Usage Decline` state score above, displayed on a `0-100` scale.
  - `Low Adoption`: The calculated `Low Adoption` state score above, displayed on a `0-100` scale.
  - `Low NPS`: The calculated `Low NPS` state score above, displayed on a `0-100` scale.
  - `Relationship Risk`: Not shown as a risk-queue column. It remains available on account detail as explanatory context only and does not affect deterministic risk ordering.
- Use these current growth review table columns:
  - `Rank`: Accounts sorted by `Final Growth Priority`, highest first.
  - `Account`: `account_name`
  - `ARR £`: `arr_gbp`
  - `Renewal Date`: `renewal_date`
  - `Days`: `renewal_date - today`
  - `Growth Score`: The account's percentile-ranked `Growth Importance` position within the dataset, scaled to `0-100` with ties averaged.
  - `Expansion Opportunity`: The calculated `Expansion Opportunity` state score above, displayed on a `0-100` scale on an inverted opportunity color scale.
  - `Expansion Confidence`: The note-derived expansion credibility score, displayed on a `0-100` scale.
  - `Expansion Confidence Band`: The user-facing confidence label of `Confident`, `Neutral`, or `Not Confident`.
  - `Growth Priority`: The final weighted growth ranking score:
```text
65% x (Expansion Opportunity x 100)
+ 35% x Growth Score
```
  - `Service Failure`: The calculated `Service Failure` state score above, displayed on a `0-100` scale.
  - `Relationship Risk`: The calculated `Relationship Risk` state score above, displayed on a `0-100` scale.
  - `Usage Decline`: The calculated `Usage Decline` state score above, displayed on a `0-100` scale.
  - `Low Adoption`: The calculated `Low Adoption` state score above, displayed on a `0-100` scale.
  - `Low NPS`: The calculated `Low NPS` state score above, displayed on a `0-100` scale.
- Restrict OpenAI interpretation in MVP to the three note fields from the spec and to structured outputs for summary plus vibe classification.
- Make one OpenAI call per account returning a structured result with an overall account summary, a relationship vibe, and a growth vibe; derive Expansion Confidence from the growth vibe.
- Cache note interpretation results in Supabase and invalidate them when the concatenated note source fields change.
- Use Supabase for Google-only authentication and a single authenticated user type in MVP.
- Enforce authenticated access on all portfolio, queue, and account-detail routes.
- Keep privileged credentials and server-only tokens out of client bundles and browser-accessible storage.
- Call OpenAI only from trusted server-side application code.
- Give each account a dedicated account page linked from homepage and queue pages.
- Use this account-page content model:
  - `Title Area`
  - `Overview Area`
  - `Notes And Evidence`
  - `Full Account Data`
  - `Recommended Action Area`
- In the `Title Area`, show:
  - account name
  - risk rank
  - growth rank
- In the `Overview Area`, show:
  - `ARR`
  - renewal date
  - days to renewal
  - all current state scores
  - pipeline potential
  - `Expansion Confidence` score
  - `Expansion Confidence` band
- In `Notes And Evidence`, show:
  - the OpenAI-generated overall account summary
  - the raw source notes used for account interpretation
- Apply this interpretation generation rule:
  - run the OpenAI call on first account-page view if no stored result exists
  - store the interpretation cache record defined in `Note Interpretation`
  - reuse the stored result until the underlying source notes change
  - the result includes the overall account summary, relationship vibe, and growth vibe; `Expansion Confidence` is derived from the growth vibe by the application and is not returned directly by OpenAI
  - cache and reuse that full interpretation result until the underlying source notes change
- In `Full Account Data`:
  - at the bottom of the page, show all available data for that account
  - hide this area behind a vertical accordion so the user can expand it only when needed
- Apply least-privilege database access for Supabase tables that store decisions and cached interpretations.
- Store only the minimum account-derived data needed in Supabase caches and decision records.
- Store saved account decisions in Supabase as append-only history records.
- Each decision record includes:
  - `account_id`
  - selected action
  - nullable default recommended action
  - nullable default recommended state
  - `recommendation_outcome`
  - optional user note
  - created timestamp
- Use this fixed MVP action library for recommendation and save flows:
  - `Escalate Support And Stabilise Service`
  - `Launch Adoption Recovery Plan`
  - `Run Usage Recovery Outreach`
  - `Hold Relationship Reset`
  - `Review Low NPS And Close Issues`
  - `Progress Expansion Opportunity`
- Map the default recommended action from the strongest surfaced account state using these rules:
  - `Service Failure` -> `Escalate Support And Stabilise Service`
  - `Low Adoption` -> `Launch Adoption Recovery Plan`
  - `Usage Decline` -> `Run Usage Recovery Outreach`
  - `Relationship Risk` -> `Hold Relationship Reset`
  - `Low NPS` -> `Review Low NPS And Close Issues`
  - `Expansion Opportunity` -> `Progress Expansion Opportunity`
- Use these locked MVP action definitions:
  - `Escalate Support And Stabilise Service`: Escalate the account's open service issues, reduce urgent tickets, and bring recent SLA performance back under control.
  - `Launch Adoption Recovery Plan`: Identify where usage is not spreading across purchased seats and run a focused plan to improve adoption.
  - `Run Usage Recovery Outreach`: Re-engage the account with a usage-focused follow-up to recover declining product activity.
  - `Hold Relationship Reset`: Run a direct relationship reset with the customer to address concerns, rebuild trust, and clarify the path forward.
  - `Review Low NPS And Close Issues`: Review the reasons behind low NPS, prioritise the key issues, and confirm which fixes or follow-ups should happen next.
  - `Progress Expansion Opportunity`: Carry out product and roadmap demos with senior leadership.
- Render the account-page `Recommended Action` control as a selector populated from the fixed MVP action library.
- Use the selected action's fixed library description as the lead sentence in the `Recommended Action` card so that the title, description, and execution brief stay aligned.
- Show a compact execution brief alongside the recommended action containing:
  - owner
  - suggested timing
  - success metric
  - what to check in 2 weeks
- Derive that execution brief deterministically from the selected or default action plus the current account context.
- Do not use the AI interpretation summary as the visible lead sentence of the action card.
- Use all six current state scores on the displayed `0-100` scale when determining the recommended action default.
- A state is relevant only if its score is strictly greater than `0`.
- When one state is uniquely highest above `0`, open the account page with that mapped action already selected as the default recommendation.
- When multiple states are tied for the highest relevant score, show no preselected action and display `No recommended action - please select` in the selector.
- When all state scores are `0`, show no preselected action and display `No recommended action - please select` in the selector.
- Allow the user to replace the default recommendation by selecting any other action from the fixed MVP action library before save.
- If there is no preselected action, require the user to actively choose one of the fixed MVP actions before save.
- On save, persist the final selected action as the decision, along with:
  - `recommendation_outcome = accepted` when a default existed and the user saved that same action
  - `recommendation_outcome = overridden` when a default existed and the user saved a different action
  - `recommendation_outcome = none` when no default existed because all state scores were `0` or the highest score was tied
- Support a lightweight account-page decision history rather than a full workflow or collaboration model.
- Save the user's chosen action and optional note, but do not implement an active `30` day review workflow in MVP.
- The product may reference that the outcome of the chosen action will be monitored over the next `30` days as concept framing only.
- Design the homepage as a decision surface, not a reporting dashboard, with top-five lists and clear navigation into full queues.
- Put evidence one click deeper on account pages so the homepage remains focused and scannable.
- Show raw notes and an expandable full-data section on the account page to preserve transparency.
- Structure the system around a small set of deep modules:
  - data ingestion and account normalization
  - diagnostic scoring
  - queue ranking
  - note interpretation and cache management
  - decision recommendation and persistence
  - authenticated application UI
- Keep the initial system single-tenant and single-role for speed; do not add role-based access control in MVP.
- Treat this PRD as the self-contained source of truth for implementation planning and issue generation.
- The product-definition spec and product-definition backlog were used to author and refine this PRD, but implementation work should now be derived from the PRD directly.
- Review visual implementation against `/Users/jonsearle/Desktop/Tenzing 1.0/docs/ui-review-checklist.md` to keep screens clear, minimal, and decision-focused during implementation.
- Treat the UI review checklist as implementation guidance for presentation quality, not as a replacement for product requirements defined in this PRD.

## Testing Decisions

- Good tests should verify external behavior and business outcomes rather than internal implementation details.
- The highest-value tests are deterministic checks around data parsing, state scoring, ranking order, cache invalidation rules, auth gating, and decision persistence.
- The CSV ingestion module should be tested to confirm correct type normalization, null handling, and field mapping from the provided dataset.
- The CSV ingestion module should also be tested to confirm lightweight cleaning behavior, including whitespace trimming, empty-to-null normalization, numeric coercion, date parsing, and safe fallback when values cannot be parsed.
- The diagnostic scoring module should be tested with fixture accounts that cover nominal cases, hard-rule thresholds, and missing-data completeness reductions.
- The ranking module should be tested to confirm percentile normalization, tie handling, separate risk and growth ordering, and renewal urgency application.
- The note interpretation module should be tested around request shaping, caching behavior, stale-cache invalidation when notes change, and structured output handling; OpenAI responses should be mocked in automated tests.
- The recommendation and decision module should be tested to confirm the correct default action is chosen from state inputs and that overrides are persisted correctly.
- The authenticated route layer should be tested to confirm unauthenticated users are blocked and authenticated users can access the intended screens.
- Security-focused tests should confirm that raw CSV contents are never directly served to the client, server-only credentials are not exposed in client code, and Supabase persistence is limited to the intended data classes.
- The account-page flow should be covered by integration tests that exercise loading account data, reusing cached interpretation, saving a decision, and showing decision history.
- Because there is no existing codebase, there is no testing prior art to follow yet; the test suite should establish a clean baseline around pure business logic first, then add a small number of integration tests for the key user flows.
- Manual review should also be part of validation for `Tenzing MVP`, especially for whether the top-ranked accounts and recommended actions feel product-correct against the PRD and UI review guidance.

## Security Considerations

- The raw CSV should be treated as sensitive internal source data and kept server-side.
- Browser clients should receive only the account data needed for the current authenticated view, not the source file itself.
- Supabase should not be used as the primary store for raw account records in MVP; this reduces unnecessary duplication of source data and keeps the data flow easier to reason about.
- Supabase should store only:
  - authentication data
  - saved decisions
  - cached OpenAI interpretation outputs
- OpenAI API calls should execute only on the server, using server-held secrets.
- Secrets for Supabase and OpenAI should be managed through environment variables and never committed to source control or embedded in client-side code.
- Access to portfolio pages should require authenticated Google sign-in.
- MVP security should follow least-privilege design where practical, especially for Supabase table access and any service-role usage.
- Cached interpretation outputs and saved decisions should include only the minimum data needed to support product behavior.
- Security work for MVP should prioritize safe defaults and clear boundaries over enterprise-grade compliance features.

## Out of Scope

- Production-grade multi-tenant architecture
- Role-based permissions or multiple user roles
- Authentication methods beyond Google sign-in
- Replacing the CSV as the core data source in MVP
- Building a generic analytics dashboard or BI layer
- Extensive data cleaning pipelines beyond what is needed for prototype reliability
- Manual correction of source records, inferred value backfilling, or enrichment from external systems
- A richer AI signal taxonomy beyond summary and vibe classification
- Fine-tuning models or building custom ML ranking models
- Advanced action-learning logic beyond saving decisions and enabling a simple `30` day review concept
- Collaboration workflows such as assignment, commenting, approvals, or notifications
- Real-time sync, background orchestration complexity, or high-scale performance work
- Pixel-perfect design polish beyond a clear, leadership-friendly interface
- Full production observability, governance, and security hardening
- GitHub issue submission automation, since there is currently no repository for this project

## Further Notes

- This PRD is written as a local artifact because the project does not yet have a repository or issue tracker.
- This PRD is the narrative product overview and implementation handoff for MVP scope.
- The likely implementation stack assumed by this PRD is:
  - web application in a familiar full-stack web stack
  - CSV as the core account data source
  - Supabase for auth, saved decisions, and cached OpenAI outputs
  - Google sign-in only
  - OpenAI API for note interpretation
- The CSV should remain a server-side source artifact rather than being copied into Supabase as the primary account database in MVP.
- MVP data cleaning means lightweight normalization at ingestion time, not a separate cleansing program.
- This PRD is the self-contained implementation contract for MVP and is intended to be the direct input to PRD-to-issues work.
- The product-definition spec and product-definition backlog were the design-time source materials used to produce this PRD.
- The backlog items should be treated as post-MVP follow-up rather than commitments for `Tenzing MVP`.
