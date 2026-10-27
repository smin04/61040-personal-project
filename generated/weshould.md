<!-- Generated from the WeShould assembly. Do not edit. -->
<!-- Manifest producer: @mit-sdg/sync-engine@1.1.0; concept specification: sync-engine.concept-specification@1; renderer: @mit-sdg/sync-engine@1.1.0. -->

# WeShould — assembled read-back

_Assembled by sync-engine from registered concepts and composition. Edit the concept_
_specifications and composition source, then regenerate this file._

## Concepts

### Authenticating

Defined in [Authenticating](../design/concepts/Authenticating.md), line 1.

#### Actions

- `register(username: String, password: String) : returns (account: Account)`
  - Refuses `INVALID_USERNAME`: A username must contain 3 to 32 letters, numbers, underscores, or hyphens.
  - Refuses `WEAK_PASSWORD`: A password must contain 8 to 128 characters.
  - Refuses `USERNAME_TAKEN`: That username is already registered.
- `authenticate(username: String, password: String) : returns (account: Account)`
  - Refuses `INVALID_CREDENTIALS`: The username or password is incorrect.

#### Queries

- `_registered(username: String) : one (registered: Flag)`

#### Instances

- `Authenticating` — instance of `Authenticating` — [WeShould Application Types](../design/types.md), line 19.

### Connecting

Defined in [Connecting](../design/concepts/Connecting.md), line 1.

#### Actions

- `request(requester: User, recipient: User) : returns (request: Request)`
  - Refuses `CANNOT_CONNECT_SELF`: A user cannot connect with themself.
  - Refuses `ALREADY_CONNECTED`: These users are already connected.
  - Refuses `REQUEST_EXISTS`: A connection request already exists between these users.
- `accept(recipient: User, request: Request) : returns (connection: Connection)`
  - Refuses `REQUEST_NOT_FOUND`: There is no such connection request.
  - Refuses `NOT_REQUEST_RECIPIENT`: Only the recipient of a connection request may accept it.
- `decline(recipient: User, request: Request) : returns (request: Request)`
  - Refuses `REQUEST_NOT_FOUND`: There is no such connection request.
  - Refuses `NOT_REQUEST_RECIPIENT`: Only the recipient of a connection request may decline it.
- `disconnect(user: User, connection: Connection) : returns (connection: Connection)`
  - Refuses `CONNECTION_NOT_FOUND`: There is no such connection.
  - Refuses `NOT_CONNECTION_MEMBER`: Only a member of a connection may remove it.

#### Queries

- `_connections(user: User) : many (connection: Connection, peer: User)`
- `_pendingFor(recipient: User) : many (request: Request, requester: User)`
- `_areConnected(first: User, second: User) : one (connected: Flag)`

#### Instances

- `Connecting` — instance of `Connecting` — [WeShould Application Types](../design/types.md), line 31.
  - `User` is `Authenticating.Account` — [WeShould Application Types](../design/types.md), line 32.

### Intending

Defined in [Intending](../design/concepts/Intending.md), line 1.

#### Actions

- `express(user: User, item: Item) : returns (intention: Intention)`
  - Refuses `ALREADY_INTENDING`: This user already has an active intention for this item.
- `withdraw(intention: Intention) : returns (intention: Intention)`
  - Refuses `INTENTION_NOT_FOUND`: There is no such active intention.

#### Queries

- `_has(user: User, item: Item) : one (active: Flag)`
- `_byUser(user: User) : many (intention: Intention, item: Item)`
- `_forItem(item: Item) : many (intention: Intention, user: User)`

#### Instances

- `Intending` — instance of `Intending` — [WeShould Application Types](../design/types.md), line 27.
  - `Item` is `Resolving.Item` — [WeShould Application Types](../design/types.md), line 29.
  - `User` is `Authenticating.Account` — [WeShould Application Types](../design/types.md), line 28.

### Planning

Defined in [Planning](../design/concepts/Planning.md), line 1.

#### Actions

- `propose(organizer: User, item: Item, participants: ParticipantSet, time: String) : returns (plan: Plan)`
  - Refuses `ORGANIZER_NOT_PARTICIPANT`: The organizer must be included among the participants.
  - Refuses `TOO_FEW_PARTICIPANTS`: A plan must have at least two participants.
  - Refuses `INELIGIBLE_PLAN_PARTICIPANTS`: Every participant must independently save the activity and be connected to the organizer.
