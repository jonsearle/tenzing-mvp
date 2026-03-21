---
name: spec-keeper
description: Maintain a live product spec and separate backlog while a product or feature is being defined. Use when the user wants to lock decisions, update the spec as you go, audit whether the spec matches the conversation, split current truth from future ideas, or keep a clean handoff artifact.
---

Maintain two files as the source of truth:

- the live spec for current locked decisions
- the backlog for future ideas, concerns, and deferred work

In this repo, default to:

- `docs/product-definition-spec.md`
- `docs/product-definition-backlog.md`

## Core Rules

- Put only current locked decisions in the live spec.
- Put deferred ideas, concerns, and future enhancements in the backlog.
- Do not leave newly locked decisions only in chat memory if the user asks to lock them.
- If the current spec and the conversation disagree, call that out and reconcile it.
- Keep the spec concise and high-signal.

## Triggers

Use this skill when the user says things like:

- `lock this`
- `update the spec`
- `add this to backlog`
- `checkpoint`
- `audit the spec`
- `have we documented this`

## Workflow

1. Read the live spec and backlog first if they exist.
2. Determine whether the new information is:
   - locked current behavior
   - unresolved question
   - future idea / backlog
3. Update the correct file immediately.
4. Briefly tell the user what was written and where.

## Commands To Support

### `lock this`

- add the agreed decision to the live spec
- if it replaces an earlier decision, update the old section instead of duplicating it

### `add this to backlog`

- add the idea to the backlog file
- keep it short and action-oriented

### `checkpoint`

- refresh the live spec so it matches the current conversation state
- refresh the backlog if needed
- mention any open questions still unresolved

### `audit the spec`

- compare the current conversation state to the live spec
- list:
  - missing locked decisions
  - contradictions
  - items that belong in backlog instead of the spec

## File Structure Guidance

Keep the live spec organized around:

- product definition
- locked model decisions
- current ranking / scoring logic
- current live artifacts
- open questions

Keep the backlog organized around:

- scoring concerns
- future enhancements
- learning / optimisation ideas
- workflow / governance ideas

## Style

- prefer edits over append-only notes
- avoid repeating the same decision in multiple places
- keep formulas and rules explicit when they are currently live
- keep backlog items short enough to scan quickly
