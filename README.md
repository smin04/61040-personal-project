# WeShould

WeShould is a small social planning app for the gap between "we should do that" and an actual plan.

The app lets someone save a restaurant, event, class, or other activity without choosing a date or sending an invitation. When a connection independently saves the same activity, WeShould surfaces the overlap and gives them a lightweight path to propose a time, accept it, and turn the idea into a committed plan.

## P3 beta

The implemented journey is:

`register -> connect -> save an activity -> discover shared interest -> propose a plan -> accept -> commit -> complete`

The beta intentionally keeps discovery outside the app. Users enter an activity name and an HTTP or HTTPS link. Direct sharing from TikTok or Instagram is a future capture improvement but is not part of the deployed P3 web beta.

## P3 deliverables

- [Visual design study](design/visual-design-study.pdf)
- [Updated beta user journey](design/p3-user-journey.md)
- [Concept specifications](design/concepts/)
- [Application composition](design/compositions/Application.md)
- [WeShould composition](design/compositions/WeShould.md)
- [Saved P3 test output](tests/output/p3-test-results.txt)
- [Saved P3 check output](tests/output/p3-check-results.txt)
- [P2 implementation notes](design/p2-notes.md)

**Deployed app:** [https://weshould.mit-sdg.dev]

**Narrated screen recording:** [https://youtu.be/8wAAYRWQ7to]

## Design

The core design question is:

> Can software preserve weak offline intentions long enough to discover shared interest and turn that interest into commitment?

The application separates that progression across concepts rather than treating every saved activity as a plan.

`Resolving` owns stable activity identity and reference convergence. `Intending` records lightweight willingness. `Connecting` owns reciprocal relationships. `Planning` owns proposals, responses, commitment, cancellation, and completion. `Authenticating` and `Sessioning` provide account and session infrastructure.

Cross-concept behavior lives in compositions. Shared intentions are derived from connections and active intentions. A plan commits after the final participant accepts. Completing a committed plan withdraws the corresponding active intentions, while cancelling a plan leaves those weaker intentions intact.

## Visual and interaction design

The P3 interface applies the typography and color study to the working application. Fraunces is used for larger display text, while Inter is used for controls, labels, and metadata. Warm ivory forms the base of the interface, deep plum anchors navigation and structure, citron is reserved for the strongest next action, sage marks settled positive states, and coral is used for errors and destructive actions.

The interface follows the same progression as the product:

1. Save an idea.
2. Notice a shared intention.
3. Make a plan.

The shared-intention section receives the strongest visual treatment because it marks the point when an individual intention becomes useful to someone else.

The P3 pass also improved the planning form, responsive layout, focus states, action hierarchy, and error feedback. Expected failures such as an already-used username, an invalid link, or a repeated connection request are presented near the relevant controls with human-readable guidance.

## Running locally

### Requirements

- Bun
- MongoDB
- Podman or another way to run MongoDB locally

The repository includes `compose.yaml` for local MongoDB setup.

Start MongoDB:

```bash
podman compose up -d