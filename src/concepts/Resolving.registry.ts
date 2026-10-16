import type { Db } from "mongodb";

import { registerConcept } from "@mit-sdg/sync-engine/assembly";

import spec from "@design/concepts/Resolving.md" with {
  type: "text",
};

import {
  ItemNotFound,
  ResolvingConcept,
} from "./Resolving.ts";

export const resolving =
  registerConcept({
    class: ResolvingConcept,

    spec,

    refusals: {
      ITEM_NOT_FOUND:
        ItemNotFound,
    },

    floors: {
      mongo: (
        {
          db,
        }: {
          db: Db;
        },
        name: string,
      ) =>
        new ResolvingConcept(
          db,
          name,
        ),
    },
  });