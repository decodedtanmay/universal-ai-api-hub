# Deferred Features Backlog — Universal AI API Hub

Source: trimmed from `IMPLEMENTATION_ROADMAP.md` (Astra's P0 plan) to fit a solo build
against a hard deadline (Sept 27). Nothing here is required by the assignment PDF.
Everything here is a genuine "nice to have if time allows" — not a hidden requirement.

**Rule for using this file:** don't touch anything below until the core build is
fully working and tested end-to-end:
connector CRUD → provider adapters (Gemini + Groq) → dynamic input/output schema
validation → execution pipeline → logging/stats → doc generation → two working
demo connectors, deployed live.

Only pull an item from here if you finish core with real time left before the deadline.
Add them one at a time, test each before moving to the next — don't batch them in.

---

## 1. Workspace isolation

**What it is:** giving each anonymous visitor/session their own separate scope of
connectors and data, so multiple simultaneous evaluators (or you + a friend testing)
don't collide or see each other's test connectors.

**Why deferred:** the assignment describes one evaluator using the app. This solves
a multi-user problem the spec doesn't have.

**When it'd matter:** if you're worried about the evaluator's test data colliding with
your own demo data, or multiple reviewers hitting the app at once.

**Cheap partial version if you want a safety net without the full build:**
just don't let external API callers list/edit/delete connectors — only the admin
UI can, and it has no auth requirement per the spec (evaluator doesn't log in).
That alone avoids most collision risk without building real session-scoped isolation.

---

## 2. Quota reservations / rate limiting

**What it is:** enforcing per-connector or per-IP request limits so nobody (including
an eager evaluator, or a bot) can hammer your endpoints and blow through your free-tier
provider limits (Gemini/Groq) or run up your Render/Railway bill.

**Why deferred:** listed as a bonus in the PDF (section 19), not core. Astra promoted
it to P0 for "responsible public demo" reasons — legitimate concern, not a grading item.

**Why it's actually a good one to revisit if time allows:** it's relatively cheap to
add (a simple `RateLimiter` middleware in Laravel is a few lines) and directly
protects you from the most realistic failure mode of a public demo — someone/something
spamming your endpoint and exhausting your Gemini free-tier RPD right before the
evaluator tries it.

**Minimum viable version:** Laravel's built-in `throttle` middleware on the
execution API routes (e.g. 10 requests/minute per IP). Not the full atomic
reservation system Astra spec'd — just enough to prevent accidental exhaustion.

---

## 3. Docker packaging

**What it is:** containerizing the app so it runs identically in any environment.

**Why deferred:** Render and Railway both deploy Laravel directly from a repo without
needing a Dockerfile. Docker adds a failure surface (bad base image, missing PHP
extensions in-container) for zero grading benefit — the spec wants a live URL, not
a specific packaging method.

**When it'd matter:** only if your chosen host specifically requires it, or if you
want deployment portability for after the internship. Not a priority for evaluation.

---

## 4. Browser test suite (Playwright/Cypress-style end-to-end tests)

**What it is:** automated tests that drive a real or headless browser through your
UI — clicking buttons, filling forms, checking rendered output — to catch UI
regressions.

**Why deferred:** highest effort-to-payoff ratio of anything cut. Writing reliable
browser tests often takes as long as the feature itself. The spec expects you to
manually verify the app works (section 11's "Test API" panel, section 18's live
demo) — nobody is checking for an automated test suite.

**When it'd matter:** genuinely, probably never for this assignment. Skip
permanently unless you have a specific reason (e.g. reusing this project as a
portfolio piece later and want CI in place).

---

## Other P1/P2 items from Astra's roadmap (lower priority, listed for completeness)

- Model discovery / auto-refresh model dropdown (bonus per PDF section 6)
- Simple request-volume charts (bonus per PDF section 19: "advanced analytics")
- Connector import/export (bonus per PDF section 19)
- A third provider beyond Gemini/Groq (bonus, "more AI providers")
- Provider fallback/retry logic (bonus per PDF section 19)
- Automatic AI response repair on malformed output (bonus per PDF section 19)

These are legitimate bonus-point opportunities if the core is done early — closer
to "free points" than the four items above, since the PDF explicitly names them
as bonuses (section 19) rather than Astra having invented them.
