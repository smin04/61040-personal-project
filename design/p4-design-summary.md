# WeShould : P4 Design Retrospective

## The design that survived

WeShould addresses a small but persistent social failure: *“we should do that”* that expresses interest without producing a plan. Its guiding distinction has survived every milestone: **an intention is not an invitation, and an invitation is not a commitment**. Someone can save an activity without choosing a date; a shared interest becomes visible only after a connection independently saves the same activity; a plan becomes committed only when everyone accepts.

The product's scope is intentionally narrow. It does not replace discovery feeds, messaging, reservations, or calendars. It preserves willingness long enough to turn it into coordination.

## From P1 concept to P3 beta to P4

| | Earlier design | Final implementation and rationale |
|---|---|---|
| **Capture** | P1 sketched *Share → WeShould → I'd Go*, including automatic recognition of activities from social posts. | P3 used an explicit name-and-link form so the full planning journey could be tested independently of platform integration. P4 retains this reliable web flow and adds an iOS Share Extension as a second entry point; automatic place extraction remains outside scope. |
| **Shared interest** | P1 proposed a “You both would” view that reveals overlap but creates no plan. | Matches are derived from **active intentions and reciprocal connections**, not stored as separate match records. P4 also groups several matching friends around one activity rather than showing repeated one-to-one opportunities. |
| **Planning** | P1 already defined a set of participants, individual responses, unanimous commitment, and distinct cancellation/completion states. | P3 demonstrated the two-person path. P4 exposed the existing multi-participant model in the UI, allowing the organizer to select several eligible friends and allowing invitees to see the complete participant list. |
| **Trust** | P1 concept rules specified who may accept connection requests and respond to plans; the initial completion action lacked an acting user. | P4 binds actions to authenticated sessions, checks eligibility at proposal time, and requires membership for completion. Trust is enforced by the application, not merely implied by which buttons appear. |

The early [concept specifications](https://github.com/smin04/61040-personal-project/blob/85301a9048/design/concepts.md) and [UI sketches](https://github.com/smin04/61040-personal-project/commit/dd735a556e5a4c0450356acb88af6eef1fd14afa) established the separation between interest and commitment. The [P3 implementation revision](https://github.com/smin04/61040-personal-project/commit/d945cd6a449391f398624ef130ed813c9caa8ce7) documents the practical shift to manual capture and a fully usable two-person beta. The [P4 implementation](https://github.com/smin04/61040-personal-project/commit/5779cb1ef39e323410a02fba3fe0b85efc621433) and [group-planning extension](https://github.com/smin04/61040-personal-project/commit/27763c3cdeb5ff2bdaddaca23b1ba38ee6356126) record the later changes.

## What changed after the P3 visual design

P3 established the warm ivory/plum palette, editorial headings, prominent “I'd Go” and “Make a plan” actions, and a home screen organized around *saving an idea → finding overlap → proposing a time*. Its [user journey at the P3 commit](https://github.com/smin04/61040-personal-project/blob/d945cd6a449391f398624ef130ed813c9caa8ce7/design/p3-user-journey.md) preselected one friend when opening the plan composer.

P4 adjusted the interaction model where the UI had concealed complexity:

- **One activity, several people.** A shared activity is presented as a single opportunity with selectable invitees; the plan displays all participants, including people not directly connected to each other.
- **Visible state transitions.** Proposed, committed, cancelled, and completed plans remain distinct. Acceptance commits a plan through a reaction only when *every* participant has accepted.
- **Failures are part of the interface.** A valid-looking form cannot substitute for authorization: unauthorized participants and ineligible proposals must receive explicit refusals.
- **Capture without changing the model.** The native Share Extension collects a URL and activity name, but feeds the same saved-intention workflow rather than introducing a second planning system.

## Concept boundaries and design lessons

The six concepts retain separate responsibilities: `Authenticating` and `Sessioning` establish identity; `Resolving` establishes activity identity; `Intending` records willingness; `Connecting` stores reciprocal relationships; `Planning` owns commitments. Compositions join these public operations. **No “Match” concept was added**: shared interest is a view over connections and active intentions. Likewise, acceptance and completion are reactions, not duplicate UI-side state machines. Cancellation intentionally leaves intentions active; completion withdraws them.

Two constraints sharpened the design. First, `Planning` should not know WeShould's social rules. Proposal eligibility therefore checks the organizer's connections and each person's independently saved intention **at the application boundary**, using public concept queries. Second, URL identity is not semantic understanding. Normalizing recognizable Instagram/TikTok post URLs reduces accidental mismatch, but two unrelated posts about the same venue are not guaranteed to converge; guessing would risk false social matches.

The final tests exercise full journeys as well as refusals, including strangers attempting to propose, connected friends who never saved the activity, and outsiders attempting plan operations. The remaining tradeoff is consistency across concepts: eligibility is checked before plan creation rather than atomically locked against concurrent connection/intention changes. For this prototype, preserving clear concept boundaries took precedence over distributed transaction machinery.

**The main design evolution was not adding more features; it was making the original promise enforceable:** interest can remain private and low-pressure, while commitment becomes shared, explicit, and permission-checked.
