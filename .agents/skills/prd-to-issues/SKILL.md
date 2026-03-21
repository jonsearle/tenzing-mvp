---
name: prd-to-issues
description: Break a PRD into independently-grabbable work items using tracer-bullet vertical slices, then prepare them for Linear, GitHub Issues, or a local planning doc. Use when user wants to convert a PRD to issues, create implementation tickets, or break down a PRD into work items.
---

# PRD to Issues

Break a PRD into independently-grabbable work items using vertical slices (tracer bullets).

Default to a tool-agnostic workflow:

1. identify the source PRD
2. break it into thin vertical slices
3. review and refine the slices with the user
4. save the approved breakdown in a local Markdown artifact if helpful
5. optionally publish the approved slices into Linear or GitHub Issues

Do not assume GitHub Issues are available. If the user already uses Linear, prefer preparing Linear-ready tickets unless they explicitly ask for GitHub.

## Process

### 1. Locate the PRD

Ask the user where the PRD lives.

Possible sources:

- a local Markdown PRD in the repo
- a GitHub issue
- a Linear project or issue description

If the PRD is local, read it directly.

If it is a GitHub issue and not already in your context window, fetch it with `gh issue view <number>` (with comments).

If it is in Linear, use whatever local tooling or user-provided content is available. If direct Linear access is not available, ask the user to point you to the local PRD copy or paste the PRD content.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code.

### 3. Draft vertical slices

Break the PRD into **tracer bullet** issues. Each issue is a thin vertical slice that cuts through ALL integration layers end-to-end, NOT a horizontal slice of one layer.

Slices may be 'HITL' or 'AFK'. HITL slices require human interaction, such as an architectural decision or a design review. AFK slices can be implemented and merged without human interaction. Prefer AFK over HITL where possible.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
</vertical-slice-rules>

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title**: short descriptive name
- **Type**: HITL / AFK
- **Blocked by**: which other slices (if any) must complete first
- **User stories covered**: which user stories from the PRD this addresses

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the dependency relationships correct?
- Should any slices be merged or split further?
- Are the correct slices marked as HITL and AFK?

Iterate until the user approves the breakdown.

### 5. Create a local planning artifact

Unless the user explicitly asks to publish immediately, create a local Markdown artifact with the approved slices first. This gives the team a stable planning document before any tracker-specific ticket creation.

Suggested file names:

- `docs/prd-slices.md`
- `docs/<feature-name>-slices.md`

Use the template below.

<slice-template>
## Slice N: <title>

**Type**: AFK / HITL

**Blocked by**: None - can start immediately

or

**Blocked by**:

- Slice 1
- Slice 2

**User stories addressed**:

- User story 3
- User story 7

**What to build**

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation. Reference specific sections of the parent PRD rather than duplicating content.

**Acceptance criteria**

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
</slice-template>

### 6. Publish the approved slices into the tracker the user actually uses

If the user uses Linear, prepare Linear-ready tickets by default. If the user uses GitHub Issues, prepare GitHub issue bodies or create them directly if asked.

If publishing directly, create tickets in dependency order so blockers exist before dependent slices.

#### Linear-ready format

For each approved slice, prepare:

- **Title**
- **Type**: AFK / HITL
- **Blocked by**
- **User stories addressed**
- **What to build**
- **Acceptance criteria**

Map these into the team's Linear conventions such as:

- title
- description
- labels
- project
- milestone
- dependency links

If direct Linear creation is not available, provide clean copy-paste-ready ticket bodies.

#### GitHub issue format

If the user wants GitHub Issues, use the template below.

<issue-template>
## Parent PRD

#<prd-issue-number>

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation. Reference specific sections of the parent PRD rather than duplicating content.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

- Blocked by #<issue-number> (if any)

Or "None - can start immediately" if no blockers.

## User stories addressed

Reference by number from the parent PRD:

- User story 3
- User story 7

</issue-template>

Do NOT close or modify the parent PRD issue.
