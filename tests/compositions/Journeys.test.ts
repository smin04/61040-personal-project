import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import {
  makeFixture, valueOf, expectFailure, register, connect,
  createSharedIntention, proposeSharedPlan, type Result,
} from "./fixtures.ts";

const fixture = makeFixture("weshould_journeys_test");
const makeApplication = fixture.makeApplication;

describe("WeShould journeys", () => {
  beforeAll(async () => { await fixture.connect(); });
  beforeEach(async () => { await fixture.reset(); });
  afterAll(async () => { await fixture.close(); });

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
});
