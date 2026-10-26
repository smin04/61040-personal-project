# WeShould — P4 Design Summary

## Problem and final experience

“We should go sometime” often expresses genuine interest but rarely becomes a plan. WeShould separates **saving an idea** from **inviting someone**: people independently save activities, discover a match when a connection has saved the same thing, and only then choose a time. The final web journey is **register → connect → save → match → propose → accept → commit → complete**. Declining or cancelling a proposal does not erase the original interest.

## How the design evolved

- **P1 — Concept design.** The initial design distinguished an activity's identity (`Resolving`), an individual's willingness (`Intending`), social ties (`Connecting`), and concrete plans (`Planning`). `Authenticating` and `Sessioning` supply identity and session state. This separation matters because an intention is not a commitment.
- **P3 — Working beta and visual language.** The complete two-person journey became functional, with manual activity-name and HTTP(S) URL entry rather than in-app discovery. Different URLs can resolve to a shared activity identity. The home view combines saved ideas, connected users' overlapping interests, and proposed or committed plans. The interface uses a warm ivory and plum foundation, with prominent calls to action and distinct feedback for successful and destructive operations.
- **P4 — Access control and completion.** The existing concepts and plan lifecycle remain intact. At the application boundary, an authenticated session determines the acting user. The proposal path now requires a connection and an independent active intention from each participant; this eligibility rule uses public `Connecting` and `Intending` queries through an application-level policy rather than letting `Planning` read their storage. `Planning.complete` also requires the acting participant and rejects completion by an outsider instead of silently leaving the endpoint unresolved. Rejection scenarios were added to the integration tests.

## Concept composition and reactions

The concepts retain distinct responsibilities. `Resolving` converges references into activities; `Intending` records willingness; `Connecting` manages reciprocal relationships; `Planning` owns proposal state, participant responses, and lifecycle transitions. A derived shared-intention view joins connections and active intentions—there is no extra stored “match” object. A reaction commits a proposal once all participants have accepted. A separate completion reaction withdraws the participants' active intentions; cancellation has **no** withdrawal reaction, so someone can pursue the same idea another time.

The home endpoint gathers each user's relevant state for the UI. Authentication is resolved before user-scoped operations, and plan response, cancellation, and completion enforce participant membership. This division keeps the underlying concepts independently testable while placing product-specific coordination at the application boundary.

## Interaction decisions and tradeoffs

- **Low-pressure capture.** Saving a link does not immediately notify someone or require a date. The interface makes the transition from interest to commitment explicit.
- **Deliberate matching.** Shared interests appear only for connections that independently saved the activity; unrelated users do not receive a social match.
- **Clear error behavior.** Invalid URLs, duplicate actions, invalid sessions, and unauthorized plan operations should fail visibly rather than appear to succeed. Session-derived identities prevent callers from simply claiming another username.
- **Mobile sharing.** The web flow remains the reliable baseline. Native iOS sharing is a separate planned enhancement, not part of the submitted web build. It would transfer a shared URL into the capture form for user confirmation; an Xcode target, signing, and on-device payload testing are still needed.
- **Eligibility timing.** Proposal eligibility is checked before creation, but changes to connections or intentions are not locked into the same transaction. Stronger guarantees would require coordinating state changes atomically; that complexity is disproportionate to the current scope.

## Testing and P5 readiness

The local suite completed with **87 passing tests and no failures** (P4, October 26, 2026), covering concept operations and end-to-end composition journeys. The added proposal tests reject a stranger despite matching saved interest and reject a connected friend who has not independently saved the item. Existing tests also cover session invalidation, connection-request permissions, plan responses, cancellation, and completion.

## Reference materials

- [Concept specifications](concepts/) and [application composition](compositions/Application.md)
- [WeShould reactions](compositions/WeShould.md) and [P3 user journey](p3-user-journey.md)
- [P2 implementation notes](p2-notes.md)