- `respond(user: User, plan: Plan, response: Response) : returns ()`
  - Refuses `PLAN_NOT_FOUND`: There is no such plan.
  - Refuses `PLAN_NOT_PROPOSED`: Responses may only be changed while a plan is proposed.
  - Refuses `NOT_PARTICIPANT`: Only a participant may respond to this plan.
  - Refuses `INVALID_RESPONSE`: A participant response must be accepted or declined.
- `commit(plan: Plan) : returns ()`
  - Refuses `PLAN_NOT_FOUND`: There is no such plan.
  - Refuses `PLAN_NOT_PROPOSED`: Only a proposed plan may become committed.
  - Refuses `NOT_ALL_ACCEPTED`: Every participant must accept before the plan can be committed.
- `cancel(user: User, plan: Plan) : returns ()`
  - Refuses `PLAN_NOT_FOUND`: There is no such plan.
  - Refuses `NOT_PARTICIPANT`: Only a participant may cancel this plan.
  - Refuses `PLAN_CLOSED`: A cancelled or completed plan cannot be cancelled again.
- `complete(user: User, plan: Plan) : returns ()`
  - Refuses `PLAN_NOT_FOUND`: There is no such plan.
  - Refuses `NOT_PARTICIPANT`: Only a participant can complete this plan.
  - Refuses `PLAN_NOT_COMMITTED`: Only a committed plan may be completed.

#### Queries

- `_get(plan: Plan) : optional (organizer: User, item: Item, time: String, participants: ParticipantSet, status: Status)`
- `_responses(plan: Plan) : many (user: User, response: Response)`
- `_forUser(user: User) : many (plan: Plan, item: Item, time: String, status: Status)`
- `_allAccepted(plan: Plan) : one (accepted: Flag)`

#### Instances

- `Planning` — instance of `Planning` — [WeShould Application Types](../design/types.md), line 34.
  - `Item` is `Resolving.Item` — [WeShould Application Types](../design/types.md), line 36.
  - `User` is `Authenticating.Account` — [WeShould Application Types](../design/types.md), line 35.

### Resolving

Defined in [Resolving](../design/concepts/Resolving.md), line 1.

#### Actions

- `resolve(reference: Reference) : returns (item: Item)`
- `describe(item: Item, name: String, reference: Reference) : returns (resolved: Item)`
  - Refuses `ITEM_NOT_FOUND`: This item does not exist.
- `associate(reference: Reference, item: Item) : returns ()`
  - Refuses `ITEM_NOT_FOUND`: This item does not exist.

#### Queries

- `_item(reference: Reference) : optional (item: Item)`
- `_references(item: Item) : many (reference: Reference)`
- `_get(item: Item) : optional (name: String, reference: Reference)`

#### Instances

- `Resolving` — instance of `Resolving` — [WeShould Application Types](../design/types.md), line 24.
  - `Reference` is `ActivityReference` — [WeShould Application Types](../design/types.md), line 25.

### Sessioning

Defined in [Sessioning](../design/concepts/Sessioning.md), line 1.

#### Actions

- `start(subject: Subject) : returns (session: Session, expiresAt: DateTime)`
- `current(session: Session) : returns (subject: Subject)`
  - Refuses `UNKNOWN_SESSION`: This session is not active.
- `end(session: Session) : returns (ended: Flag)`
  - Refuses `UNKNOWN_SESSION`: This session is not active.

#### Queries

- `_active(session: Session) : optional (subject: Subject, expiresAt: DateTime)`

#### Instances

- `Sessioning` — instance of `Sessioning` — [WeShould Application Types](../design/types.md), line 21.
  - `Subject` is `Authenticating.Account` — [WeShould Application Types](../design/types.md), line 22.

## Application types

Concrete types:

- `ActivityReference` — [WeShould Application Types](../design/types.md), line 12.

## Views

_Views name reusable conditions. Multiple `where` blocks are alternatives._

### shared intentions for (user)

Authored path: `WeShould.SharedIntentions.SharedIntentions`.
- Covered by [WeShould](../design/compositions/WeShould.md), line 5.

```view
shared intentions for (user) — inputs (user); outputs (peer, item); bindings () — answers any number of (peer, item)
  where
    Connecting._connections (user) has (peer)
    Intending._byUser (user) has (item)
    Intending._has (item, user: peer) has (active: true)
```

