# WeShould

**WeShould turns “we should do that sometime” into an actual plan.** Someone can save a restaurant, event, class, or other activity without immediately proposing a time or inviting friends. When a connection independently saves the same activity, WeShould surfaces the overlap and makes it possible to propose, accept, and complete a plan.

**Live web app:** [weshould.mit-sdg.dev](https://weshould.mit-sdg.dev)

**Demonstrations:** [P4 web application demo](https://youtu.be/rc6xTzkLKjc) · [iOS Share Extension demo](https://youtube.com/shorts/qTrJqmveG7k)

## Core interaction

`Register → connect → save an activity → discover shared interest → propose a time → accept → commit → complete`

Activities enter the web application as a name and an HTTP(S) link. Users independently express their willingness to go; the application only displays shared intentions among accepted connections. A proposal can include multiple eligible participants, each of whom has independently saved the activity and is connected to the organizer. The plan commits when all participants accept. Completion withdraws the fulfilled intentions; cancellation preserves them for another attempt.

## Design artifacts

- [P4 design retrospective](design/p4-design-summary.md) — changes since P1 and P3, concept boundaries, interaction decisions, and tradeoffs.
- [Concept specifications](design/concepts/) — `Authenticating`, `Sessioning`, `Resolving`, `Intending`, `Connecting`, and `Planning`.
- [Application composition](design/compositions/Application.md) and [WeShould reactions](design/compositions/WeShould.md).
- [P3 user journey](design/p3-user-journey.md), [visual design study](design/visual_design_study.pdf), and [P2 notes](design/p2-notes.md).
- [P3 demonstration](https://youtu.be/8wAAYRWQ7to).
- [iOS companion project and technical details](ios/WeShould-Xcode/README.md).

## Conceptual architecture

`Resolving` assigns activities a stable identity; `Intending` owns saved willingness; `Connecting` owns reciprocal relationships; and `Planning` owns the proposal lifecycle. `Authenticating` and `Sessioning` establish the acting user's identity. Compositions coordinate their public operations: shared interests are derived from active intentions and connections, a reaction commits unanimously accepted plans, and a separate reaction withdraws intentions on completion.

The application validates proposal eligibility using `Connecting` and `Intending` queries without introducing WeShould-specific social policy into the `Planning` concept. User-scoped actions derive identity from active sessions, and plan operations check participant membership.

## Local development

**Requirements:** Bun, MongoDB, and Podman Compose (or an equivalent MongoDB service). The repository includes `compose.yaml`.

```bash
bun install
podman compose up -d
export MONGODB_URL='mongodb://dev:dev@127.0.0.1:27017/weshould?authSource=admin'
bun run start
```

The local application is served at [http://localhost:3000](http://localhost:3000).

## Tests and validation

With MongoDB available and `MONGODB_URL` configured:

```bash
bun test tests --timeout 30000
bun run generate
bun run check
```

The P4 local test suite was reported as 87 passing tests on October 26, 2026. Coverage includes core concept operations, end-to-end planning journeys, sessions, proposal eligibility, group invitations, and membership restrictions. The deployed workflow and native Share Extension are additional integration surfaces beyond the local test suite.

## iOS companion

The [iOS project](ios/WeShould-Xcode/) contains a `WKWebView` host application for the deployed website and a separate native Share Extension. The extension accepts shared URL or text content, presents a form for the activity name and link, and uses the existing WeShould backend rather than defining a new planning model. The Share Extension was observed on a physical iPhone running iOS 26. Support for every host application's sharing behavior is not implied.

**iOS demonstration:** [WeShould on the iOS Share Sheet](https://youtube.com/shorts/qTrJqmveG7k).
