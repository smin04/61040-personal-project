# P2 Design and Implementation Notes

## What I Built

For P2, I focused on making the central interaction from P1 real rather than trying to implement every future feature.

The core question behind WeShould is still:

> Can software preserve weak offline intentions long enough to discover shared interest and turn that interest into commitment?

The problem I am interested in is not discovery. My friends and I already send each other restaurants, concerts, workout classes, events, and places constantly. The failure usually happens afterward. Someone says “we should do this,” everyone means it to some degree, and then the intention disappears before anyone has enough reason to coordinate.

For this implementation, I focused on one complete path:

**register → connect → save an activity → independently discover shared interest → propose a plan → accept it → commit → complete it**

Everything else was treated as secondary.

## Concept Structure

I kept the same core concept decomposition from P1:

- **Resolving** owns stable activity identities and maps external references to them.
- **Intending** records lightweight willingness toward an activity.
- **Connecting** manages reciprocal relationships between users.
- **Planning** turns willingness into an explicit proposal with participants, responses, a time, and a lifecycle.
- **Authenticating** owns accounts and credentials.
- **Sessioning** provides temporary authenticated sessions.

The application compositions connect these concepts without collapsing them into one large application object.

Protected endpoints do not accept an arbitrary acting user from the browser. They receive a session, resolve it through `Sessioning`, and use the resulting account identity for the action. The frontend can say what it wants to do, but not who it is.

## Preserving the Difference Between Interest and Commitment

One decision I wanted to preserve from P1 was that saving something should not immediately become scheduling.

When someone clicks **I’d Go**, WeShould does not ask when they want to go, who they want to invite, or whether they want to create an event. That would recreate the coordination burden at exactly the moment I am trying to avoid it.

Instead, the system preserves the weaker intention first. Only when another connected user independently expresses interest in the same activity does the stronger action, **Make a plan**, appear.

This creates three distinct states:

1. *I would personally go.*
2. *Someone I know would also go.*
3. *We have agreed to go at a specific time.*

WeShould keeps those states separate through `Intending`, the shared-intention view, and `Planning`.

## Shared Intentions Are Derived

I chose not to store a separate match object.

A shared intention exists whenever two connected users have active intentions toward the same Item. That makes it a relationship between existing state rather than a new piece of state.

This means that if a connection disappears or an intention is withdrawn, the shared-intention relation disappears automatically. There is no extra match object to synchronize or delete.

## Resolving Activities

The P1 design separated an external reference from the activity it refers to, and I kept that distinction in P2.

Initially, the MVP matched activities only by normalized URL. Testing exposed the weakness immediately: two people can easily encounter the same place or event through different links.

The current rule is conservative:

- matching normalized URLs resolve to the same Item;
- matching normalized activity names may also resolve to the same Item.

Name normalization ignores differences such as capitalization, punctuation, apostrophes, and repeated whitespace.

For example, `Wally's Cafe` and `wallys cafe` can converge even if they came from different URLs.

I intentionally did not add fuzzy or semantic name matching. Treating `Wally's Cafe` and `Wally's Cafe Jazz Night` as probably equivalent could create incorrect merges. Richer entity resolution may eventually be useful, but it is a different problem and likely needs more metadata.

Activity names and canonical references live in `Resolving` because they describe the Item itself, not a user’s intention or a particular plan.

## Planning and Commitment

A plan is created only after someone explicitly provides:

- an item,
- a time,
- and participants.

The organizer begins `ACCEPTED`, because proposing the plan already expresses agreement. Other participants begin `PENDING`.

When the final participant accepts, a reaction checks whether everyone has accepted and commits the plan.

The frontend reflects these roles directly:

- the organizer sees the proposed plan and may cancel it;
- a pending participant sees **Accept** and **Decline**;
- once all participants accept, both users see the plan as committed.

The frontend does not decide when a plan becomes committed. That remains a consequence of `Planning` state.

## Cancellation and Completion

Cancelling a plan does not remove the underlying intention.

Someone can still want to try a restaurant even if Friday at 8 PM no longer works. A failed proposal should not be treated as loss of interest.

Completion is different. Once a committed plan is marked completed, the corresponding active intentions are withdrawn because that specific “we should do this” intention has been fulfilled.

That withdrawal happens through a reaction rather than inside `Planning`, since removing an intention is not part of the Planning concept itself.

## Authentication and Access Control

For user-owned actions, the browser sends a session rather than a username.