## Formers

_Formers name result shapes evaluated when asked. The source former owns_
_the authored explanation; this section records the generated shape._

### the home state for (user)

Authored path: `Application.Home.Home`.
- Covered by [Application](../design/compositions/Application.md), line 31.

```former
Former "the home state for (user)" — inputs (user); bindings (connection, peer, request, requester, intention, intentionItem, intentionName, intentionReference, sharedPeer, sharedItem, sharedName, sharedReference, plan, planItem, planName, planReference, planOrganizer, planParticipants, planResponse, time, status); promises exactly one record — forms:
  a record of
    connections: each Connecting._connections (user) has (connection, peer)
      form a record of
        connection
        peer
    intentions: each Intending._byUser (user) has (intention, item: intentionItem)
      where Resolving._get (item: intentionItem) has (name: intentionName, reference: intentionReference)
      form a record of
        intention
        item: intentionItem
        name: intentionName
        reference: intentionReference
    pendingRequests: each Connecting._pendingFor (recipient: user) has (request, requester)
      form a record of
        request
        requester
    plans: each Planning._forUser (user) has (item: planItem, plan, status, time)
      where Planning._get (plan) has (organizer: planOrganizer, participants: planParticipants)
      where Planning._responses (plan) has (response: planResponse, user)
      where Resolving._get (item: planItem) has (name: planName, reference: planReference)
      form a record of
        item: planItem
        name: planName
        organizer: planOrganizer
        participants: planParticipants
        plan
        reference: planReference
        response: planResponse
        status
        time
    sharedIntentions: each view "shared intentions for (user)" with (user) has (item: sharedItem, peer: sharedPeer)
      where Resolving._get (item: sharedItem) has (name: sharedName, reference: sharedReference)
      form a record of
        item: sharedItem
        name: sharedName
        peer: sharedPeer
        reference: sharedReference
```

## Reactions

### Application.Connections.AcceptConnection

Authored path: `Application.Connections.AcceptConnection`.
- Covered by [Application](../design/compositions/Application.md), line 5.
- Covered by [Application](../design/compositions/Application.md), line 9.

```reaction
when RequestBoundary.request (path: "/connections/accept", request, requestId, session)
then
  Sessioning.current (session)
```

### Application.Connections.AcceptConnection#2

Authored path: `Application.Connections.AcceptConnection`.
- Covered by [Application](../design/compositions/Application.md), line 5.
- Covered by [Application](../design/compositions/Application.md), line 9.

```reaction
when Sessioning.current (session, subject: recipient), asked by Application.Connections.AcceptConnection
where
  earlier, RequestBoundary.request (path: "/connections/accept", request, requestId, session)
then
  Connecting.accept (recipient, request)
```

### Application.Connections.AcceptConnection#3

Authored path: `Application.Connections.AcceptConnection`.
- Covered by [Application](../design/compositions/Application.md), line 5.
- Covered by [Application](../design/compositions/Application.md), line 9.

```reaction
when Connecting.accept (recipient, request, connection), asked by Application.Connections.AcceptConnection#2
where
  earlier, RequestBoundary.request (path: "/connections/accept", request, requestId, session)
then
  RequestBoundary.respond (id: connection, requestId)
```

### Application.Connections.DeclineConnection

Authored path: `Application.Connections.DeclineConnection`.
- Covered by [Application](../design/compositions/Application.md), line 5.
- Covered by [Application](../design/compositions/Application.md), line 10.

```reaction
when RequestBoundary.request (path: "/connections/decline", request, requestId, session)
then
  Sessioning.current (session)
```

### Application.Connections.DeclineConnection#2

Authored path: `Application.Connections.DeclineConnection`.
- Covered by [Application](../design/compositions/Application.md), line 5.
- Covered by [Application](../design/compositions/Application.md), line 10.

```reaction
when Sessioning.current (session, subject: recipient), asked by Application.Connections.DeclineConnection
where
  earlier, RequestBoundary.request (path: "/connections/decline", request, requestId, session)
then
  Connecting.decline (recipient, request)
```

### Application.Connections.DeclineConnection#3

Authored path: `Application.Connections.DeclineConnection`.
- Covered by [Application](../design/compositions/Application.md), line 5.
- Covered by [Application](../design/compositions/Application.md), line 10.

