import type { EndpointValidator } from "@mit-sdg/sync-engine/boundary";

function record(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function hasOnly(
  value: Record<
    string,
    unknown
  >,
  keys: readonly string[],
): boolean {
  const actual =
    Object.keys(value);

  return (
    actual.length ===
      keys.length &&
    keys.every((key) =>
      Object.hasOwn(
        value,
        key,
      ),
    )
  );
}

function validator(
  accepts: (
    value: Record<
      string,
      unknown
    >,
  ) => boolean,
  detail: string,
): EndpointValidator {
  return (value) =>
    record(value) &&
    accepts(value)
      ? {
          ok: true,
        }
      : {
          ok: false,
          detail,
        };
}

function boundedString(
  value: unknown,
  max = 256,
): value is string {
  return (
    typeof value ===
      "string" &&
    value.trim().length > 0 &&
    value.length <= max
  );
}

function validHttpUrl(
  value: unknown,
): value is string {
  if (
    !boundedString(
      value,
      2048,
    )
  ) {
    return false;
  }

  try {
    const url = new URL(
      value,
    );

    return (
      url.protocol ===
        "http:" ||
      url.protocol ===
        "https:"
    );
  } catch {
    return false;
  }
}

/* ---------- Auth ---------- */

export const credentialsInput =
  validator(
    (value) =>
      hasOnly(
        value,
        [
          "username",
          "password",
        ],
      ) &&
      typeof value.username ===
        "string" &&
      typeof value.password ===
        "string" &&
      value.username.length <=
        32 &&
      value.password.length <=
        128,
    "username and password must be bounded strings",
  );

export const sessionOnlyInput =
  validator(
    (value) =>
      hasOnly(
        value,
        ["session"],
      ) &&
      boundedString(
        value.session,
      ),
    "session must be a non-empty string",
  );

export const issuedSessionOutput =
  validator(
    (value) =>
      hasOnly(
        value,
        [
          "account",
          "session",
          "expiresAt",
        ],
      ) &&
      typeof value.account ===
        "string" &&
      typeof value.session ===
        "string" &&
      value.expiresAt instanceof
        Date,
    "response must contain account, session, and expiry",
  );

export const usernameOutput =
  validator(
    (value) =>
      hasOnly(
        value,
        ["username"],
      ) &&
      typeof value.username ===
        "string",
    "response must contain a username",
  );

export const signedOutOutput =
  validator(
    (value) =>
      hasOnly(
        value,
        ["signedOut"],
      ) &&
      value.signedOut ===
        true,
    "response must confirm sign-out",
  );

/* ---------- Connections ---------- */

export const connectionRequestInput =
  validator(
    (value) =>
      hasOnly(
        value,
        [
          "session",
          "recipient",
        ],
      ) &&
      boundedString(
        value.session,
      ) &&
      boundedString(
        value.recipient,
        32,
      ),
    "session and recipient must be valid strings",
  );

export const requestIdInput =
  validator(
    (value) =>
      hasOnly(
        value,
        [
          "session",
          "request",
        ],
      ) &&
      boundedString(
        value.session,
      ) &&
      boundedString(
        value.request,
      ),
    "session and request must be valid strings",
  );

export const connectionIdInput =
  validator(
    (value) =>
      hasOnly(
        value,
        [
          "session",
          "connection",
        ],
      ) &&
      boundedString(
        value.session,
      ) &&
      boundedString(
        value.connection,
      ),
    "session and connection must be valid strings",
  );

/* ---------- Intentions ---------- */

export const intentionInput =
  validator(
    (value) =>
      hasOnly(
        value,
        [
          "session",
          "name",
          "reference",
        ],
      ) &&
      boundedString(
        value.session,
      ) &&
      boundedString(
        value.name,
        160,
      ) &&
      validHttpUrl(
        value.reference,
      ),
    "activity name must be non-empty and reference must be a valid HTTP or HTTPS URL",
  );

/* ---------- Planning ---------- */

export const planProposalInput =
  validator(
    (value) =>
      hasOnly(
        value,
        [
          "session",
          "item",
          "participants",
          "time",
        ],
      ) &&
      boundedString(
        value.session,
      ) &&
      boundedString(
        value.item,
      ) &&
      Array.isArray(
        value.participants,
      ) &&
      value.participants.length >=
        2 &&
      value.participants.every(
        (participant) =>
          boundedString(
            participant,
            32,
          ),
      ) &&
      boundedString(
        value.time,
        256,
      ),
    "plan must contain a valid item, participants, time, and session",
  );

export const planResponseInput =
  validator(
    (value) =>
      hasOnly(
        value,
        [
          "session",
          "plan",
          "response",
        ],
      ) &&
      boundedString(
        value.session,
      ) &&
      boundedString(
        value.plan,
      ) &&
      (
        value.response ===
          "ACCEPTED" ||
        value.response ===
          "DECLINED"
      ),
    "plan response must be ACCEPTED or DECLINED",
  );

export const planIdInput =
  validator(
    (value) =>
      hasOnly(
        value,
        [
          "session",
          "plan",
        ],
      ) &&
      boundedString(
        value.session,
      ) &&
      boundedString(
        value.plan,
      ),
    "session and plan must be valid strings",
  );

/* ---------- Outputs ---------- */

export const simpleIdOutput =
  validator(
    (value) =>
      hasOnly(
        value,
        ["id"],
      ) &&
      boundedString(
        value.id,
      ),
    "response must contain an identity",
  );

export const homeInput =
  sessionOnlyInput;

export const homeOutput =
  validator(
    (value) =>
      hasOnly(
        value,
        ["home"],
      ) &&
      record(
        value.home,
      ) &&
      Array.isArray(
        value.home.connections,
      ) &&
      Array.isArray(
        value.home.pendingRequests,
      ) &&
      Array.isArray(
        value.home.intentions,
      ) &&
      Array.isArray(
        value.home.sharedIntentions,
      ) &&
      Array.isArray(
        value.home.plans,
      ),
    "response must contain a valid home state",
  );