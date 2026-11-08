# WeShould

**WeShould turns “we should do that sometime” into an actual plan.** Someone can save a restaurant, event, class, or other activity without immediately proposing a time or inviting friends. When a connection independently saves the same activity, WeShould surfaces the overlap and makes it possible to propose, accept, and complete a plan.

**Live web app:** [weshould.mit-sdg.dev](https://weshould.mit-sdg.dev)

**Demonstrations:** [P4 web application demo](https://youtu.be/rc6xTzkLKjc) · [iOS Share Extension demo](https://youtube.com/shorts/qTrJqmveG7k)

## P5 — User Study and Evaluation

Two usability studies were conducted with Jamie and Riley to evaluate how people understand WeShould's main workflow. Each participant worked through seven tasks involving saving activities, finding shared interests, managing connections, proposing outings, responding to invitations, and managing plans.

The study documents are available below:

- [Task list](design/task-list.md) — participant instructions, task rationale, and the intended observations.
- [Jamie study report](design/study-jamie.md) — observations from Jamie's session.
- [Riley study report](design/study-riley.md) — observations from Riley's session.
- [Findings and proposed improvements](design/findings.md) — usability issues, supporting evidence, severity ratings, and potential design changes.

The studies found that participants generally understood the main workflow, particularly how shared interests lead to plans and how accepted invitations become committed. The main difficulties involved understanding what an action would share with other people and interpreting the status of a newly proposed outing.

### Deployed application for evaluation

Graders can explore the deployed application using the following test account:

- **URL:** https://weshould.mit-sdg.dev
- **Username:** `Test`
- **Password:** `fraeogerg`

The `Test` account contains prepared data demonstrating the app's main features and planning states. Jamie and Riley completed their usability studies using separate accounts. This shared test account is provided for exploring the application, not for reproducing the full sequence of study tasks.

**Saved activities**

The account contains four saved activities under "Ideas worth keeping":

- Wilson's Farm
- Isabella Stewart Gardner Museum
- Mariel
- Paint and sip

**Connections and shared interests**

The account is connected to `@Nora` and `@Theo`. Three shared-interest cards are visible:

- **Wilson's Farm:** Shared with Nora.
- **Isabella Stewart Gardner Museum:** Shared with Nora and Theo.
- **Paint and sip:** Shared with Theo.

Mariel is saved independently and does not appear as a shared-interest card.

Graders can select **Make a plan** on a shared-interest card to explore the proposal workflow, including selecting eligible participants and suggesting a time.

**Existing plans**

The account also includes three plans in different states:

| Activity | Participants | Time | Status |
|---|---|---|---|
| Map Exhibit | Test and Nora | Thursday at 9:30 | Done |
| Wilson's Farm | Test and Nora | Friday 5 PM | Cancelled |
| Wilson's Farm | Test and Nora | Friday 5 PM | Committed |

The completed Map Exhibit shows how finished outings appear in history. The cancelled Wilson's Farm plan demonstrates that cancelling an arrangement preserves the original saved interest. The separate committed Wilson's Farm plan, proposed by Nora, can be marked done or cancelled to explore plan management.

The test account contains a prepared demonstration state. Changes made while exploring the application persist and may affect what later visitors see.

## Core Interaction

`Register → connect → save an activity → discover shared interest → propose a time → accept → commit → complete`

Activities enter the web application as a name and an HTTP(S) link. Users independently express their willingness to go; the application only displays shared intentions among accepted connections.

A proposal can include multiple eligible participants, each of whom has independently saved the activity and is connected to the organizer. The plan commits when all participants accept. Completion withdraws the fulfilled intentions; cancellation preserves them for another attempt.

## Design Artifacts

### P5 — User Study

- [Task list](design/task-list.md)
- [Jamie study report](design/study-jamie.md)
- [Riley study report](design/study-riley.md)
- [Findings and proposed improvements](design/findings.md)

### P4 — Design and Implementation

- [P4 design retrospective](design/p4-design-summary.md) — changes since P1 and P3, concept boundaries, interaction decisions, and tradeoffs.
- [Concept specifications](design/concepts/) — `Authenticating`, `Sessioning`, `Resolving`, `Intending`, `Connecting`, and `Planning`.
- [Application composition](design/compositions/Application.md) and [WeShould reactions](design/compositions/WeShould.md).
- [P4 web application demonstration](https://youtu.be/rc6xTzkLKjc).

### Earlier Design Work

- [P3 user journey](design/p3-user-journey.md).
- [P3 visual design study](design/visual_design_study.pdf).
- [P3 demonstration](https://youtu.be/8wAAYRWQ7to).
- [P2 implementation notes](design/p2-notes.md).

### iOS Companion

- [iOS project and technical documentation](ios/WeShould-Xcode/README.md).
- [iOS Share Extension demonstration](https://youtube.com/shorts/qTrJqmveG7k).

## Conceptual Architecture

`Resolving` assigns activities a stable identity; `Intending` owns saved willingness; `Connecting` owns reciprocal relationships; and `Planning` owns the proposal lifecycle. `Authenticating` and `Sessioning` establish the acting user's identity.

Compositions coordinate their public operations: shared interests are derived from active intentions and connections, a reaction commits unanimously accepted plans, and a separate reaction withdraws intentions on completion.

The application validates proposal eligibility using `Connecting` and `Intending` queries without introducing WeShould-specific social policy into the `Planning` concept. User-scoped actions derive identity from active sessions, and plan operations check participant membership.

## Local Development

**Requirements:** Bun, MongoDB, and Podman Compose (or an equivalent MongoDB service). The repository includes `compose.yaml`.

```bash
bun install
podman compose up -d
export MONGODB_URL='mongodb://dev:dev@127.0.0.1:27017/weshould?authSource=admin'
bun run start
```

The local application is served at [http://localhost:3000](http://localhost:3000).

## Tests and Validation

With MongoDB available and `MONGODB_URL` configured:

```bash
bun test tests --timeout 30000
bun run generate
bun run check
```

The P4 local test suite was reported as **87 passing tests on October 26, 2026**.

Coverage includes core concept operations, end-to-end planning journeys, sessions, proposal eligibility, group invitations, and membership restrictions. The deployed workflow and native Share Extension are additional integration surfaces beyond the local test suite.

## iOS Companion

The [iOS project](ios/WeShould-Xcode/) contains a `WKWebView` host application for the deployed website and a separate native Share Extension.

The extension accepts shared URL or text content, presents a form for the activity name and link, and uses the existing WeShould backend rather than defining a new planning model.

The Share Extension was observed on a physical iPhone running iOS 26. Support for every host application's sharing behavior is not implied.

**iOS demonstration:** [WeShould on the iOS Share Sheet](https://youtube.com/shorts/qTrJqmveG7k).