```reaction
when Connecting.decline (recipient, request, result.request: declinedRequest), asked by Application.Connections.DeclineConnection#2
where
  earlier, RequestBoundary.request (path: "/connections/decline", request, requestId, session)
then
  RequestBoundary.respond (id: declinedRequest, requestId)
```

### Application.Connections.Disconnect

Authored path: `Application.Connections.Disconnect`.
- Covered by [Application](../design/compositions/Application.md), line 5.
- Covered by [Application](../design/compositions/Application.md), line 11.

```reaction
when RequestBoundary.request (connection, path: "/connections/disconnect", requestId, session)
then
  Sessioning.current (session)
```

### Application.Connections.Disconnect#2

Authored path: `Application.Connections.Disconnect`.
- Covered by [Application](../design/compositions/Application.md), line 5.
- Covered by [Application](../design/compositions/Application.md), line 11.

```reaction
when Sessioning.current (session, subject: user), asked by Application.Connections.Disconnect
where
  earlier, RequestBoundary.request (connection, path: "/connections/disconnect", requestId, session)
then
  Connecting.disconnect (connection, user)
```

### Application.Connections.Disconnect#3

Authored path: `Application.Connections.Disconnect`.
- Covered by [Application](../design/compositions/Application.md), line 5.
- Covered by [Application](../design/compositions/Application.md), line 11.

```reaction
when Connecting.disconnect (connection, user, result.connection: disconnected), asked by Application.Connections.Disconnect#2
where
  earlier, RequestBoundary.request (connection, path: "/connections/disconnect", requestId, session)
then
  RequestBoundary.respond (id: disconnected, requestId)
```

### Application.Connections.RequestConnection

Authored path: `Application.Connections.RequestConnection`.
- Covered by [Application](../design/compositions/Application.md), line 5.
- Covered by [Application](../design/compositions/Application.md), line 8.

```reaction
when RequestBoundary.request (path: "/connections/request", recipient, requestId, session)
then
  Sessioning.current (session)
```

### Application.Connections.RequestConnection#2

Authored path: `Application.Connections.RequestConnection`.
- Covered by [Application](../design/compositions/Application.md), line 5.
- Covered by [Application](../design/compositions/Application.md), line 8.

```reaction
when Sessioning.current (session, subject: requester), asked by Application.Connections.RequestConnection
where
  earlier, RequestBoundary.request (path: "/connections/request", recipient, requestId, session)
then
  Connecting.request (recipient, requester)
```

### Application.Connections.RequestConnection#3

Authored path: `Application.Connections.RequestConnection`.
- Covered by [Application](../design/compositions/Application.md), line 5.
- Covered by [Application](../design/compositions/Application.md), line 8.

```reaction
when Connecting.request (recipient, requester, request), asked by Application.Connections.RequestConnection#2
where
  earlier, RequestBoundary.request (path: "/connections/request", recipient, requestId, session)
then
  RequestBoundary.respond (id: request, requestId)
```

### Application.Home.GetHome

Authored path: `Application.Home.GetHome`.
- Covered by [Application](../design/compositions/Application.md), line 31.
- Covered by [Application](../design/compositions/Application.md), line 34.

```reaction
when RequestBoundary.request (path: "/home", requestId, session)
then
  Sessioning.current (session)
```

### Application.Home.GetHome#2

Authored path: `Application.Home.GetHome`.
- Covered by [Application](../design/compositions/Application.md), line 31.
- Covered by [Application](../design/compositions/Application.md), line 34.

```reaction
when Sessioning.current (session, subject: user), asked by Application.Home.GetHome
where
  earlier, RequestBoundary.request (path: "/home", requestId, session)
then
  RequestBoundary.respond (home: former "the home state for (user)" with (user), requestId)
```

### Application.Intentions.ExpressIntention

Authored path: `Application.Intentions.ExpressIntention`.
- Covered by [Application](../design/compositions/Application.md), line 14.
- Covered by [Application](../design/compositions/Application.md), line 17.

```reaction
when RequestBoundary.request (name, path: "/intentions/express", reference, requestId, session)
then
  Sessioning.current (session)
```

### Application.Intentions.ExpressIntention#2

Authored path: `Application.Intentions.ExpressIntention`.
- Covered by [Application](../design/compositions/Application.md), line 14.
- Covered by [Application](../design/compositions/Application.md), line 17.

