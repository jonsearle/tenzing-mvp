# Tenzing Product Definition Spec

Date: 2026-03-21

## Product Definition

- Tenzing is a leadership-facing portfolio decision system.
- It is implemented through ranked account-state recommendations.
- It is not a dashboard.
- It is not an AI black box.

## MVP Platform Requirements

- the product requires authentication
- MVP uses Google sign-in only
- MVP has one authenticated user type with no role-based access differences
- the provided CSV remains the core data source
- OpenAI API integration is required in MVP for bounded account interpretation
- Supabase is used in MVP for authentication, saved decisions, and cached OpenAI interpretation results

## Core Product Principle

- State scores should be diagnostic first.
- Account ranking should be driven separately by:
  - diagnostic state severity
  - account importance
  - renewal urgency

## Shared Scoring Conventions

### State Score Scale

- diagnostic state formulas produce raw values on a `0-1` scale unless otherwise stated
- when a state score is displayed in review tables or used inside final weighted priority formulas, convert it to a `0-100` scale by multiplying by `100`

### Display Naming And Bands

- the scoring model, ranking formulas, recommendation mapping, and stored decision logic remain unchanged for this rollout
- the current canonical internal state set remains:
  - `Service Failure`
  - `Low Adoption`
  - `Usage Decline`
  - `Relationship Risk`
  - `Expansion Opportunity`
  - `Low NPS`
- the user-facing UI should display these labels instead:
  - `Service Failure` -> `Service Health`
  - `Low Adoption` -> `Adoption`
  - `Usage Decline` -> `Usage Momentum`
  - `Relationship Risk` -> `Relationship Strength` on account-detail views only
  - `Expansion Opportunity` -> `Growth Opportunity`
  - `Low NPS` -> `Customer Sentiment`
- user-facing display bands use a shared `0-100` threshold system:
  - `0-19`
  - `20-39`
  - `40-59`
  - `60-79`
  - `80-100`
- all user-facing state scores must be normalized so `0 = bad` and `100 = good`
- user-facing display score mapping is:
  - `Service Health` = `100 - Service Failure`
  - `Adoption` = `100 - Low Adoption`
  - `Usage Momentum` = `100 - Usage Decline`
  - `Relationship Strength` = `100 - Relationship Risk`
  - `Growth Opportunity` = `Expansion Opportunity`
  - `Customer Sentiment` = `100 - Low NPS`
- visual tone must match the normalized user-facing score meaning
- recommendation logic must continue to map from the canonical internal state keys, even when the UI shows the new user-facing labels

Current locked user-facing display bands:

- `Service Health`
  - `0-19` -> `Very Bad`
  - `20-39` -> `Bad`
  - `40-59` -> `OK`
  - `60-79` -> `Good`
  - `80-100` -> `Very Good`
- `Adoption`
  - `0-19` -> `Very Low`
  - `20-39` -> `Limited`
  - `40-59` -> `Partial`
  - `60-79` -> `Healthy`
  - `80-100` -> `Fully Embedded`
- `Usage Momentum`
  - `0-19` -> `Sharp Decline`
  - `20-39` -> `Soft Decline`
  - `40-59` -> `Flat`
  - `60-79` -> `Growing`
  - `80-100` -> `Strong Growth`
- `Relationship Strength`
  - `0-19` -> `At Risk`
  - `20-39` -> `Fragile`
  - `40-59` -> `Mixed`
  - `60-79` -> `Stable`
  - `80-100` -> `Strong`
- `Growth Opportunity`
  - `0-19` -> `None`
  - `20-39` -> `Limited`
  - `40-59` -> `Moderate`
  - `60-79` -> `Strong`
  - `80-100` -> `Very High`
- `Customer Sentiment`
  - `0-19` -> `Negative`
  - `20-39` -> `Weak`
  - `40-59` -> `Neutral`
  - `60-79` -> `Positive`
  - `80-100` -> `Strong`

### Completeness

`completeness(...)` is defined as:

```text
number of populated required fields / total required fields
```

Rules:

- a field is populated when it has a present, non-empty value
- completeness stays on a `0-1` scale
- the relevant state strength is multiplied by its completeness score

### Note Interpretation

OpenAI is used to interpret full account context for MVP in a bounded way.

Current implementation rules:

- use only these three note fields as note-text source inputs:
  - `recent_customer_note`
  - `recent_sales_note`
  - `recent_support_summary`
- include a compact structured account brief alongside those note fields when calling OpenAI
- the compact account brief may include only already-available normalized account fields and derived missing-data flags; it must not introduce hidden external data sources
- lowercase and normalize the account brief plus locked note fields into one text block used for cache invalidation
- send that combined account-context text to an OpenAI step that returns:
  - an overall account summary for human display
  - a relationship vibe classification of `positive`, `neutral`, or `negative`
  - a growth vibe classification of `positive`, `neutral`, or `negative`
  - a short primary-driver explanation
  - a short recommended-action summary
  - optional mixed-signal callouts for ambiguous accounts

