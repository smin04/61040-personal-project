import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";

import { MongoClient } from "mongodb";

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
      value: Record<string, any>;
    }
  | {
      ok: false;
      error: unknown;
    };

function valueOf(
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

function expectFailure(
  result: Result,
) {
  expect(result.ok).toBe(false);
}

function makeApplication() {
  return assemble({
    conceptSet:
      applicationConceptSet,

    instances:
      applicationConceptSet.implementations(
        "mongo",
        { db },
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

async function register(
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

async function connect(
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

async function createSharedIntention(
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

async function proposeSharedPlan(
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

describe(
  "WeShould application journeys",
  () => {
    beforeAll(async () => {
      await client.connect();
    });

    beforeEach(async () => {
      await db.dropDatabase();
    });

    afterAll(async () => {
      await client.close();
    });

    test(
      "independent intentions become a committed and completed plan",
      async () => {
        const application =
          makeApplication();

        const gateway =
          createGateway<any>({
            application,
          });

        const josieSession =
          await register(
            gateway,
            "josie",
          );

        const marieSession =
          await register(
            gateway,
            "marie",
          );

        await connect(
          gateway,
          josieSession,
          marieSession,
          "marie",
        );

        const shared =
          await createSharedIntention(
            gateway,
            josieSession,
            marieSession,
          );

        expect(shared).toEqual(
          expect.objectContaining({
            peer: "marie",
            name: "Wally's Cafe",
          }),
        );

        const plan =
          await proposeSharedPlan(
            gateway,
            josieSession,
            shared.item as string,
          );

        const josieProposedHome =
          valueOf(
            (await gateway.invoke(
              "/home",
              {
                session:
                  josieSession,
              },
            )) as Result,
          ).home;

        expect(
          josieProposedHome.plans.find(
            (candidate: Record<string, unknown>) =>
              candidate.plan === plan,
          ),
        ).toEqual(
          expect.objectContaining({
            organizer: "josie",
            response: "ACCEPTED",
            status: "PROPOSED",
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
          ).home;

        expect(
          marieProposedHome.plans.find(
            (candidate: Record<string, unknown>) =>
              candidate.plan === plan,
          ),
        ).toEqual(
          expect.objectContaining({
            organizer: "josie",
            response: "PENDING",
            status: "PROPOSED",
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
          ).home;

        expect(
          committedHome.plans.find(
            (candidate: Record<string, unknown>) =>
              candidate.plan === plan,
          ),
        ).toEqual(
          expect.objectContaining({
            status: "COMMITTED",
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
          ).home;

        const marieFinalHome =
          valueOf(
            (await gateway.invoke(
              "/home",
              {
                session:
                  marieSession,
              },
            )) as Result,
          ).home;

        expect(
          josieFinalHome.intentions,
        ).toHaveLength(0);

        expect(
          marieFinalHome.intentions,
        ).toHaveLength(0);

        expect(
          josieFinalHome.sharedIntentions,
        ).toHaveLength(0);

        expect(
          josieFinalHome.plans.find(
            (candidate: Record<string, unknown>) =>
              candidate.plan === plan,
          ),
        ).toEqual(
          expect.objectContaining({
            status: "COMPLETED",
          }),
        );
      },
    );

    test(
      "someone other than the recipient cannot accept a connection request",
      async () => {
        const application =
          makeApplication();

        const gateway =
          createGateway<any>({
            application,
          });

        const josieSession =
          await register(
            gateway,
            "josie",
          );

        const marieSession =
          await register(
            gateway,
            "marie",
          );

        const alexSession =
          await register(
            gateway,
            "alex",
          );

        const request =
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
          ).id as string;

        expectFailure(
          (await gateway.invoke(
            "/connections/accept",
            {
              session:
                alexSession,
              request,
            },
          )) as Result,
        );

        const marieHome =
          valueOf(
            (await gateway.invoke(
              "/home",
              {
                session:
                  marieSession,
              },
            )) as Result,
          ).home;

        expect(
          marieHome.pendingRequests,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              request,
              requester: "josie",
            }),
          ]),
        );

        expect(
          marieHome.connections,
        ).toHaveLength(0);
      },
    );

    test(
      "a nonparticipant cannot respond to or cancel another pair's plan",
      async () => {
        const application =
          makeApplication();

        const gateway =
          createGateway<any>({
            application,
          });

        const josieSession =
          await register(
            gateway,
            "josie",
          );

        const marieSession =
          await register(
            gateway,
            "marie",
          );

        const alexSession =
          await register(
            gateway,
            "alex",
          );

        await connect(
          gateway,
          josieSession,
          marieSession,
          "marie",
        );

        const shared =
          await createSharedIntention(
            gateway,
            josieSession,
            marieSession,
          );

        const plan =
          await proposeSharedPlan(
            gateway,
            josieSession,
            shared.item as string,
          );

        expectFailure(
          (await gateway.invoke(
            "/plans/respond",
            {
              session:
                alexSession,
              plan,
              response:
                "ACCEPTED",
            },
          )) as Result,
        );

        expectFailure(
          (await gateway.invoke(
            "/plans/cancel",
            {
              session:
                alexSession,
              plan,
            },
          )) as Result,
        );

        const marieHome =
          valueOf(
            (await gateway.invoke(
              "/home",
              {
                session:
                  marieSession,
              },
            )) as Result,
          ).home;

        expect(
          marieHome.plans.find(
            (candidate: Record<string, unknown>) =>
              candidate.plan === plan,
          ),
        ).toEqual(
          expect.objectContaining({
            status: "PROPOSED",
            response: "PENDING",
          }),
        );
      },
    );

    test(
      "cancelling a proposal preserves the weaker underlying intentions",
      async () => {
        const application =
          makeApplication();

        const gateway =
          createGateway<any>({
            application,
          });

        const josieSession =
          await register(
            gateway,
            "josie",
          );

        const marieSession =
          await register(
            gateway,
            "marie",
          );

        await connect(
          gateway,
          josieSession,
          marieSession,
          "marie",
        );

        const shared =
          await createSharedIntention(
            gateway,
            josieSession,
            marieSession,
          );

        const plan =
          await proposeSharedPlan(
            gateway,
            josieSession,
            shared.item as string,
          );

        valueOf(
          (await gateway.invoke(
            "/plans/cancel",
            {
              session:
                josieSession,
              plan,
            },
          )) as Result,
        );

        await gateway.whenIdle();

        const josieHome =
          valueOf(
            (await gateway.invoke(
              "/home",
              {
                session:
                  josieSession,
              },
            )) as Result,
          ).home;

        const marieHome =
          valueOf(
            (await gateway.invoke(
              "/home",
              {
                session:
                  marieSession,
              },
            )) as Result,
          ).home;

        expect(
          josieHome.intentions,
        ).toHaveLength(1);

        expect(
          marieHome.intentions,
        ).toHaveLength(1);

        expect(
          josieHome.sharedIntentions,
        ).toHaveLength(1);

        expect(
          josieHome.plans.find(
            (candidate: Record<string, unknown>) =>
              candidate.plan === plan,
          ),
        ).toEqual(
          expect.objectContaining({
            status: "CANCELLED",
          }),
        );
      },
    );

    test(
      "signing out invalidates the session",
      async () => {
        const application =
          makeApplication();

        const gateway =
          createGateway<any>({
            application,
          });

        const josieSession =
          await register(
            gateway,
            "josie",
          );

        valueOf(
          (await gateway.invoke(
            "/auth/sign-out",
            {
              session:
                josieSession,
            },
          )) as Result,
        );

        expectFailure(
          (await gateway.invoke(
            "/home",
            {
              session:
                josieSession,
            },
          )) as Result,
        );
      },
    );

    test(
      "an unknown session cannot read home state",
      async () => {
        const application =
          makeApplication();

        const gateway =
          createGateway<any>({
            application,
          });

        expectFailure(
          (await gateway.invoke(
            "/home",
            {
              session:
                "missing-session",
            },
          )) as Result,
        );
      },
    );
  },
);
