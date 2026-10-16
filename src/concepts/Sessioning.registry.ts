import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import type { Db } from "mongodb";

import spec from "@design/concepts/Sessioning.md" with { type: "text" };

import {
  SessioningConcept,
  UnknownSession,
} from "./Sessioning.ts";

export const sessioning = registerConcept({
  class: SessioningConcept,
  spec,

  refusals: {
    UNKNOWN_SESSION: UnknownSession,
  },

  floors: {
    mongo: (
      { db }: { db: Db },
      name: string,
    ) => new SessioningConcept(db, name),
  },
});