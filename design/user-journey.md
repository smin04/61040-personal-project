# User Journey

Josie and her best friend Marie have three things in common: they love jazz, they are both constantly busy, and they spend more time scrolling TikTok and Instagram than either of them intends to.

Josie has sent Marie countless restaurants, concerts, jazz bars, festivals, and other things to do around Boston. Marie frequently hearts the posts or responds with some version of:

> We actually need to do this.

They went to one sushi bar maybe 4 months ago.

On Tuesday Josie is scrolling through short-form videos while waiting for class when she sees a post about **Wally's Cafe Jazz Night**. This is the moment shown in [Sketch 1](ui-sketches.md#sketch1). Normally, she might send the post to Marie and trust that one of them will remember it later. Instead, she taps the post's normal **Share** action.

As shown in [Sketch 2](ui-sketches.md#sketch2), **WeShould appears directly in the share sheet**. Josie selects it. The share extension identifies Wally's Cafe and presents one primary action:

> **I'd Go**

Josie taps it and returns to what she was doing.

She does not choose a date. She does not invite Marie. She does not open a calendar or create an event. If the activity had not been recognized automatically, she could have entered a short description manually and made the same **I'd Go** decision.

That lack of immediate planning is intentional. At the moment of discovery, Josie is willing to answer one question

*would I actually do this?* 

but not necessarily willing to organize the outing.

A few days later, Marie independently encounters Wally's Cafe and also saves it to WeShould with **I'd Go**. Because both users have now expressed willingness toward the same underlying activity, Wally's appears in the **You both would** section of Josie's home screen in [Sketch 3](ui-sketches.md#sketch3).

The match matters because it's stronger than a reaction in a group chat. Josie now knows that Marie did not merely like the post; Marie independently indicated that she would actually go. At the same time, WeShould still preserves Josie's unmatched interests separately under **Saved by you** rather than treating every saved item as a social opportunity.

Later when Josie has time to make a plan, she does not have to search old messages or begin with the blank-slate question, *What should we do?* She opens an activity they already know they both want to try and taps **Make a plan**.

[Sketch 4](ui-sketches.md#sketch4) shows the next step. The Wally's screen reminds Josie that she and Marie would both go and asks only for the information needed to make the intention concrete: a date, a time, and the participants. Josie chooses a time and presses **Propose**. Venue information and the original post remain accessible, but WeShould does not attempt to handle the restaurant's own reservation or booking process.

Marie accepts the proposal. The activity now becomes a committed plan, shown in [Sketch 5](ui-sketches.md#sketch5). The screen makes the commitment explicit: Wally's Cafe, when they are going, where it is, and that Josie and Marie are both attending. If they need to make a reservation they can follow the **Booking / venue site** link to the appropriate external service.

After they actually go, the plan can be marked **completed**. The weak intention that began several days earlier while Josie was scrolling has now run its full course.

WeShould did not discover the jazz bar for them. Their existing feed already did that. It did not convince either person to like jazz nor did it replace their calendar, messages, or the venue's booking system.

Its role was to preserve two small decisions made at different moments and make them useful together:

```text
I saw it.
   ↓
I'd go.
   ↓
We both would.
   ↓
Let's make a plan.
   ↓
We're going.
```
