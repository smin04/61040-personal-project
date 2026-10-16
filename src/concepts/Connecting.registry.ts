import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import type { Db } from "mongodb";

import spec from "@design/concepts/Connecting.md" with { type: "text" };

import {
  AlreadyConnected,
  CannotConnectSelf,
  ConnectingConcept,
  ConnectionNotFound,
  NotConnectionMember,
  NotRequestRecipient,
  RequestExists,
  RequestNotFound,
} from "./Connecting.ts";

export const connecting = registerConcept({
  class: ConnectingConcept,
  spec,

  refusals: {
    CANNOT_CONNECT_SELF: CannotConnectSelf,
    ALREADY_CONNECTED: AlreadyConnected,
    REQUEST_EXISTS: RequestExists,
    REQUEST_NOT_FOUND: RequestNotFound,
    NOT_REQUEST_RECIPIENT: NotRequestRecipient,
    CONNECTION_NOT_FOUND: ConnectionNotFound,
    NOT_CONNECTION_MEMBER: NotConnectionMember,
  },

  floors: {
    mongo: (
      { db }: { db: Db },
      name: string,
    ) => new ConnectingConcept(db, name),
  },
});