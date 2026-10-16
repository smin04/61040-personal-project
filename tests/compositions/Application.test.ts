import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";

import {
  MongoClient,
} from "mongodb";

import {
  assemble,
} from "@mit-sdg/sync-engine/assembly";

import {
  createGateway,
} from "@mit-sdg/sync-engine/boundary";

import {
  applicationConceptSet,
} from "../../src/concepts.ts";

import {
  composition as applicationComposition,
} from "../../src/compositions/Application.ts";

import {
  composition as sessionsComposition,
} from "../../src/compositions/Sessions.ts";

import {
  composition as weShouldComposition,
} from "../../src/compositions/WeShould.ts";

const url =
  process.env.MONGODB_URL ??
  "mongodb://dev:dev@127.0.0.1:27017/weshould?authSource=admin";

const client =
  new MongoClient(url);

const db =
  client.db(
    "weshould_integration_test",
  );

type Result =
  | {
      ok: true;
      value:
        Record<
          string,
          any
        >;
    }
  | {
      ok: false;
      error: unknown;
    };

function valueOf(
  result: Result,
): Record<
  string,
  any
> {
  expect(
    result.ok,
  ).toBe(true);

  if (!result.ok) {
    throw new Error(
      `Expected success, received ${JSON.stringify(result.error)}`,
    );
  }

  return result.value;
}

function makeApplication() {
  return assemble({
    conceptSet:
      applicationConceptSet,

    instances:
      applicationConceptSet.implementations(
        "mongo",
        {
          db,
        },
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

describe(
  "WeShould application journey",
  () => {
    beforeAll(
      async () => {
        await client.connect();
      },
    );

    beforeEach(
      async () => {
        await db.dropDatabase();
      },
    );

    afterAll(
      async () => {
        await client.close();
      },
    );

    test(
      "independent intentions become a committed and completed plan",
      async () => {
        const application =
          makeApplication();

        const gateway =
          createGateway<any>({
            application,
          });

        const josieRegistration =
          valueOf(
            (await gateway.invoke(
              "/auth/register",
              {
                username:
                  "josie",

                password:
                  "josie-password-123",
              },
            )) as Result,
          );

        const marieRegistration =
          valueOf(
            (await gateway.invoke(
              "/auth/register",
              {
                username:
                  "marie",

                password:
                  "marie-password-123",
              },
            )) as Result,
          );

        const josieSession =
          josieRegistration.session as string;

        const marieSession =
          marieRegistration.session as string;

        expect(
          josieSession,
        ).toBeTruthy();

        expect(
          marieSession,
        ).toBeTruthy();

        const connectionRequest =
          valueOf(
            (await gateway.invoke(
              "/connections/request",
              {
                session:
                  josieSession,

                recipient:
                  "marie",
              },
            )) as Result,
          );

        const request =
          connectionRequest.id as string;

        expect(
          request,
        ).toBeTruthy();

        valueOf(
          (await gateway.invoke(
            "/connections/accept",
            {
              session:
                marieSession,

              request,
            },
          )) as Result,
        );

        const josieHomeAfterConnection =
          valueOf(
            (await gateway.invoke(
              "/home",
              {
                session:
                  josieSession,
              },
            )) as Result,
          );

        expect(
          josieHomeAfterConnection
            .home.connections,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              peer:
                "marie",
            }),
          ]),
        );

        valueOf(
          (await gateway.invoke(
            "/intentions/express",
            {
              session:
                josieSession,

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
                marieSession,

              /*
               * Different spelling and a different URL should
               * still resolve to the same underlying Item.
               */
              name:
                "wallys cafe",

              reference:
                "https://instagram.com/wallys-cafe",
            },
          )) as Result,
        );

        await gateway.whenIdle();

        const josieHomeWithSharedIntention =
          valueOf(
            (await gateway.invoke(
              "/home",
              {
                session:
                  josieSession,
              },
            )) as Result,
          );

        const shared =
          josieHomeWithSharedIntention
            .home
            .sharedIntentions;

        expect(
          shared,
        ).toHaveLength(1);

        expect(
          shared[0],
        ).toEqual(
          expect.objectContaining({
            peer:
              "marie",

            name:
              "Wally's Cafe",
          }),
        );

        const item =
          shared[0].item as string;

        const proposal =
          valueOf(
            (await gateway.invoke(
              "/plans/propose",
              {
                session:
                  josieSession,

                item,

                participants: [
                  "josie",
                  "marie",
                ],

                time:
                  "Friday at 8 PM",
              },
            )) as Result,
          );

        const plan =
          proposal.id as string;

        const josieProposedHome =
          valueOf(
            (await gateway.invoke(
              "/home",
              {
                session:
                  josieSession,
              },
            )) as Result,
          );

        const josiePlan =
          josieProposedHome
            .home
            .plans
            .find(
              (
                candidate:
                  Record<
                    string,
                    unknown
                  >,
              ) =>
                candidate.plan ===
                plan,
            );

        expect(
          josiePlan,
        ).toEqual(
          expect.objectContaining({
            organizer:
              "josie",

            response:
              "ACCEPTED",

            status:
              "PROPOSED",
          }),
        );

        const marieProposedHome =
          valueOf(
            (await gateway.invoke(
              "/home",
              {
                session:
                  marieSession,
              },
            )) as Result,
          );

        const mariePlan =
          marieProposedHome
            .home
            .plans
            .find(
              (
                candidate:
                  Record<
                    string,
                    unknown
                  >,
              ) =>
                candidate.plan ===
                plan,
            );

        expect(
          mariePlan,
        ).toEqual(
          expect.objectContaining({
            organizer:
              "josie",

            response:
              "PENDING",

            status:
              "PROPOSED",
          }),
        );

        valueOf(
          (await gateway.invoke(
            "/plans/respond",
            {
              session:
                marieSession,

              plan,

              response:
                "ACCEPTED",
            },
          )) as Result,
        );

        await gateway.whenIdle();

        const committedHome =
          valueOf(
            (await gateway.invoke(
              "/home",
              {
                session:
                  josieSession,
              },
            )) as Result,
          );

        const committedPlan =
          committedHome
            .home
            .plans
            .find(
              (
                candidate:
                  Record<
                    string,
                    unknown
                  >,
              ) =>
                candidate.plan ===
                plan,
            );

        expect(
          committedPlan,
        ).toEqual(
          expect.objectContaining({
            status:
              "COMMITTED",
          }),
        );

        valueOf(
          (await gateway.invoke(
            "/plans/complete",
            {
              session:
                josieSession,

              plan,
            },
          )) as Result,
        );

        await gateway.whenIdle();

        const josieFinalHome =
          valueOf(
            (await gateway.invoke(
              "/home",
              {
                session:
                  josieSession,
              },
            )) as Result,
          );

        const marieFinalHome =
          valueOf(
            (await gateway.invoke(
              "/home",
              {
                session:
                  marieSession,
              },
            )) as Result,
          );

        expect(
          josieFinalHome
            .home
            .intentions,
        ).toHaveLength(0);

        expect(
          marieFinalHome
            .home
            .intentions,
        ).toHaveLength(0);

        expect(
          josieFinalHome
            .home
            .sharedIntentions,
        ).toHaveLength(0);

        const completedPlan =
          josieFinalHome
            .home
            .plans
            .find(
              (
                candidate:
                  Record<
                    string,
                    unknown
                  >,
              ) =>
                candidate.plan ===
                plan,
            );

        expect(
          completedPlan,
        ).toEqual(
          expect.objectContaining({
            status:
              "COMPLETED",
          }),
        );
      },
    );
  },
);