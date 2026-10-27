# WeShould — P4 Design Summary

## Problem and experience

“We should do that sometime” is often sincere but too weak to initiate scheduling. WeShould preserves this early interest without treating it as a commitment. A user saves an activity and its link privately; when a connection independently saves the same activity, the app reveals that overlap. Only then does it ask someone to propose a time. The implemented flow is **register → connect → save → match → propose → accept → commit → complete**. Cancellation does not erase interest, while completion resolves it.

## Design development

The original concept design separated four different kinds of state: an activity's identity, an individual's willingness, a reciprocal social connection, and a concrete plan. `Authenticating` and `Sessioning` provide account and session infrastructure. This boundary has remained central throughout the project: a saved idea is not an invitation, a shared idea is not yet an agreement, and a proposal is not committed until its participants accept.

The P3 beta implemented the two-person journey with manual activity names and HTTP(S) links. Discovery remained external to WeShould. The interface adopted a warm ivory and plum palette, contrasting editorial display typography with direct controls and clearer feedback for invalid inputs or destructive actions. Its hierarchy emphasizes the moment independent intentions become a shared opportunity.

P4 concentrated on finishing the planning behavior and enforcing access controls across the complete journey. The proposal path now checks that each invitee is connected to the organizer and that every participant has independently saved the relevant activity. This check is implemented at the application boundary using public `Connecting` and `Intending` queries, rather than allowing `Planning` to depend on their internal storage. Plan completion also requires an acting participant, closing an authorization gap in the original flow. Group proposals reuse the existing participant model; invitees do not have to be connected to one another.

## Concepts, composition, and reactions

`Resolving` gives references a usable activity identity. `Intending` owns saved willingness; `Connecting` owns social ties; `Planning` owns proposals, responses, commitment, cancellation, and completion. Compositions coordinate these concepts. A shared-interest view is derived from current connections and intentions rather than stored as another concept. A reaction commits a plan once all its participants accept. Completion withdraws related active intentions, but cancellation deliberately leaves them intact so participants may try the activity later.

User-scoped application actions derive identity from the active session. Eligibility and membership checks prevent an outsider from proposing plans on behalf of disconnected users, responding to someone else's plan, or completing a plan in which they do not participate. The separation preserves reusable concept behavior while enforcing WeShould-specific policies at the composition boundary.

## Interaction decisions and tradeoffs

The capture interaction is intentionally low-pressure: saving a link neither requires a date nor sends an invitation. Requiring an independently saved activity from each participant makes a match more meaningful than an arbitrary recommendation, although it limits spontaneous invitations. The application currently matches resolved activity identities rather than attempting to infer that unrelated posts discuss the same place.

The iOS companion adds a second entry point without changing the underlying concepts. Its Share Extension appears in the iOS Share Sheet and provides an activity and link form that communicates with the deployed backend. The extension asks for WeShould credentials because its session is separate from the embedded web view's session; shared authenticated state would require a more developed native session design. Share Sheet registration has been observed on a physical iPhone, while successful end-to-end share-to-save and third-party host-app compatibility have not been established in the documented test results.

Proposal eligibility is checked before creation but is not an atomic transaction with connection and intention updates. That is a conscious implementation limit: it keeps the concepts and composition simpler, while leaving a narrow possibility of state changes between validation and creation.

## Validation and remaining scope

The P4 local suite was reported at **87 passing tests** on October 26, 2026. Tests cover concept operations, planning journeys, session permissions, proposal eligibility, participant-restricted operations, cancellation, and completion. In particular, proposal validation rejects both a disconnected user with matching interest and a connected user who has not independently saved the activity. Local tests do not alone establish deployment persistence, every mobile interaction, or successful native capture. These remain distinct from verified local behavior.

The final design keeps the product's central distinction intact: intention is lightweight and personal; a plan is explicit and mutual.
