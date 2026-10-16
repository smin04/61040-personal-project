# Sessions

WeShould uses authenticated accounts as the subjects of temporary application sessions.

Registration [creates an account and starts a session](reaction:Sessions.EnteringApplication.Register). Signing in [authenticates an existing account and starts a new session](reaction:Sessions.EnteringApplication.SignIn).

```endpoints
Sessions.EnteringApplication.Register at /auth/register
Sessions.EnteringApplication.SignIn at /auth/sign-in
```

A session can be [resolved to the current account](reaction:Sessions.CurrentAccount.CurrentUser). Other application endpoints use this session-derived account rather than accepting an arbitrary acting user from the client.

```endpoints
Sessions.CurrentAccount.CurrentUser at /auth/current
```

Signing out [ends the current session](reaction:Sessions.LeavingApplication.SignOut), after which that session can no longer resolve to an account.

```endpoints
Sessions.LeavingApplication.SignOut at /auth/sign-out
```