```reaction
when Sessioning.current (session, subject: user), asked by Application.Intentions.ExpressIntention
where
  earlier, RequestBoundary.request (name, path: "/intentions/express", reference, requestId, session)
then
  Resolving.resolve (reference)
```

### Application.Intentions.ExpressIntention#3

Authored path: `Application.Intentions.ExpressIntention`.
- Covered by [Application](../design/compositions/Application.md), line 14.
- Covered by [Application](../design/compositions/Application.md), line 17.

```reaction
when Resolving.resolve (reference, item), asked by Application.Intentions.ExpressIntention#2
where
  earlier, RequestBoundary.request (name, path: "/intentions/express", reference, requestId, session)
then
  Resolving.describe (item, name, reference)
```

### Application.Intentions.ExpressIntention#4

Authored path: `Application.Intentions.ExpressIntention`.
- Covered by [Application](../design/compositions/Application.md), line 14.
- Covered by [Application](../design/compositions/Application.md), line 17.

```reaction
when Resolving.describe (item, name, reference, resolved: describedItem), asked by Application.Intentions.ExpressIntention#3
where
  earlier, Sessioning.current (session, subject: user), asked by Application.Intentions.ExpressIntention
then
  Intending.express (item: describedItem, user)
```

### Application.Intentions.ExpressIntention#5

Authored path: `Application.Intentions.ExpressIntention`.
- Covered by [Application](../design/compositions/Application.md), line 14.
- Covered by [Application](../design/compositions/Application.md), line 17.

```reaction
when Intending.express (item: describedItem, user, intention), asked by Application.Intentions.ExpressIntention#4
where
  earlier, RequestBoundary.request (name, path: "/intentions/express", reference, requestId, session)
then
  RequestBoundary.respond (id: intention, requestId)
```

### Application.Plans.CancelPlan

Authored path: `Application.Plans.CancelPlan`.
- Covered by [Application](../design/compositions/Application.md), line 22.
- Covered by [Application](../design/compositions/Application.md), line 27.

```reaction
when RequestBoundary.request (path: "/plans/cancel", plan, requestId, session)
then
  Sessioning.current (session)
```

### Application.Plans.CancelPlan#2

Authored path: `Application.Plans.CancelPlan`.
- Covered by [Application](../design/compositions/Application.md), line 22.
- Covered by [Application](../design/compositions/Application.md), line 27.

```reaction
when Sessioning.current (session, subject: user), asked by Application.Plans.CancelPlan
where
  earlier, RequestBoundary.request (path: "/plans/cancel", plan, requestId, session)
then
  Planning.cancel (plan, user)
```

### Application.Plans.CancelPlan#3

Authored path: `Application.Plans.CancelPlan`.
- Covered by [Application](../design/compositions/Application.md), line 22.
- Covered by [Application](../design/compositions/Application.md), line 27.

```reaction
when Planning.cancel (plan, user), asked by Application.Plans.CancelPlan#2
where
  earlier, RequestBoundary.request (path: "/plans/cancel", plan, requestId, session)
then
  RequestBoundary.respond (id: plan, requestId)
```

### Application.Plans.CompletePlan

Authored path: `Application.Plans.CompletePlan`.
- Covered by [Application](../design/compositions/Application.md), line 22.
- Covered by [Application](../design/compositions/Application.md), line 28.

```reaction
when RequestBoundary.request (path: "/plans/complete", plan, requestId, session)
then
  Sessioning.current (session)
```

### Application.Plans.CompletePlan#2

Authored path: `Application.Plans.CompletePlan`.
- Covered by [Application](../design/compositions/Application.md), line 22.
- Covered by [Application](../design/compositions/Application.md), line 28.

```reaction
when Sessioning.current (session, subject: user), asked by Application.Plans.CompletePlan
where
  earlier, RequestBoundary.request (path: "/plans/complete", plan, requestId, session)
then
  Planning.complete (plan, user)
```

### Application.Plans.CompletePlan#3

Authored path: `Application.Plans.CompletePlan`.
- Covered by [Application](../design/compositions/Application.md), line 22.
- Covered by [Application](../design/compositions/Application.md), line 28.

```reaction
when Planning.complete (plan, user), asked by Application.Plans.CompletePlan#2
where
  earlier, RequestBoundary.request (path: "/plans/complete", plan, requestId, session)
then
  RequestBoundary.respond (id: plan, requestId)
```

