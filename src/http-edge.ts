import {
  httpPolicy,
} from "@mit-sdg/sync-engine-http/policy";

export const weShouldPolicy =
  httpPolicy({
    basePath: "/api",

    publicErrors: {
      INVALID_USERNAME:
        "INVALID_REQUEST",

      WEAK_PASSWORD:
        "INVALID_REQUEST",

      USERNAME_TAKEN:
        "CONFLICT",

      INVALID_CREDENTIALS:
        "UNAUTHORIZED",

      UNKNOWN_SESSION:
        "UNAUTHORIZED",

      ITEM_NOT_FOUND:
        "NOT_FOUND",

      CANNOT_CONNECT_SELF:
        "INVALID_REQUEST",

      ALREADY_CONNECTED:
        "CONFLICT",

      REQUEST_EXISTS:
        "CONFLICT",

      REQUEST_NOT_FOUND:
        "NOT_FOUND",

      NOT_REQUEST_RECIPIENT:
        "FORBIDDEN",

      CONNECTION_NOT_FOUND:
        "NOT_FOUND",

      NOT_CONNECTION_MEMBER:
        "FORBIDDEN",

      ALREADY_INTENDING:
        "CONFLICT",

      INTENTION_NOT_FOUND:
        "NOT_FOUND",

      ORGANIZER_NOT_PARTICIPANT:
        "INVALID_REQUEST",

      TOO_FEW_PARTICIPANTS:
        "INVALID_REQUEST",

      PLAN_NOT_FOUND:
        "NOT_FOUND",

      PLAN_NOT_PROPOSED:
        "CONFLICT",

      NOT_PARTICIPANT:
        "FORBIDDEN",

      INVALID_RESPONSE:
        "INVALID_REQUEST",

      NOT_ALL_ACCEPTED:
        "CONFLICT",

      PLAN_CLOSED:
        "CONFLICT",

      PLAN_NOT_COMMITTED:
        "CONFLICT",
    },
  });
