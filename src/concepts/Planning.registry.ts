import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import type { Db } from "mongodb";

import spec from "@design/concepts/Planning.md" with { type: "text" };

import {
  IneligiblePlanParticipants,
  InvalidResponse,
  NotAllAccepted,
  NotParticipant,
  OrganizerNotParticipant,
  PlanClosed,
  PlanningConcept,
  type ProposalEligibility,
  PlanNotCommitted,
  PlanNotFound,
  PlanNotProposed,
  TooFewParticipants,
} from "./Planning.ts";

export const planning = registerConcept({
  class: PlanningConcept,
  spec,

  refusals: {
    ORGANIZER_NOT_PARTICIPANT: OrganizerNotParticipant,
    TOO_FEW_PARTICIPANTS: TooFewParticipants,
    PLAN_NOT_FOUND: PlanNotFound,
    PLAN_NOT_PROPOSED: PlanNotProposed,
    NOT_PARTICIPANT: NotParticipant,
    INVALID_RESPONSE: InvalidResponse,
    NOT_ALL_ACCEPTED: NotAllAccepted,
    PLAN_CLOSED: PlanClosed,
    PLAN_NOT_COMMITTED: PlanNotCommitted,
    INELIGIBLE_PLAN_PARTICIPANTS: IneligiblePlanParticipants,
  },

  floors: {
    mongo: (
      { db, proposalEligibility }: { db: Db; proposalEligibility?: ProposalEligibility },
      name: string,
    ) => new PlanningConcept(db, name, undefined, proposalEligibility),
  },
});