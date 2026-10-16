# Intending

## Purpose

Preserve a user's genuine willingness to do something without requiring a date, invitation, or plan. This prevents low-commitment interest from disappearing simply because the user is not yet ready to coordinate.

## Principle

A user expresses that they would do an item and that intention remains active until they withdraw it. Expressing the same intention twice is refused because one active intention per user and item is sufficient.

## Types

```types
external User
  The person expressing willingness.

external Item
  The thing the person would be willing to do.
```

## State

```state
a set of Intentions with
  a user User
  an item Item
  unique user and item
```

## Actions

```actions
express(user: User, item: Item) : returns (intention: Intention)
  where no intention has user and item
  then
    add a new intention with user and item
    returns intention
  where some intention has user and item
  then
    refuses ALREADY_INTENDING "This user already has an active intention for this item."

withdraw(intention: Intention) : returns (intention: Intention)
  where intention is in Intentions
  then
    delete intention
    returns intention
  where intention is not in Intentions
  then
    refuses INTENTION_NOT_FOUND "There is no such active intention."
```

## Queries

```queries
_has(user: User, item: Item) : one (active: Flag)
  Answers true when an intention exists for the user and item.
  Answers false otherwise.

_byUser(user: User) : many (intention: Intention, item: Item)
  Answers every active intention belonging to the user.
  Answers no rows when the user has no active intentions.
  Orders rows deterministically by intention.

_forItem(item: Item) : many (intention: Intention, user: User)
  Answers every active intention for the item.
  Answers no rows when the item has no active intentions.
  Orders rows deterministically by intention.
```