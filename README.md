# WeShould

**WeShould turns “we should do that sometime” into an actual plan.** Save a restaurant, event, class, or other activity without proposing a time or inviting anyone. When a connection independently saves the same activity, WeShould surfaces the overlap and makes it easy to propose, accept, and complete a plan.

**Live web app:** [weshould.mit-sdg.dev](https://weshould.mit-sdg.dev)

## How it works

`Register → connect → save an activity → discover shared interest → propose a time → accept → commit → complete`

An activity is saved using a name and an HTTP(S) link. After a connection accepts your request, independently saved interests appear together. The organizer proposes a time; the plan commits once all participants accept. Completing a plan withdraws the associated saved intentions, while cancelling a plan leaves the underlying interest intact.

## Project materials

- [P4 final design summary](design/P4-design-summary.md) — design evolution, concept boundaries, access control, tradeoffs, and test evidence.
- [Concept specifications](design/concepts/) — `Authenticating`, `Sessioning`, `Resolving`, `Intending`, `Connecting`, and `Planning`.
- [Application composition](design/compositions/Application.md) and [WeShould reactions](design/compositions/WeShould.md).
- [P3 user journey](design/p3-user-journey.md), [visual design study](design/visual_design_study.pdf), and [P2 implementation notes](design/p2-notes.md).
- **P4 narrated demo (≤3 minutes):** add the final recording URL here after recording it.
- [Previous P3 narrated demo](https://youtu.be/8wAAYRWQ7to).

## Design and access control

Each concept owns one part of the workflow: activity identity, personal intentions, connections, or plans. The application composition joins their public queries and actions. Shared intentions are derived from connections and active saves; reactions commit unanimously accepted proposals and withdraw intentions after completion.

Endpoints resolve the acting account from its session. A proposed plan requires participants to be connected to the organizer and to have independently saved the activity. Responding, cancelling, and completing are restricted to plan participants. The eligibility check belongs to the application rather than another concept's database implementation.

## Run locally

**Prerequisites:** [Bun](https://bun.sh/), MongoDB, and Podman with Compose support (or an equivalent MongoDB instance). The repository includes `compose.yaml`.

From the repository root:

```bash
bun install
podman compose up -d
export MONGODB_URL='mongodb://dev:dev@127.0.0.1:27017/weshould?authSource=admin'
bun run start
```

Open [http://localhost:3000](http://localhost:3000). Use the database URL or credentials appropriate for your environment if they differ from the provided development Compose setup.

## Test and validate

With MongoDB running and `MONGODB_URL` set:

```bash
bun test tests --timeout 30000
bun run generate
bun run check
```

The P4 local suite was reported as **87 passing tests** on October 26, 2026. `bun run generate` updates the checked-in sync-engine artifacts; `bun run check` verifies specifications, generated artifacts, and TypeScript. Regenerate only when source or design changes require it, and review generated diffs before committing.

For deployed validation, use two accounts to save the same item independently, accept a connection, propose and accept a plan, complete it, and reload to confirm persistence. Also try invalid links, expired sessions, and attempts to modify someone else's plan. Production testing should be recorded separately from local test results.

## Mobile sharing

The primary deliverable is the browser-based application. Native iOS Share Extension integration is future work and is not included in this repository. The web app supports manually entering an activity name and URL.
