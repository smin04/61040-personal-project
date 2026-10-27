import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import {
  makeFixture, valueOf, expectFailure, register, connect,
  createSharedIntention, proposeSharedPlan, type Result,
} from "./fixtures.ts";

const fixture = makeFixture("weshould_connections_test");
const makeApplication = fixture.makeApplication;

describe("WeShould connections", () => {
  beforeAll(async () => { await fixture.connect(); });
  beforeEach(async () => { await fixture.reset(); });
  afterAll(async () => { await fixture.close(); });

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
});
