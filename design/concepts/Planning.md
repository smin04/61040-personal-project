# Planning

## Purpose

Turn willingness toward an item into a concrete proposal and eventually a shared commitment. This prevents lightweight willingness from being mistaken for an agreed plan.

## Principle

An organizer proposes an item, time, and participants. The organizer is initially accepted while the other participants are pending. Each participant may accept or decline. A proposed plan becomes committed once every participant has accepted. A proposed or committed plan may be cancelled, and a committed plan may later be marked completed.

## Types

```types
external User
  A person participating in a plan.

external Item
  The thing participants plan to do.

opaque ParticipantSet
  A collection of distinct users participating in a plan.

Response is PENDING or ACCEPTED or DECLINED
  The response a participant has made to a proposal.

Status is PROPOSED or COMMITTED or CANCELLED or COMPLETED
  The lifecycle state of a plan.
```

## State

```state
a set of Plans with
  an organizer User
  an item Item
  a time String
  a participants set of User
  a status Status

a set of Responses with
  a plan Plan
  a user User
  a response Response
  unique plan and user

Rule: every Plan has at least two distinct participants
Rule: every Plan's organizer is one of its participants
Rule: every participant in a Plan has exactly one Response for that Plan
```

## Actions

```actions
propose(organizer: User, item: Item, participants: ParticipantSet, time: String) : returns (plan: Plan)
  where organizer is not in participants
  then
    refuses ORGANIZER_NOT_PARTICIPANT "The organizer must be included among the participants."
  where participants contains fewer than two distinct users
  then
    refuses TOO_FEW_PARTICIPANTS "A plan must have at least two participants."
  where an optional application-provided eligibility check rejects the proposed participants
  then
    refuses INELIGIBLE_PLAN_PARTICIPANTS "Every participant must independently save the activity and be connected to the organizer."
  where organizer is in participants and participants contains at least two distinct users
  then
    add a new plan with organizer, item, time, participants, and status PROPOSED
    add one response for each participant
    set the organizer's response to ACCEPTED
    set every other participant's response to PENDING
    returns plan

respond(user: User, plan: Plan, response: Response) : returns ()
  where plan is not in Plans
  then
    refuses PLAN_NOT_FOUND "There is no such plan."
  where plan is in Plans and plan's status is not PROPOSED
  then
    refuses PLAN_NOT_PROPOSED "Responses may only be changed while a plan is proposed."
  where plan is in Plans and user is not one of plan's participants
  then
    refuses NOT_PARTICIPANT "Only a participant may respond to this plan."
  where plan is in Plans and response is PENDING
  then
    refuses INVALID_RESPONSE "A participant response must be accepted or declined."
  where plan is in Plans and plan's status is PROPOSED and user is a participant and response is ACCEPTED or DECLINED
  then
    replace the user's response for the plan with response
    returns

commit(plan: Plan) : returns ()
  where plan is not in Plans
  then
    refuses PLAN_NOT_FOUND "There is no such plan."
  where plan is in Plans and plan's status is not PROPOSED
  then
    refuses PLAN_NOT_PROPOSED "Only a proposed plan may become committed."
  where plan is proposed and some participant has not accepted
  then
    refuses NOT_ALL_ACCEPTED "Every participant must accept before the plan can be committed."
  where plan is proposed and every participant has accepted
  then
    set plan's status to COMMITTED
    returns

cancel(user: User, plan: Plan) : returns ()
  where plan is not in Plans
  then
    refuses PLAN_NOT_FOUND "There is no such plan."
  where plan is in Plans and user is not one of plan's participants
  then
    refuses NOT_PARTICIPANT "Only a participant may cancel this plan."
  where plan's status is CANCELLED or COMPLETED
  then
    refuses PLAN_CLOSED "A cancelled or completed plan cannot be cancelled again."
  where user is a participant and plan's status is PROPOSED or COMMITTED
  then
    set plan's status to CANCELLED
    returns

complete(user: User, plan: Plan) : returns ()
  where plan is not in Plans
  then
    refuses PLAN_NOT_FOUND "There is no such plan."
  where plan is in Plans and user is not a participant
  then
    refuses NOT_PARTICIPANT "Only a participant can complete this plan."
  where plan is in Plans and plan's status is not COMMITTED
  then
    refuses PLAN_NOT_COMMITTED "Only a committed plan may be completed."
  where plan is in Plans and plan's status is COMMITTED
  then
    set plan's status to COMPLETED
    returns
```

## Queries

```queries
_get(plan: Plan) : optional (organizer: User, item: Item, time: String, participants: ParticipantSet, status: Status)
  Answers the plan's current state.
  Answers no row for an unknown plan.

_responses(plan: Plan) : many (user: User, response: Response)
  Answers every participant response for the plan.
  Answers no rows for an unknown plan.
  Orders rows deterministically by user.

_forUser(user: User) : many (plan: Plan, item: Item, time: String, status: Status)
  Answers every plan in which the user is a participant.
  Answers no rows when the user has no plans.
  Orders rows deterministically by plan.

_allAccepted(plan: Plan) : one (accepted: Flag)
  Answers true exactly when the plan exists and every participant response is ACCEPTED.
  Answers false otherwise.
```