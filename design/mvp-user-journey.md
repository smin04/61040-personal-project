# MVP Core User Journey

The MVP begins with an empty database.

Josie registers for WeShould and signs in, then Marie creates a separate account. Josie sends Marie a connection request, which Marie accepts.

Josie finds Wally's Cafe and adds it to WeShould with its name and URL. She clicks **I'd Go**, recording that she would genuinely go without choosing a date or directly inviting Marie.

Later, Marie independently encounters the same place through a different link. She enters `wallys cafe` with that URL and also clicks **I'd Go**. Resolving recognizes that the normalized activity names match and associates both references with the same stable Item.

Because Josie and Marie are connected and now have active intentions toward that same Item, WeShould surfaces Wally's Cafe as a shared intention.

Josie chooses **Make a plan** and proposes Friday at 8 PM. Josie is already accepted because she created the proposal, while Marie initially sees it as pending. Marie accepts the proposal, after which the acceptance reaction sees that every participant has accepted and commits the plan.

Both users then see the committed plan without manually refreshing the page.

After they go to Wally's Cafe, either participant can mark the committed plan completed. The completion reaction withdraws their corresponding active intentions, because the original “we should do this” intention has now been fulfilled.

For the MVP, activities may converge when either their normalized URLs match or their normalized activity names match. This matching is deliberately conservative rather than fuzzy or semantic. Automatic interpretation of arbitrary TikTok or Instagram posts and an iOS Share Extension are deferred to later work.