import { conceptSet } from "@mit-sdg/sync-engine/assembly";

import { authenticating } from "./concepts/Authenticating.registry.ts";
import { connecting } from "./concepts/Connecting.registry.ts";
import { intending } from "./concepts/Intending.registry.ts";
import { planning } from "./concepts/Planning.registry.ts";
import { resolving } from "./concepts/Resolving.registry.ts";
import { sessioning } from "./concepts/Sessioning.registry.ts";

export const applicationConceptSet = conceptSet({
  Resolving: resolving,
  Intending: intending,
  Connecting: connecting,
  Planning: planning,
  Authenticating: authenticating,
  Sessioning: sessioning,
});

export const { concepts } = applicationConceptSet;