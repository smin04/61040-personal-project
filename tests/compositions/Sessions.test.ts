import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import {
  makeFixture, valueOf, expectFailure, register, connect,
  createSharedIntention, proposeSharedPlan, type Result,
} from "./fixtures.ts";

const fixture = makeFixture("weshould_sessions_test");
const makeApplication = fixture.makeApplication;

describe("WeShould sessions", () => {
  beforeAll(async () => { await fixture.connect(); });
  beforeEach(async () => { await fixture.reset(); });
  afterAll(async () => { await fixture.close(); });

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
});
