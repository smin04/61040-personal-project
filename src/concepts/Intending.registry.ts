import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import type { Db } from "mongodb";

import spec from "@design/concepts/Intending.md" with { type: "text" };

import {
  AlreadyIntending,
  IntendingConcept,
  IntentionNotFound,
} from "./Intending.ts";

export const intending = registerConcept({
  class: IntendingConcept,
  spec,

  refusals: {
    ALREADY_INTENDING: AlreadyIntending,
    INTENTION_NOT_FOUND: IntentionNotFound,
  },

  floors: {
    mongo: (
      { db }: { db: Db },
      name: string,
    ) => new IntendingConcept(db, name),
  },
});