For example, expressing an intention does not send:

`user: "Josie"`

The server resolves the session and determines the account from there.

This same pattern is used for connection actions and plan actions.

The concepts also enforce their own ownership rules. `Connecting` prevents someone other than the intended recipient from accepting a request, and `Planning` prevents nonparticipants from responding to or cancelling a plan.

## P2 Capture Flow

The final version of WeShould should capture activities from the environment where they are already discovered.

If I see a restaurant or event on TikTok or Instagram, I want to be able to share it directly into WeShould, tap **I’d Go**, and immediately return to what I was doing.

P2 does not implement that interaction.

For this milestone, users manually enter:

- an activity name;
- a URL.

I made that tradeoff deliberately. The important thing to validate in P2 is what happens after an activity enters WeShould: resolving it, preserving intention, discovering overlap, and turning that overlap into a plan.

The manual form is therefore a temporary capture boundary rather than the intended final interaction.

## Frontend and Live Updates

The frontend is organized around the three main stages of the product:

- things I would go to;
- things a connection and I would both go to;
- things that have become plans.

A shared activity can move directly into planning without exposing internal Item IDs or asking the user to manually specify participants.

The app also refreshes home state periodically in the background so changes made in another browser session appear without a hard page refresh. This keeps the two-user flow feeling like one application rather than a collection of forms.

## What Changed During Implementation

Several implementation issues exposed useful design problems.

### Internal IDs in the interface

The first working version persisted intentions correctly but displayed internal Item IDs instead of useful activity information.

Rather than patching that in the frontend, I extended `Resolving` so the concept that owns Item identity also owns its human-readable metadata.

### Different links for the same activity

URL-only matching was too brittle. The current normalized-name rule allows different links to converge while avoiding broad fuzzy matching.

### Plan controls depended on user role

The first UI rendered **Accept** and **Decline** for every proposed plan, including the organizer.

The underlying Planning state was correct, but the home representation did not include enough information for the frontend to distinguish organizer from invitee. I added the organizer and current user’s response to the read model instead of hiding buttons using frontend assumptions.

### Completion reaction behavior

Completion originally produced a conflicting success/refusal path in one version of the composition.

The completion reaction now checks that the corresponding intention is still active before withdrawing it. This keeps the reaction aligned with the state it actually intends to change.

## Testing and Validation

I tested each concept independently against MongoDB before relying on cross-concept behavior.

The concept tests cover:

- connection request, acceptance, decline, and disconnection;
- authorization failures for connection actions;
- expressing and withdrawing intentions;
- duplicate active intentions;
- URL normalization and reference association;
- normalized-name activity merging;
- avoiding incorrect merges for meaningfully different names;
- plan creation and participant validation;
- plan responses;
- commitment only after all participants accept;
- cancellation and completion;
- authentication and invalid credentials.

The full concept suite passes.

I also added an automated composition-level test for the main user journey:

1. register two users;
2. connect them;
3. independently save the same activity through different references;
4. observe a shared intention;
5. propose a plan;
6. accept it from the second account;
7. observe the plan become committed;
8. complete the plan;
9. verify the corresponding intentions are withdrawn.

This test exercises the actual assembled application through its public endpoints rather than calling the concepts directly.

I also manually tested the same flow in two separate browser sessions.

## What I Deliberately Did Not Build

I did not add:

- messaging;
- a recommendation feed;
- restaurant or event search;
- reservations or ticket purchasing;
- automatic scheduling;
- broader social-graph discovery;
- fuzzy or LLM-based entity resolution;
- an iOS Share Extension;
- direct TikTok or Instagram integration.

These are plausible future features, but they are not necessary to test the core idea.

WeShould is not meant to become another discovery feed. The interesting part starts after discovery, when a real but low-commitment intention would otherwise disappear.

## Moving Toward P3

The biggest next step is the capture experience.

Instead of manually entering a name and URL, I want WeShould to sit directly in the sharing flow of the applications where these intentions already form.

The P2 interaction:

**find something → open WeShould → enter information → save**

should eventually become closer to:

**find something → “I’d Go” → keep scrolling**

I would also revisit activity resolution with richer metadata so the system can distinguish venues, recurring events, specific performances, and multiple references to the same activity more intelligently.

The rest of the interaction should remain intentionally restrained.

The goal is not to make people schedule more things at the moment of discovery. It is to preserve a genuine but low-commitment intention until there is finally enough shared interest for coordination to feel worth it.