This remains structured interpretation for explanation and action framing. It is not an end-to-end AI ranking engine.

Spec boundary:

- the live spec locks the note-source fields and required interpretation outputs
- deterministic scoring and ranking formulas remain outside the LLM
- prompt design, examples, thresholds, and model/provider implementation details remain outside the product-spec source of truth

### Dataset-Normalized Position

When the spec says `normalized position within the dataset`, use percentile rank across the full current dataset.

Current implementation rules:

- sort accounts by the raw metric ascending
- convert position to a `0-100` percentile score
- when multiple accounts tie, assign the average tied position to all tied accounts

### Surfacing Scope

- the homepage surfaces the top `5` accounts in `Biggest Risks`
- the homepage surfaces the top `5` accounts in `Best Growth Opportunities`
- the homepage links to dedicated full-list pages for both queues:
  - `All Risk Accounts`
  - `All Growth Accounts`
- queue pages may display a short AI rationale under the account name to help users triage without drilling in

## State Set

- Service Failure
- Low Adoption
- Usage Decline
- Relationship Risk
- Expansion Opportunity
- Low NPS

Renewal is not a diagnostic state in MVP.

- renewal information is displayed separately
- renewal urgency is handled as a ranking factor

## Diagnostic State Severity

Each state score answers:

- how strong is this condition on this account?

Diagnostic state severity does not include:

- ARR
- account importance
- renewal urgency
- state priority multipliers

## State Inputs

### Service Failure

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

### Low Adoption

Derived from:

- `seats_purchased`
- `seats_used`

Calculation:

```text
seat_utilisation = seats_used / seats_purchased
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

### Usage Decline

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

### Relationship Risk

Derived from:

- `recent_customer_note`
- `recent_sales_note`
- `recent_support_summary`

Notes:

- based on OpenAI note interpretation from the note fields above
- `latest_nps` removed from this state

Current note interpretation returns:

- a short relationship summary
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

### Expansion Opportunity

Derived from:

- `expansion_pipeline_gbp`
- `recent_sales_note`
- `recent_customer_note`

Notes:

- based on structured commercial indicators plus OpenAI note interpretation
- the scoring output is clamped to the `0-1` range before completeness is applied
- this state blends opportunity size with credibility of expansion happening

Current note interpretation returns:

- a short account summary
- an overall growth vibe of `positive`, `neutral`, or `negative`

### Expansion Confidence

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

Spec boundary:

- the live product definition locks that OpenAI-derived growth vibe is the basis of `Expansion Confidence`
- the homepage and growth queue display `Expansion Confidence` as a `0-100` score plus confidence band

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

### Low NPS

Derived from:

- `latest_nps`

Notes:

- low NPS is an important warning signal
- this state represents severity of low NPS, not raw positive sentiment

Calculation:

```text
Low NPS = clamp((50 - latest_nps) / 100, 0, 1)
```

## Confidence

Confidence remains in MVP where it is useful:

- `Service Failure`: completeness of ticket and breach fields
- `Low Adoption`: completeness of seat fields
- `Usage Decline`: completeness of usage fields
- `Relationship Risk`: completeness of note fields
- `Expansion Opportunity`: completeness of pipeline and note fields
- `Low NPS`: presence of latest NPS

## State Priority Multipliers

These are prioritisation judgments, not part of diagnosis.

- `Service Failure` = `1.0`
- `Relationship Risk` = `1.0`
- `Usage Decline` = `1.0`
- `Low NPS` = `0.9`
- `Low Adoption` = `0.9`
- `Expansion Opportunity` = `0.7`

Notes:

- renewal is excluded from this multiplier set
- renewal is handled separately as account-level urgency

## Account Importance

Account importance is split by decision type.

### Risk Importance

Used for the `Biggest Risks` queue.

```text
Risk Importance = ARR + 20% of expansion_pipeline_gbp
```

Constraint:

- expansion uplift is capped so it cannot exceed ARR

Interpretation:

- current value is the main anchor
- pipeline matters modestly

### Growth Importance

Used for the `Best Growth Opportunities` queue.

```text
Growth Importance = ARR + 75% of expansion_pipeline_gbp
```

Constraint:

- growth uplift is capped so it cannot exceed ARR

Interpretation:

- future upside matters much more here
- current ARR still matters, but less than in the risk queue

## Renewal Display And Urgency

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

## Ranking Model

### Biggest Risks

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
Risk Importance Raw = ARR + 20% of expansion_pipeline_gbp
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

In plain English:

- how bad it looks matters most
- how valuable it is matters next
- how soon it renews matters too, but less

### Best Growth Opportunities

```text
Final Growth Priority =
  65% x (Expansion Opportunity x 100)