### Application.Plans.ProposePlan

Authored path: `Application.Plans.ProposePlan`.
- Covered by [Application](../design/compositions/Application.md), line 20.
- Covered by [Application](../design/compositions/Application.md), line 25.

```reaction
when RequestBoundary.request (item, participants, path: "/plans/propose", requestId, session, time)
then
  Sessioning.current (session)
```

### Application.Plans.ProposePlan#2

Authored path: `Application.Plans.ProposePlan`.
- Covered by [Application](../design/compositions/Application.md), line 20.
- Covered by [Application](../design/compositions/Application.md), line 25.

```reaction
when Sessioning.current (session, subject: organizer), asked by Application.Plans.ProposePlan
where
  earlier, RequestBoundary.request (item, participants, path: "/plans/propose", requestId, session, time)
then
  Planning.propose (item, organizer, participants, time)
```

### Application.Plans.ProposePlan#3

Authored path: `Application.Plans.ProposePlan`.
- Covered by [Application](../design/compositions/Application.md), line 20.
- Covered by [Application](../design/compositions/Application.md), line 25.

```reaction
when Planning.propose (item, organizer, participants, time, plan), asked by Application.Plans.ProposePlan#2
where
  earlier, RequestBoundary.request (item, participants, path: "/plans/propose", requestId, session, time)
then
  RequestBoundary.respond (id: plan, requestId)
```

### Application.Plans.RespondToPlan

Authored path: `Application.Plans.RespondToPlan`.
- Covered by [Application](../design/compositions/Application.md), line 20.
- Covered by [Application](../design/compositions/Application.md), line 26.

```reaction
when RequestBoundary.request (path: "/plans/respond", plan, requestId, response, session)
then
  Sessioning.current (session)
```

### Application.Plans.RespondToPlan#2

Authored path: `Application.Plans.RespondToPlan`.
- Covered by [Application](../design/compositions/Application.md), line 20.
- Covered by [Application](../design/compositions/Application.md), line 26.

```reaction
when Sessioning.current (session, subject: user), asked by Application.Plans.RespondToPlan
where
  earlier, RequestBoundary.request (path: "/plans/respond", plan, requestId, response, session)
then
  Planning.respond (plan, response, user)
```

### Application.Plans.RespondToPlan#3

Authored path: `Application.Plans.RespondToPlan`.
- Covered by [Application](../design/compositions/Application.md), line 20.
- Covered by [Application](../design/compositions/Application.md), line 26.

```reaction
when Planning.respond (plan, response, user), asked by Application.Plans.RespondToPlan#2
where
  earlier, RequestBoundary.request (path: "/plans/respond", plan, requestId, response, session)
then
  RequestBoundary.respond (id: plan, requestId)
```

### DeliverFaultToAsker

```reaction
when any action is faulted, not asked by DeliverFaultToAsker
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respondFramework (error: "INTERNAL_ERROR", requestId)
```

### DeliverRefusalToAsker

```reaction
when any action is refused (message), except RequestBoundary
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respond (error: message, requestId)
```

### Sessions.CurrentAccount.CurrentUser

Authored path: `Sessions.CurrentAccount.CurrentUser`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 12.
- Covered by [Sessions](../design/compositions/Sessions.md), line 15.

```reaction
when RequestBoundary.request (path: "/auth/current", requestId, session)
then
  Sessioning.current (session)
```

### Sessions.CurrentAccount.CurrentUser#2

Authored path: `Sessions.CurrentAccount.CurrentUser`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 12.
- Covered by [Sessions](../design/compositions/Sessions.md), line 15.

```reaction
when Sessioning.current (session, subject: username), asked by Sessions.CurrentAccount.CurrentUser
where
  earlier, RequestBoundary.request (path: "/auth/current", requestId, session)
then
  RequestBoundary.respond (requestId, username)
```

### Sessions.EnteringApplication.Register

Authored path: `Sessions.EnteringApplication.Register`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 5.
- Covered by [Sessions](../design/compositions/Sessions.md), line 8.

```reaction
when RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  Authenticating.register (password, username)
```

### Sessions.EnteringApplication.Register#2

Authored path: `Sessions.EnteringApplication.Register`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 5.
- Covered by [Sessions](../design/compositions/Sessions.md), line 8.

