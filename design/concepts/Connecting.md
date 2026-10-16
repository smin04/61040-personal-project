# Connecting

## Purpose

Establish reciprocal relationships between users so socially sensitive shared interests are revealed only between people who have explicitly connected. This prevents private intentions from being surfaced to arbitrary users.

## Principle

One user sends another user a connection request. The recipient may accept or decline it. If the request is accepted, the two users become connected until either one disconnects. A user cannot connect to themself, duplicate a connection, or accept a request intended for someone else.

## Types

```types
external User
  A person who can connect with another user.
```

## State

```state
a set of Requests with
  a requester User
  a recipient User
  unique requester and recipient

a set of Connections with
  a unique participants set of User

Rule: every Connection contains exactly two distinct users
```

## Actions

```actions
request(requester: User, recipient: User) : returns (request: Request)
  where requester is recipient
  then
    refuses CANNOT_CONNECT_SELF "A user cannot connect with themself."
  where requester and recipient are already connected
  then
    refuses ALREADY_CONNECTED "These users are already connected."
  where some request has requester and recipient
  then
    refuses REQUEST_EXISTS "A connection request already exists between these users."
  where requester and recipient are distinct, not connected, and no request exists
  then
    add a new request with requester and recipient
    returns request

accept(recipient: User, request: Request) : returns (connection: Connection)
  where request is not in Requests
  then
    refuses REQUEST_NOT_FOUND "There is no such connection request."
  where request is in Requests and recipient is not the request's recipient
  then
    refuses NOT_REQUEST_RECIPIENT "Only the recipient of a connection request may accept it."
  where request is in Requests and recipient is the request's recipient
  then
    delete request
    add a new connection whose participants are the request's requester and recipient
    returns connection

decline(recipient: User, request: Request) : returns (request: Request)
  where request is not in Requests
  then
    refuses REQUEST_NOT_FOUND "There is no such connection request."
  where request is in Requests and recipient is not the request's recipient
  then
    refuses NOT_REQUEST_RECIPIENT "Only the recipient of a connection request may decline it."
  where request is in Requests and recipient is the request's recipient
  then
    delete request
    returns request

disconnect(user: User, connection: Connection) : returns (connection: Connection)
  where connection is not in Connections
  then
    refuses CONNECTION_NOT_FOUND "There is no such connection."
  where connection is in Connections and user is not one of its participants
  then
    refuses NOT_CONNECTION_MEMBER "Only a member of a connection may remove it."
  where connection is in Connections and user is one of its participants
  then
    delete connection
    returns connection
```

## Queries

```queries
_connections(user: User) : many (connection: Connection, peer: User)
  Answers every connection containing the user and the other participant in that connection.
  Answers no rows when the user has no connections.
  Orders rows deterministically by connection.

_pendingFor(recipient: User) : many (request: Request, requester: User)
  Answers every pending request addressed to the recipient.
  Answers no rows when there are no pending requests.
  Orders rows deterministically by request.

_areConnected(first: User, second: User) : one (connected: Flag)
  Answers true exactly when a connection exists whose participants are first and second.
  Answers false otherwise.
```