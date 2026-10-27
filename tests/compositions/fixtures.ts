import { expect } from "bun:test";
import { MongoClient, type Db } from "mongodb";
import { assemble } from "@mit-sdg/sync-engine/assembly";
import { applicationConceptSet } from "../../src/concepts.ts";
import { createProposalEligibility } from "../../src/application/proposalEligibility.ts";
import { composition as applicationComposition } from "../../src/compositions/Application.ts";
import { composition as sessionsComposition } from "../../src/compositions/Sessions.ts";
import { composition as weShouldComposition } from "../../src/compositions/WeShould.ts";

export function makeFixture(name: string) {
  const url = process.env.MONGODB_URL ??
    "mongodb://dev:dev@127.0.0.1:27017/weshould?authSource=admin";
  const client = new MongoClient(url);
  const db = client.db(name);
  return {
    db,
    connect: () => client.connect(),
    reset: () => db.dropDatabase(),
    close: () => client.close(),
    makeApplication: () => makeApplication(db),
  };
}

export type Result =
  | {
      ok: true;
      value: Record<string, any>;
    }
  | {
      ok: false;
      error: unknown;
    };

export function valueOf(
  result: Result,
): Record<string, any> {
  expect(result.ok).toBe(true);

  if (result.ok === false) {
    throw new Error(
      `Expected success, received ${JSON.stringify(result.error)}`,
    );
  }

  return result.value;
}

export function expectFailure(
  result: Result,
) {
  expect(result.ok).toBe(false);
}

export function makeApplication(db: Db) {
  return assemble({
    conceptSet:
      applicationConceptSet,

    instances:
      applicationConceptSet.implementations(
        "mongo",
        { db, proposalEligibility: createProposalEligibility(db) },
      ),

    composition: {
      Sessions:
        sessionsComposition,

      WeShould:
        weShouldComposition,

      Application:
        applicationComposition,
    },
  });
}

export async function register(
  gateway: any,
  username: string,
): Promise<string> {
  const registration =
    valueOf(
      (await gateway.invoke(
        "/auth/register",
        {
          username,
          password:
            `${username}-password-123`,
        },
      )) as Result,
    );

  return registration.session as string;
}

export async function connect(
  gateway: any,
  requesterSession: string,
  recipientSession: string,
  recipient: string,
) {
  const request =
    valueOf(
      (await gateway.invoke(
        "/connections/request",
        {
          session:
            requesterSession,
          recipient,
        },
      )) as Result,
    ).id as string;

  valueOf(
    (await gateway.invoke(
      "/connections/accept",
      {
        session:
          recipientSession,
        request,
      },
    )) as Result,
  );
}

export async function createSharedIntention(
  gateway: any,
  firstSession: string,
  secondSession: string,
) {
  valueOf(
    (await gateway.invoke(
      "/intentions/express",
      {
        session:
          firstSession,
        name:
          "Wally's Cafe",
        reference:
          "https://example.com/wallys-cafe",
      },
    )) as Result,
  );

  valueOf(
    (await gateway.invoke(
      "/intentions/express",
      {
        session:
          secondSession,
        name:
          "wallys cafe",
        reference:
          "https://instagram.com/wallys-cafe",
      },
    )) as Result,
  );

  await gateway.whenIdle();

  const home =
    valueOf(
      (await gateway.invoke(
        "/home",
        {
          session:
            firstSession,
        },
      )) as Result,
    ).home;

  expect(
    home.sharedIntentions,
  ).toHaveLength(1);

  return home.sharedIntentions[0];
}

export async function proposeSharedPlan(
  gateway: any,
  organizerSession: string,
  item: string,
) {
  return valueOf(
    (await gateway.invoke(
      "/plans/propose",
      {
        session:
          organizerSession,
        item,
        participants: [
          "josie",
          "marie",
        ],
        time:
          "Friday at 8 PM",
      },
    )) as Result,
  ).id as string;
}

