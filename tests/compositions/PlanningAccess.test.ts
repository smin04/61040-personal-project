import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import {
  makeFixture, valueOf, expectFailure, register, connect,
  createSharedIntention, proposeSharedPlan, type Result,
} from "./fixtures.ts";

const fixture = makeFixture("weshould_planningaccess_test");
const makeApplication = fixture.makeApplication;

describe("WeShould planningaccess", () => {
  beforeAll(async () => { await fixture.connect(); });
  beforeEach(async () => { await fixture.reset(); });
  afterAll(async () => { await fixture.close(); });

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
});
