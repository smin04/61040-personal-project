# Concept Design

The design uses four core concepts:

1. [`Resolving`](#concept-resolving-reference) — determines when external references represent the same underlying activity.
2. [`Intending`](#concept-intending-user-item) — stores weak willingness independently of planning.
3. [`Connecting`](#concept-connecting-user) — defines the trusted social relationships in which shared intentions can be revealed.
4. [`Planning`](#concept-planning-user-item) — turns compatible intentions into actual commitment.

---

## Concept: Resolving [Reference]

### Purpose

Associate external references with stable items so that different representations of the same real-world activity can participate in the same later actions.

### Operational Principle

When a reference is first encountered, it is associated with an item. If another reference is later determined to denote the same thing, both references are associated with the same item.

```text
concept Resolving [Reference]

purpose
  associate external references with stable items so that different
  representations of the same thing can be treated as the same item

principle
  when a reference is first encountered, it is resolved to an item;
  references determined to describe the same thing share that item
```

### State

```text
state
  a set of Items

  a set of Resolutions with
    a reference Reference
    an item Item
    unique reference
```

### Actions

```text
resolve (
  reference: Reference
): returns (item: Item)

  where
    reference has no resolution
  then
    create a new item
    associate reference with item
    return item
```

```text
associate (
  reference: Reference,
  item: Item
)

  where
    item exists
  then
    associate reference with item,
    replacing any previous association
```

```text
merge (
  first: Item,
  second: Item
): returns (item: Item)

  where
    first != second
  then
    associate all references from first and second
    with one resulting item
    remove the redundant item
    return item
```

### Application Role

A TikTok URL, Instagram URL, webpage, or manually entered reference can all instantiate `Reference`.

The system may use URL normalization, page metadata, or optional extraction logic to suggest that two references represent the same item.

If automatic recognition is uncertain, the application should prefer leaving activities separate rather than falsely merging them.

---

## Concept: Intending [User, Item]

### Purpose

Preserve a user's genuine willingness to do something without forcing that interest into a plan.

### Operational Principle

A user can express that they would do an item. The intention remains active until withdrawn, regardless of whether a date or participant has been chosen.

```text
concept Intending [User, Item]

purpose
  preserve weak willingness without prematurely requiring coordination

principle
  a user expresses willingness toward an item;
  that willingness remains available until the user withdraws it
```

### State

```text
state
  a set of Intentions with
    a user User
    an item Item
    unique user and item
```

### Actions

```text
express (
  user: User,
  item: Item
): returns (intention: Intention)

  where
    no intention exists for user and item
  then
    create intention
    return intention
```

```text
withdraw (
  intention: Intention
)

  where
    intention exists
  then
    remove intention
```

### Queries

```text
_has (
  user: User,
  item: Item
): returns (result: Boolean)

  return true exactly when an intention exists
  for the given user and item
```

```text
_shared (
  users: set User
): returns (items: set Item)

  return every item for which at least two
  given users have active intentions
```

### Application Role

`Item` is generic. In WeShould, it is instantiated with the items produced by `Resolving`.

`Intending` contains no:

- dates,
- invited users,
- reservations,
- messages,
- scheduling information.

Those would collapse “I'd go” into planning.

Avoiding that conflation is the central design decision of WeShould.

---

## Concept: Connecting [User]

### Purpose

Establish reciprocal relationships within which socially sensitive overlap can be revealed.

### Operational Principle

One user requests a connection. If the other accepts the relationship persists until either user disconnects.

```text
concept Connecting [User]

purpose
  establish reciprocal relationships within which socially sensitive
  information can be composed

principle
  one user requests a connection with another;
  if the other accepts, the connection persists until either removes it
```

### State

```text
state
  a set of Requests with
    a requester User
    a recipient User
    unique requester and recipient

  a set of Connections with
    members set User

  each connection contains exactly two distinct users
  at most one connection exists for the same pair of users
```

### Actions

```text
request (
  requester: User,
  recipient: User
): returns (request: Request)

  where
    requester != recipient
    and requester and recipient are not already connected
    and no request already exists from requester to recipient
  then
    create request
    return request
```

```text
accept (
  recipient: User,
  request: Request
): returns (connection: Connection)

  where
    request exists
    and recipient is the recipient of request
  then
    remove request
    create connection containing requester and recipient
    return connection
```

```text
decline (
  recipient: User,
  request: Request
)

  where
    request exists
    and recipient is the recipient of request
  then
    remove request
```

```text
disconnect (
  user: User,
  connection: Connection
)

  where
    connection exists
    and user belongs to connection
  then
    remove connection
```

### Query

```text
_connections (
  user: User
): returns (users: set User)

  return all users who share a connection with user
```

### Application Role

For the first implementation, WeShould prioritizes direct connections rather than attempting to build an open social network.

Mutual community members or MIT-wide discovery can be considered later if user testing shows that people are comfortable with broader visibility.

---

## Concept: Planning [User, Item]

### Purpose

Turn an item people would do into a concrete proposal and eventually a shared commitment.

### Operational Principle

A user proposes doing an item at a particular time with selected participants. Each participant responds independently. The proposal becomes committed when all required participants accept.

```text
concept Planning [User, Item]

purpose
  turn shared willingness into a concrete commitment

principle
  a user proposes doing an item at a particular time with selected
  participants; each participant responds independently; if all
  participants accept, the plan becomes committed
```

### Types

```text
Response = pending | accepted | declined

Status =
  proposed |
  committed |
  cancelled |
  completed
```

### State

```text
state
  a set of Plans with
    an organizer User
    an item Item
    a time String
    a participants set User
    a status Status

  a set of Responses with
    a plan Plan
    a user User
    a response Response
    unique plan and user
```

### Actions

```text
propose (
  organizer: User,
  item: Item,
  participants: set User,
  time: String
): returns (plan: Plan)

  where
    organizer is in participants
    and participants contains at least two users
  then
    create plan with status proposed
    create one response for each participant
    set organizer's response to accepted
    set every other response to pending
    return plan
```

```text
respond (
  user: User,
  plan: Plan,
  response: Response
)

  where
    plan exists
    and plan.status = proposed
    and user belongs to plan.participants
    and response is accepted or declined
  then
    replace user's response for plan
```

```text
commit (
  plan: Plan
)

  where
    plan exists
    and plan.status = proposed
    and every participant's response is accepted
  then
    set plan.status to committed
```

```text
cancel (
  user: User,
  plan: Plan
)

  where
    plan exists
    and user belongs to plan.participants
    and plan.status is proposed or committed
  then
    set plan.status to cancelled
```

```text
complete (
  plan: Plan
)

  where
    plan exists
    and plan.status = committed
  then
    set plan.status to completed
```

### Application Role

`Planning.Item` is instantiated with items produced by `Resolving`.

`Planning` does not reserve tables, sell tickets, send messages, or discover activities.

Its responsibility ends at establishing shared commitment.

---

# Essential Reactions

## 1. Share Something and Say “I'd Go”

The application's lowest-friction interaction begins outside the main application.

```text
when
  the user shares reference r to WeShould

then
  if r already has a resolution
    item := the existing resolved item
  else
    item := Resolving.resolve(r)

  Intending.express(user, item)
```

In the UI, these operations appear as a single experience:

```text
Share → WeShould → I'd Go
```

Automatic metadata extraction may populate a preview before the user presses **I'd Go**, but extraction failure must not prevent the reaction.

---

## 2. Discover Shared Intention

```text
when
  Intending.express(user, item)

then
  peers := Connecting._connections(user)

  for each peer in peers
    if Intending._has(peer, item)
      surface shared interest between user and peer
```

No plan is created.

A match communicates:

> **We both would.**

It does **not** imply:

> **We have agreed to go.**

---

## 3. Turn Overlap Into a Proposal

```text
when
  user chooses "Make a Plan"
  for item and selected matched users

then
  Planning.propose(
    user,
    item,
    selected matched users + user,
    chosen time
  )
```

Planning begins only after a user actively chooses to escalate an intention.

---

## 4. Commit When Everyone Agrees

```text
when
  Planning.respond(user, plan, accepted)

and
  every participant response for plan is accepted

then
  Planning.commit(plan)
```

Commitment is produced by the participants' responses rather than by the organizer declaring that a plan exists.

---

## 5. Completion Closes the Intention

```text
when
  Planning.complete(plan)

then
  for each participant in plan
    if an active intention exists
    for that participant and plan.item
      Intending.withdraw(that intention)
```

A canceled plan does **not** remove the underlying intention.

If Marie cannot go on Friday, she may still want to go to Wally's another week.

That distinction prevents scheduling failure from being mistaken for loss of interest.

---

# Role of the Concepts

The four concepts represent four distinct questions.

`Resolving` asks:

> **What real-world thing does this reference represent?**

`Intending` asks:

> **Would I genuinely do it?**

`Connecting` asks:

> **Whose compatible interest may appropriately be revealed to me?**

`Planning` asks:

> **Are we ready to commit to doing it at a set time?**

The user interface composes these concepts, but the concepts themselves remain independent.

- `Resolving` knows nothing about users' willingness.
- `Intending` knows nothing about TikTok, URLs, friends, dates, or scheduling.
- `Connecting` knows nothing about activities.
- `Planning` does not care whether its item is a jazz club, pottery class, restaurant, or concert.

This decomposition makes the application's unusual behavior possible.

Most existing tools collapse several questions together.

WeShould deliberately allows:

> I found something.

and:

> I would do it.

and:

> Someone else would too.

and:

> We have made a plan.

to happen at four different times.
