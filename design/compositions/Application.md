# Application

The WeShould application boundary turns authenticated sessions into user-scoped product actions. Endpoints do not accept an arbitrary acting user; they resolve the current account from the supplied session before performing user-owned actions.

A signed-in user may [request a connection](reaction:Application.Connections.RequestConnection), while only the session-derived recipient may [accept](reaction:Application.Connections.AcceptConnection) or [decline](reaction:Application.Connections.DeclineConnection) that request. Either member may later [disconnect](reaction:Application.Connections.Disconnect).

```endpoints
Application.Connections.RequestConnection at /connections/request
Application.Connections.AcceptConnection at /connections/accept
Application.Connections.DeclineConnection at /connections/decline
Application.Connections.Disconnect at /connections/disconnect
```

A signed-in user may [express willingness toward an activity](reaction:Application.Intentions.ExpressIntention) by supplying its name and URL. Resolving first maps the normalized URL to an Item, then uses the supplied activity name to either describe that Item or converge the reference onto an existing Item with the same normalized name. Intending records the user's willingness toward the resulting stable Item.

```endpoints
Application.Intentions.ExpressIntention at /intentions/express
```

A signed-in organizer may [propose a plan](reaction:Application.Plans.ProposePlan). Participants respond through [the plan-response endpoint](reaction:Application.Plans.RespondToPlan). The separate WeShould composition commits the proposal when the final acceptance makes every participant accepted.

Participants may [cancel a plan](reaction:Application.Plans.CancelPlan). A participant may also [complete a committed plan](reaction:Application.Plans.CompletePlan), after which the WeShould completion reaction withdraws the corresponding active intentions.

```endpoints
Application.Plans.ProposePlan at /plans/propose
Application.Plans.RespondToPlan at /plans/respond
Application.Plans.CancelPlan at /plans/cancel
Application.Plans.CompletePlan at /plans/complete
```

The [home endpoint](reaction:Application.Home.GetHome) uses the [home former](former:Application.Home.Home) to return the current user's connections, pending requests, intentions, shared intentions, and plans together. Activity-bearing records include both their stable item identity and their human-readable name and canonical URL. Plan records also include the organizer and the current user's response so the interface can distinguish the proposer from a pending participant.

```endpoints
Application.Home.GetHome at /home
```