```reaction
when Authenticating.register (password, username, account), asked by Sessions.EnteringApplication.Register
then
  Sessioning.start (subject: account)
```

### Sessions.EnteringApplication.Register#3

Authored path: `Sessions.EnteringApplication.Register`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 5.
- Covered by [Sessions](../design/compositions/Sessions.md), line 8.

```reaction
when Sessioning.start (subject: account, expiresAt, session), asked by Sessions.EnteringApplication.Register#2
where
  earlier, RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  RequestBoundary.respond (account, expiresAt, requestId, session)
```

### Sessions.EnteringApplication.SignIn

Authored path: `Sessions.EnteringApplication.SignIn`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 5.
- Covered by [Sessions](../design/compositions/Sessions.md), line 9.

```reaction
when RequestBoundary.request (password, path: "/auth/sign-in", requestId, username)
then
  Authenticating.authenticate (password, username)
```

### Sessions.EnteringApplication.SignIn#2

Authored path: `Sessions.EnteringApplication.SignIn`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 5.
- Covered by [Sessions](../design/compositions/Sessions.md), line 9.

```reaction
when Authenticating.authenticate (password, username, account), asked by Sessions.EnteringApplication.SignIn
then
  Sessioning.start (subject: account)
```

### Sessions.EnteringApplication.SignIn#3

Authored path: `Sessions.EnteringApplication.SignIn`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 5.
- Covered by [Sessions](../design/compositions/Sessions.md), line 9.

```reaction
when Sessioning.start (subject: account, expiresAt, session), asked by Sessions.EnteringApplication.SignIn#2
where
  earlier, RequestBoundary.request (password, path: "/auth/sign-in", requestId, username)
then
  RequestBoundary.respond (account, expiresAt, requestId, session)
```

### Sessions.LeavingApplication.SignOut

Authored path: `Sessions.LeavingApplication.SignOut`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 18.
- Covered by [Sessions](../design/compositions/Sessions.md), line 21.

```reaction
when RequestBoundary.request (path: "/auth/sign-out", requestId, session)
then
  Sessioning.end (session)
```

### Sessions.LeavingApplication.SignOut#2

Authored path: `Sessions.LeavingApplication.SignOut`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 18.
- Covered by [Sessions](../design/compositions/Sessions.md), line 21.

```reaction
when Sessioning.end (session, ended: signedOut), asked by Sessions.LeavingApplication.SignOut
where
  earlier, RequestBoundary.request (path: "/auth/sign-out", requestId, session)
then
  RequestBoundary.respond (requestId, signedOut)
```

### WeShould.Planning.AcceptanceCommitsPlan

Authored path: `WeShould.Planning.AcceptanceCommitsPlan`.
- Covered by [WeShould](../design/compositions/WeShould.md), line 7.

```reaction
when Planning.respond (plan, response: "ACCEPTED")
where
  Planning._allAccepted (plan) has (accepted: true)
then
  Planning.commit (plan)
```

### WeShould.Planning.CompletionWithdrawsIntentions

Authored path: `WeShould.Planning.CompletionWithdrawsIntentions`.
- Covered by [WeShould](../design/compositions/WeShould.md), line 9.

```reaction
when Planning.complete (plan)
where
  Planning._get (plan) has (item)
  Planning._responses (plan) has (user)
  Intending._has (item, user) has (active: true)
  Intending._byUser (user) has (intention, item)
then
  Intending.withdraw (intention)
```

## Endpoint input contracts

Before recording an action ask, the boundary rejects a body that is not an
object or lacks a required key. The response uses `INVALID_INPUT` and names
the path or missing key. A declared default fills an absent key. Endpoints
not listed here have no explicit input contract.

- `/auth/current` — requires `session`
- `/auth/register` — requires `username`, `password`
- `/auth/sign-in` — requires `username`, `password`
- `/auth/sign-out` — requires `session`
- `/connections/accept` — requires `session`, `request`
- `/connections/decline` — requires `session`, `request`
- `/connections/disconnect` — requires `session`, `connection`
- `/connections/request` — requires `session`, `recipient`
- `/home` — requires `session`
- `/intentions/express` — requires `session`, `name`, `reference`
- `/plans/cancel` — requires `session`, `plan`
- `/plans/complete` — requires `session`, `plan`
- `/plans/propose` — requires `session`, `item`, `participants`, `time`
- `/plans/respond` — requires `session`, `plan`, `response`
