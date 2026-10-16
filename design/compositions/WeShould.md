# WeShould

WeShould preserves lightweight willingness long enough for independent intentions to become useful coordination.

Two connected users who have independently expressed willingness toward the same item appear in the [shared-intention relation](view:WeShould.SharedIntentions.SharedIntentions). The relation is derived from existing connections and intentions rather than stored as a separate match object.

When a participant accepts a proposed plan, [the acceptance can commit the plan](reaction:WeShould.Planning.AcceptanceCommitsPlan) once every participant has accepted. Whether the plan is ready to commit is determined in the reaction's `where` clause rather than by imperative lookup logic.

When a committed plan is completed, [the corresponding participant intentions are withdrawn](reaction:WeShould.Planning.CompletionWithdrawsIntentions). The participant and active-intention relations are joined in `where`, so the reaction fires only for intentions that are still active.

Cancelling a plan has no corresponding withdrawal reaction. Cancellation ends that proposal but preserves the weaker underlying willingness to do the activity later.