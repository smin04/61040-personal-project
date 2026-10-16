# WeShould Application Types

## Overview

WeShould uses authenticated accounts as the user identity shared across sessions, connections, intentions, and plans.

External activity references are represented by normalized URLs in the MVP. `Resolving` turns those references into stable item identities.

## Application Types

```types
concrete ActivityReference
  A normalized URL identifying an activity reference in the MVP.
```

## Concept Instances

```instances
instantiate Authenticating

instantiate Sessioning with
  Subject is Authenticating.Account

instantiate Resolving with
  Reference is ActivityReference

instantiate Intending with
  User is Authenticating.Account
  Item is Resolving.Item

instantiate Connecting with
  User is Authenticating.Account

instantiate Planning with
  User is Authenticating.Account
  Item is Resolving.Item
```