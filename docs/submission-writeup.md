# Submission Write-Up

## Mission and Vision

The broader mission behind this product is to help businesses grow through data and the use of AI.

The long-term vision is a continuously learning decision system that:

- Suggests the most effective action
- Measures the outcomes of those actions
- Improves its recommendations over time

## Architecture Decisions

### Data Layer

- The provided CSV remains the core data source

### Normalisation Layer

Handles:

- Null values
- Mixed data types
- Imperfect inputs

While:

- Preserving invalid inputs for transparency

### Scoring Layer

- Deterministic scoring drives prioritisation
- Ranking logic remains inspectable and defensible

### AI Layer

AI (Artificial Intelligence) is used to:

- Interpret notes
- Explain mixed-signal accounts

AI does not:

- Rank accounts end-to-end

### Application Layer

Supabase is used for:

- Google authentication
- Cached AI interpretations
- Saved decisions

## How Prioritisation Works

This system ranks accounts through two distinct views:

### Risk View (Revenue Protection)

Surfaces:

- Accounts most likely to churn
- Accounts at risk of contraction

### Growth View (Revenue Expansion)

Surfaces:

- Accounts with the strongest expansion potential

### Why Two Views?

Different teams optimise for different outcomes:

- Customer Success -> retention
- Support -> stability
- Sales -> growth

A single prioritisation would blur these objectives.

### How Ranking Works (Conceptual)

Accounts are prioritised based on:

- Commercial impact (ARR, expansion value)
- Urgency (e.g. renewal timing)
- Signal strength (consistency of evidence)
- Direction of value (risk vs growth)

In simple terms:

Accounts rise in priority when meaningful value is at stake, timing is urgent, and multiple signals point in the same direction.

Detailed formulas are documented separately in the [full ranking methodology](/ranking-methodology).

## How AI Improves the Workflow

AI is used to improve interpretation where rules alone are insufficient.

### Problem

Structured metrics explain what is happening, but not always why, especially when:

- Notes are messy
- Signals conflict
- Context is unclear

### Approach

Instead of sending raw notes, the system sends a structured account brief to the model, including:

- Renewal urgency
- Adoption level
- Usage trend
- Service pressure
- Pipeline position
- Data gaps

### Output

The model returns:

- A concise account summary
- The primary driver
- Identification of mixed signals
- Bounded signals (e.g. relationship sentiment, growth sentiment)

### Role of AI

AI improves:

- Interpretation
- Explanation quality
- Action framing

AI does not:

- Decide priority

## Trade-offs

### 1. Simplicity vs Sophistication

- Chose deterministic, formula-driven scoring
- Easier to explain and defend

### 2. AI Scope

- AI is bounded to interpretation and explanation
- Avoids black-box ranking

### 3. Prototype Constraints

- CSV used as source of truth
- Fast to build and inspect
- Limited by data breadth and freshness

### 4. Data Quality Handling

- Nulls and inconsistencies handled explicitly
- No full production-grade pipelines

### 5. Evidence Quality

Current system:

- Treats presence of notes as usable evidence

Future system should:

- Assess note quality
- Consider recency
- Evaluate consistency across sources

## What I Would Build Next

### 1. Move from Account Prioritisation -> Strategic Insight

#### Goal

Shift from reacting to individual accounts -> identifying leading indicators across the portfolio.

#### Why this matters

- Leadership benefits from account-level prioritisation, but gains even more value when patterns can also be seen across the portfolio
- Systemic issues and opportunities drive larger impact

#### What this enables

- Earlier detection of churn risk
- Earlier identification of expansion opportunities
- Portfolio-level decision-making
