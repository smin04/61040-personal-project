import type { Db } from "mongodb";
import { ConnectingConcept } from "../concepts/Connecting.ts";
import { IntendingConcept } from "../concepts/Intending.ts";

// Cross-concept policy uses only the public concept queries.
export function createProposalEligibility(db: Db) {
  const connecting = new ConnectingConcept(db, "Connecting");
  const intending = new IntendingConcept(db, "Intending");
  return async ({ organizer, item, participants }: {
    organizer: string; item: string; participants: string[];
  }): Promise<boolean> => {
    for (const user of participants) {
      if (!(await intending._has({ user, item })).active) return false;
      if (user !== organizer && !(await connecting._areConnected({ first: organizer, second: user })).connected) return false;
    }
    return true;
  };
}
