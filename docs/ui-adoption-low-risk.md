# Low-Risk UI Adoption Guide

This is the smallest, safest subset of the design docs to adopt first.

The goal is not to impose a full design system or a rigid workflow.
The goal is to make the product look cleaner, calmer, and more intentional with minimal downside.

## What To Adopt Now

### 1. One primary thing per screen

Each screen should have:
- one main purpose
- one obvious primary action
- one focal area

If a page is trying to summarise everything at once, split or defer.

Why this is low risk:
- improves clarity without requiring any specific stack
- works for dashboards, forms, and detail pages

### 2. Remove visual clutter before adding design

Default rule:
- if an element does not help the user decide, understand, or act, remove it

Common removals:
- extra helper text that repeats labels
- duplicate headings
- decorative icons
- low-value stat cards
- redundant borders and panels

Why this is low risk:
- deleting noise rarely breaks functionality
- most AI-generated UI gets better by subtraction

### 3. Use spacing, not boxes, for structure

Prefer:
- consistent vertical rhythm
- clear section spacing
- simple alignment

Avoid by default:
- wrapping every section in a card
- using borders just to make the layout feel designed
- nested panels

Why this is low risk:
- improves polish without changing information architecture
- reduces the "generic SaaS template" look

### 4. Keep typography simple

Use only a small number of text styles per screen area:
- page title
- normal body text
- supporting/meta text

Also:
- avoid decorative bolding
- avoid long explanatory intros
- keep button labels short

Why this is low risk:
- creates hierarchy fast
- does not depend on a particular component library

### 5. Make tables and lists earn their layout

Default choices:
- use a list when scanning a small number of attributes
- use a table when comparing multiple attributes across records
- use cards only when each item is a discrete entity the user acts on as a unit

Why this is low risk:
- helps the UI match the content
- avoids the common "everything is a card" anti-pattern

### 6. Use color sparingly

Keep most of the interface neutral.
Reserve strong colour for:
- the main action
- status
- destructive states

Avoid:
- gradients
- coloured section backgrounds
- multiple accent colours fighting for attention

Why this is low risk:
- improves focus
- easy to apply gradually

## What Not To Adopt Yet

These parts are useful, but higher risk if adopted too early:

- stack-specific rules tied to Next.js, Tailwind, shadcn, Lucide, or Geist
- the full sketch -> spec -> implementation -> review workflow for every screen
- hard rules like "one filled button per screen" applied literally everywhere
- a strict component registry unless there is already an active frontend codebase
- a decisions log unless someone will actually maintain it

## Practical Default Rules

When designing or implementing a screen, use these checks:

1. What is the user here to do?
2. What is the single most important action?
3. What can be removed without harming comprehension?
4. Can spacing solve this instead of a card or border?
5. Is this text saying anything the UI does not already say?
6. Does color communicate meaning, or is it just decoration?

## Suggested Adoption Path

### Phase 1: Screen review

Review existing and new screens against only these themes:
- hierarchy
- clutter removal
- spacing
- typography restraint
- layout fit

This gives most of the value with almost no process overhead.

### Phase 2: Lightweight implementation prompt

When asking an AI tool to build UI, include only this guidance:

> Keep the screen minimal and task-focused. One clear primary action. Prefer spacing over cards. Avoid decorative icons, gradients, and unnecessary helper text. Use simple typography with a clear title, body text, and subdued supporting text. Choose the layout that best matches the content: list, table, or detail view.

### Phase 3: Targeted review pass

Before accepting a screen, check:
- Is there a clear focal point?
- Did we add too many sections?
- Are cards being used as layout rather than content?
- Is any text redundant?
- Is the page calmer after simplification?

## Recommendation

Adopt the principles and anti-patterns first, not the full system.

The safest subset is:
- one dominant purpose per screen
- remove clutter aggressively
- spacing over containers
- simple typography
- restrained use of cards, icons, and colour

That will improve the UI without locking the product into a specific framework or a heavy design workflow.