+ 35% x Growth Score
```

Where:

- `Growth Score` = the account's percentile rank within the dataset using `Growth Importance`, with ties averaged
- `Expansion Opportunity` is clamped to the `0-1` range before the `x 100` conversion above
- the `0.7` state priority multiplier for `Expansion Opportunity` is not applied in this formula

## Homepage Model

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

### Homepage Risk Account Content

Each surfaced `Biggest Risks` account shows:

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

### Homepage Growth Account Content

Each surfaced `Best Growth Opportunities` account shows:

- rank number
- account name
- current `ARR`
- pipeline potential
- an `Expansion Confidence` score on a `0-100` scale, derived from the note-based growth signal
- an `Expansion Confidence` band of `Confident`, `Neutral`, or `Not Confident`
- a button linking to that account's page

## Queue Pages

- `All Risk Accounts` shows the full ranked `Biggest Risks` queue
- `All Growth Accounts` shows the full ranked `Best Growth Opportunities` queue
- both pages are accessible from the homepage
- `All Growth Accounts` includes `Expansion Confidence` as a formal column

## Account Page

Each account has a dedicated account page linked from homepage and queue pages.

### Title Area

- account name
- `ARR`

### Overview Area

- renewal date
- days to renewal
- all current state scores
- pipeline potential
- `Expansion Confidence` score
- `Expansion Confidence` band

### Notes And Evidence

- show the OpenAI-generated note summary
- show the raw source notes used for account interpretation

Summary generation rule:

- generate the note summary on first account-page view if no stored summary exists
- store the generated summary with the account snapshot
- reuse the stored summary until the underlying source notes change
- the same generated result also includes the vibe classifications and `Expansion Confidence`
- cache and reuse that full interpretation result until the underlying source notes change

### Full Account Data

- at the bottom of the page, show all available data for that account
- hide this area behind a vertical accordion so the user can expand it only when needed

### Recommended Action Area

- include a `Recommended Action` area on the account page
- this area allows a user to choose an action for the account
- pre-select one recommended action based on the account's highest relevant state
- show the selected action's fixed library description as the lead sentence in this area
- show a compact execution brief for the recommended action containing:
  - owner
  - suggested timing
  - success metric
  - what to check in 2 weeks
- allow the user to change that pre-selected action before confirming it
- if multiple states are tied for the highest relevant score, show no pre-selected action and display `No recommended action - please select` in the action selector
- save the final chosen action as a decision record
- also save whether the user accepted the pre-selected recommendation or changed it
- allow an optional short user note explaining the decision
- show a simple saved-decision history on the account page

MVP action model:

- each action maps to exactly one primary state
- the goal is to demonstrate a credible path toward learning whether actions improve the state they were chosen to address
- the visible action title, lead sentence, and execution brief should all come from the same deterministic selected action
- the execution brief remains deterministic and is derived from the current account context plus the selected action
- MVP saves the user's chosen action and does not implement an active outcome-review workflow

Current MVP action list:

- `Escalate Support And Stabilise Service` -> primary state: `Service Failure`
- `Launch Adoption Recovery Plan` -> primary state: `Low Adoption`
- `Run Usage Recovery Outreach` -> primary state: `Usage Decline`
- `Hold Relationship Reset` -> primary state: `Relationship Risk`
- `Review Low NPS And Close Issues` -> primary state: `Low NPS`
- `Progress Expansion Opportunity` -> primary state: `Expansion Opportunity`

Current MVP action definitions:

- `Escalate Support And Stabilise Service`
  Short description: Escalate the account's open service issues, reduce urgent tickets, and bring recent SLA performance back under control.
  How we will track the impact of this action: We will look for improvement in service issue volume and severity using `open_tickets_count`, `urgent_open_tickets_count`, and `sla_breaches_90d`.

- `Launch Adoption Recovery Plan`
  Short description: Identify where usage is not spreading across purchased seats and run a focused plan to improve adoption.
  How we will track the impact of this action: We will look for more purchased seats being actively used by tracking seat utilisation from `seats_used / seats_purchased`.

- `Run Usage Recovery Outreach`
  Short description: Re-engage the account with a usage-focused follow-up to recover declining product activity.
  How we will track the impact of this action: We will look for recovery in product activity by comparing `usage_score_current` against `usage_score_3m_ago`.

- `Hold Relationship Reset`
  Short description: Run a direct relationship reset with the customer to address concerns, rebuild trust, and clarify the path forward.
  How we will track the impact of this action: We will review whether the overall relationship picture improves based on OpenAI interpretation of `recent_customer_note`, `recent_sales_note`, and `recent_support_summary`.

- `Review Low NPS And Close Issues`
  Short description: Review the reasons behind low NPS, prioritise the key issues, and confirm which fixes or follow-ups should happen next.
  How we will track the impact of this action: We will look for improvement in customer sentiment through changes in `latest_nps`.

- `Progress Expansion Opportunity`
  Short description: Carry out product and roadmap demos with senior leadership.
  How we will track the impact of this action: We will look for growth in revenue for that account using `arr_gbp`.

MVP outcome-monitoring note:

- the product may communicate that the outcome of the chosen action will be monitored over the next `30` days as a concept demonstration
- MVP does not automate a `30` day review workflow, success evaluation, or follow-up tasking from that monitoring concept

Current MVP boundary:

- the page must support action selection
- the product must save the user's chosen action, whether the default recommendation was accepted or changed, and any optional user note
- the product may reference `30` day outcome monitoring as concept framing only
- more advanced action-learning logic and active outcome review are not part of MVP

## Review Table Columns

The current risk review table columns are derived as follows:

- `Rank`
  Accounts sorted by `Final Risk Priority`, highest first.

- `Account`
  `account_name`

- `ARR £`
  `arr_gbp`

- `Renewal Date`
  `renewal_date`

- `Days`
  `renewal_date - today`

- `Renewal Score`
  The stepped urgency bucket from the renewal rules above.

- `ARR+Potential Score`
  The account's percentile-ranked `Risk Importance Raw` position within the dataset, scaled to `0-100` with ties averaged.

- `Risk Severity`
  The weighted average of the negative state scores:

```text
(
  Service Failure
+ Usage Decline
+ 0.9 x Low Adoption
+ 0.8 x Low NPS
) / 3.7
```

- `Risk Priority`
  The final weighted risk ranking score:

```text
60% x (Risk Severity x 100)
+ 25% x ARR+Potential Score
+ 15% x Renewal Score
```

- `Service Failure`
  The calculated `Service Failure` state score above, displayed on a `0-100` scale.

- `Usage Decline`
  The calculated `Usage Decline` state score above, displayed on a `0-100` scale.

- `Low Adoption`
  The calculated `Low Adoption` state score above, displayed on a `0-100` scale.

- `Low NPS`
  The calculated `Low NPS` state score above, displayed on a `0-100` scale.

- `Relationship Risk`
  Not shown as a risk-queue column. It remains available on account-detail views as explanatory context only and does not affect deterministic risk ordering.

The current growth review table columns are derived as follows:

- `Rank`
  Accounts sorted by `Final Growth Priority`, highest first.

- `Account`
  `account_name`

- `ARR £`
  `arr_gbp`

- `Renewal Date`
  `renewal_date`

- `Days`
  `renewal_date - today`

- `Growth Score`
  The account's percentile-ranked `Growth Importance` position within the dataset, scaled to `0-100` with ties averaged.

- `Expansion Opportunity`
  The calculated `Expansion Opportunity` state score above, displayed on a `0-100` scale on an inverted opportunity color scale.

- `Expansion Confidence`
  The note-derived expansion credibility score, displayed on a `0-100` scale.

- `Expansion Confidence Band`
  The user-facing confidence label of `Confident`, `Neutral`, or `Not Confident`.

- `Growth Priority`
  The final weighted growth ranking score:

```text
65% x (Expansion Opportunity x 100)
+ 35% x Growth Score
```

- `Service Failure`
  The calculated `Service Failure` state score above, displayed on a `0-100` scale.

- `Relationship Risk`
  The calculated `Relationship Risk` state score above, displayed on a `0-100` scale.

- `Usage Decline`
  The calculated `Usage Decline` state score above, displayed on a `0-100` scale.

- `Low Adoption`
  The calculated `Low Adoption` state score above, displayed on a `0-100` scale.

- `Low NPS`
  The calculated `Low NPS` state score above, displayed on a `0-100` scale.

## Current Review Artifact

The current live review page used for tuning is:

- `/Users/jonsearle/Desktop/Tenzing 1.0/docs/account-ranking-review-2026-03-21-v5.html`
- `/Users/jonsearle/Desktop/Tenzing 1.0/docs/account-ranking-review-2026-03-21-spec-rebuild.html`

It currently shows:

- a `Biggest Risks` table
- a `Best Growth Opportunities` table
- risk states shaded from green to red
- `Expansion Opportunity` shaded on an inverted green opportunity scale
- full ranked queues, not the constrained homepage top `5` view

## UI Review Note

Visual implementation should be reviewed against:

- `/Users/jonsearle/Desktop/Tenzing 1.0/docs/ui-review-checklist.md`

This checklist is not the source of truth for product requirements.

It exists to keep screens clear, minimal, and decision-focused during implementation.

## Open Questions

- the predefined action library by state
- account detail page information design
- lightweight learning/logging model
- product-level success metrics
- exact PRD wording and structure
