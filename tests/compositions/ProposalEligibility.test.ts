import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import {
  makeFixture, valueOf, expectFailure, register, connect,
  createSharedIntention, proposeSharedPlan, type Result,
} from "./fixtures.ts";

const fixture = makeFixture("weshould_proposaleligibility_test");
const makeApplication = fixture.makeApplication;

describe("WeShould proposaleligibility", () => {
  beforeAll(async () => { await fixture.connect(); });
  beforeEach(async () => { await fixture.reset(); });
  afterAll(async () => { await fixture.close(); });

    test("a stranger cannot propose even with a matching saved item", async () => {
      const gateway = createGateway<any>({ application: makeApplication() });
      const josie = await register(gateway, "josie");
      const marie = await register(gateway, "marie");
      valueOf((await gateway.invoke("/intentions/express", { session: josie, name: "Concert", reference: "https://example.com/concert" })) as Result);
      valueOf((await gateway.invoke("/intentions/express", { session: marie, name: "Concert", reference: "https://example.com/concert" })) as Result);
      const home = valueOf((await gateway.invoke("/home", { session: josie })) as Result).home;
      const item = home.intentions[0].item;
      expectFailure((await gateway.invoke("/plans/propose", { session: josie, item, participants: ["josie", "marie"], time: "Tomorrow" })) as Result);
    });

    test("a connected friend must independently save the activity", async () => {
      const gateway = createGateway<any>({ application: makeApplication() });
      const josie = await register(gateway, "josie");
      const marie = await register(gateway, "marie");
      await connect(gateway, josie, marie, "marie");
      valueOf((await gateway.invoke("/intentions/express", { session: josie, name: "Concert", reference: "https://example.com/concert" })) as Result);
      const home = valueOf((await gateway.invoke("/home", { session: josie })) as Result).home;
      const item = home.intentions[0].item;
      expectFailure((await gateway.invoke("/plans/propose", { session: josie, item, participants: ["josie", "marie"], time: "Tomorrow" })) as Result);
    });
});
