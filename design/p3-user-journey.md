# P3 Beta User Journey

The beta starts with an empty database and two people using separate browser sessions.

Josie creates an account and signs in. Marie creates her own account in a second browser session. Josie sends Marie a connection request, and Marie accepts it. They now appear in each other's Connections section.

## 01: I'd Go

Josie has been meaning to try Wally's Cafe. In **Save the spark**, she enters `Wally's Cafe`, pastes the link she found, and clicks **I'd Go**.

Wally's Cafe now appears in **Ideas worth keeping**.

At this point, Josie is only saying that she would go. She does not need to choose a date, invite Marie, or start coordinating yet. The activity stays in her saved list until something gives her a reason to act on it.

Later, Marie finds the same place through a different link. She enters `wallys cafe` and saves it from her own account.

Resolving normalizes the activity name and associates the two references with the same stable Item. The two users do not need to have copied the exact same URL.

## 02: You'd Both Go

Because Josie and Marie are connected and both have an active intention for the same Item, Wally's Cafe appears in **You'd both go**.

This is the point where WeShould changes from remembering an individual intention to surfacing a reason to coordinate.

The shared card shows that Josie and Marie would both go and gives Josie the option to **Make a plan**. Before this overlap exists, WeShould does not ask either person to schedule anything.

## 03: Make It Real

Josie clicks **Make a plan**.

The plan composer is already tied to Wally's Cafe and Marie. Josie does not need to search for the activity again or choose participants manually. She only needs to answer one question:

**When should you go?**

She enters `Friday at 8 PM` and proposes the plan.

Marie sees the proposed plan in her own browser session. She can either accept or decline it.

When Marie accepts, every participant has accepted. The Planning reaction commits the plan automatically.

Both browser sessions update without requiring a manual page refresh, and the plan now appears as committed.

## Completing the plan

After Josie and Marie actually go to Wally's Cafe, either participant can mark the committed plan done.

Completing the plan withdraws both active intentions for Wally's Cafe. The original "we should do this" has been fulfilled, so it no longer belongs in either person's someday list.

The completed plan remains visible as a record of what happened.

## Cancelling a plan

Cancellation behaves differently from completion.

If Josie or Marie cancels a proposed or committed plan, the plan closes, but their underlying intentions remain active.

Cancelling Friday at 8 PM does not mean they stopped wanting to go to Wally's Cafe. The activity can still appear as something they would both do, allowing them to try planning it again later.

## Errors and recovery

The beta also gives feedback when an action cannot be completed.

For example:

- an already-used username asks the user to choose another one;
- a short password explains the length requirement;
- an invalid activity link asks for a full HTTP or HTTPS URL;
- saving the same activity twice explains that it is already saved;
- repeated or invalid connection actions explain what went wrong.

Errors are shown near the part of the interface where the user was acting so that the next step is clear.

## Beta capture boundary

The P3 beta uses an activity name and an HTTP or HTTPS link as its capture input.

The intended long-term interaction is for WeShould to sit closer to the places where activities are discovered, such as the iOS share sheet used by TikTok, Instagram, Safari, and other apps. A native iOS Share Extension is not part of this deployed web beta.

For P3, the important interaction begins once an activity enters WeShould:

**save an intention → discover shared interest → make a plan → commit → complete**

The manual name-and-link form keeps that core journey testable without making the beta depend on platform-specific social media integration.