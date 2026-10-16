import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import type { Db } from "mongodb";

import spec from "@design/concepts/Authenticating.md" with { type: "text" };

import {
  AuthenticatingConcept,
  InvalidCredentials,
  InvalidUsername,
  UsernameTaken,
  WeakPassword,
} from "./Authenticating.ts";

export const authenticating = registerConcept({
  class: AuthenticatingConcept,
  spec,

  refusals: {
    INVALID_USERNAME: InvalidUsername,
    WEAK_PASSWORD: WeakPassword,
    USERNAME_TAKEN: UsernameTaken,
    INVALID_CREDENTIALS: InvalidCredentials,
  },

  floors: {
    mongo: (
      { db }: { db: Db },
      name: string,
    ) => new AuthenticatingConcept(db, name),
  },
});