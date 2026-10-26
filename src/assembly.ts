import { assemble } from "@mit-sdg/sync-engine/assembly";

import { applicationConceptSet } from "./concepts.ts";

import { composition as applicationComposition } from "./compositions/Application.ts";
import { composition as sessionsComposition } from "./compositions/Sessions.ts";
import { composition as weShouldComposition } from "./compositions/WeShould.ts";

import { db } from "./db.ts";
import { createProposalEligibility } from "./application/proposalEligibility.ts";

export function assembleApplication() {
  return assemble({
    conceptSet: applicationConceptSet,

    instances: applicationConceptSet.implementations(
      "mongo",
      {
        db,
        proposalEligibility: createProposalEligibility(db),
      },
    ),

    composition: {
      Sessions: sessionsComposition,
      WeShould: weShouldComposition,
      Application: applicationComposition,
    },
  });
}