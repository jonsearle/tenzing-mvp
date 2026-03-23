# Tenzing Account Prioritisation Prototype

This repository contains a prototype internal tool for prioritising portfolio accounts using a mix of deterministic scoring and bounded AI interpretation.

The product is designed to help leadership answer three questions quickly:

- Which accounts need attention now
- Why those accounts are being surfaced
- What action should happen next

The core dataset remains the provided CSV at [docs/account_prioritisation_challenge_data.csv](/Users/jonsearle/Desktop/tenzing-mvp/docs/account_prioritisation_challenge_data.csv).

## What the prototype does

- Authenticated entry into the app
- Portfolio overview with top risk and top growth accounts
- Full ranked risk and growth queues
- Account drill-down pages with reasoning, evidence, and recommended action
- Decision capture so a reviewer can save what should happen next
- AI-generated note interpretation grounded in the account's structured context

Key routes:

- `/auth/login`
- `/portfolio-v2`
- `/queue-v2/risk`
- `/queue-v2/growth`
- `/accounts-v2/:accountId`

## Submission write-up

The short challenge write-up is in [docs/submission-writeup.md](/Users/jonsearle/Desktop/tenzing-mvp/docs/submission-writeup.md).

## Architecture

- `Next.js` App Router for the web application
- CSV file as the core source of truth
- Normalization layer to coerce messy source values into typed account records
- Deterministic scoring for risk, growth, renewal urgency, and recommended next action
- OpenAI API for bounded interpretation of account notes
- Supabase for Google authentication, cached AI interpretations, and saved decisions

For growth ranking specifically, expansion pipeline is the dominant signal and the AI-derived growth sentiment is used only as a light modifier.

Important app modules:

- [lib/data/accounts.ts](/Users/jonsearle/Desktop/tenzing-mvp/lib/data/accounts.ts)
- [lib/data/normalize-account.ts](/Users/jonsearle/Desktop/tenzing-mvp/lib/data/normalize-account.ts)
- [lib/scoring/risk-queue.ts](/Users/jonsearle/Desktop/tenzing-mvp/lib/scoring/risk-queue.ts)
- [lib/scoring/growth-queue.ts](/Users/jonsearle/Desktop/tenzing-mvp/lib/scoring/growth-queue.ts)
- [lib/scoring/account-detail.ts](/Users/jonsearle/Desktop/tenzing-mvp/lib/scoring/account-detail.ts)
- [lib/notes/interpretation.ts](/Users/jonsearle/Desktop/tenzing-mvp/lib/notes/interpretation.ts)
- [lib/decisions.ts](/Users/jonsearle/Desktop/tenzing-mvp/lib/decisions.ts)

## Running locally

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

## Environment variables

Minimum variables for the full experience:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
```

Notes:

- With Supabase configured, the app supports Google sign-in plus persistence for saved decisions and cached AI interpretations.
- Without Supabase, the login page still offers a reviewer bypass so the prototype can be explored quickly, but decision persistence will be unavailable.
- Without `OPENAI_API_KEY`, the deterministic scoring still works, but AI note interpretation falls back to an unavailable state in the UI.

## Verification

Run the test suite with:

```bash
npm test
```
