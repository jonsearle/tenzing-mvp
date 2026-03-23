# Tenzing Product Definition Backlog

Date: 2026-03-21

## Improve Prioritisation Logic

- review the current scoring model to make sure the balance between early warning signs and lagging indicators feels right
- make sure one very severe issue cannot be hidden too easily by a few weaker signals
- explore whether the ranking should include both overall severity and a stronger “single biggest risk” component
- keep tuning the separate risk and growth ranking formulas so they match product intuition better
- test OpenAI account interpretations and vibe classifications against real reviewed accounts before making the scoring model more dependent on them

## Improve Growth Scoring

- improve how `Expansion Opportunity` measures whether a growth opportunity is truly credible
- revisit whether the light `Expansion Confidence` modifier should stay at `0.1` once the note-quality inputs are more trustworthy
- introduce more structured growth signals in a later version if the current interpretation layer still feels too simplistic

## Build The Learning Loop

- introduce more structured relationship and growth signal extraction in a later version if the current interpretation outputs are not good enough
- expand the LLM interpretation so queue-level rationale, action sequencing, and “what would change this decision” guidance become more explicit
- replace some fixed scoring assumptions with patterns learned from real usage and outcomes
- explore whether ranking weights should eventually be learned from results instead of being set manually
- define how saved actions are reviewed over time and how that evidence should improve future recommendations
- define what counts as a meaningful improvement for each MVP action success rule

## Add User Control And Governance

- add a future workflow that lets users challenge or override the system’s recommendation in a more structured way
- decide whether spec and backlog updates should become a standard part of future product-design work
