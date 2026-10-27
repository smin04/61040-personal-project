import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { makeFixture, register, connect, valueOf, expectFailure, type Result } from "./fixtures.ts";

const fixture = makeFixture("weshould_group_plan_test");

describe("WeShould group plans", () => {
  beforeAll(async () => { await fixture.connect(); });
  beforeEach(async () => { await fixture.reset(); });
  afterAll(async () => { await fixture.close(); });

  test("group members see everyone invited even without friendships between invitees", async () => {
    const gateway = createGateway<any>({ application: fixture.makeApplication() });
    const josie = await register(gateway, "josie");
    const marie = await register(gateway, "marie");
    const alex = await register(gateway, "alex");
    await connect(gateway, josie, marie, "marie");
    await connect(gateway, josie, alex, "alex");
    // Marie and Alex deliberately do not connect to each other.
    for (const session of [josie, marie, alex]) {
      valueOf((await gateway.invoke("/intentions/express", {
        session, name: "Dalia", reference: "https://example.com/dalia"
      })) as Result);
    }
    const item = valueOf((await gateway.invoke("/home", { session: josie })) as Result).home.intentions[0].item;
    const plan = valueOf((await gateway.invoke("/plans/propose", {
      session: josie, item, participants: ["josie", "marie", "alex"], time: "Friday at 8 PM"
    })) as Result).id;
    for (const session of [josie, marie, alex]) {
      const home = valueOf((await gateway.invoke("/home", { session })) as Result).home;
      const entry = home.plans.find((p: any) => p.plan === plan);
      expect(entry).toBeDefined();
      expect([...entry.participants].sort()).toEqual(["alex", "josie", "marie"]);
    }
    valueOf((await gateway.invoke("/plans/respond", { session: marie, plan, response: "ACCEPTED" })) as Result);
    await gateway.whenIdle();
    let home = valueOf((await gateway.invoke("/home", { session: josie })) as Result).home;
    expect(home.plans.find((p: any) => p.plan === plan).status).toBe("PROPOSED");
    valueOf((await gateway.invoke("/plans/respond", { session: alex, plan, response: "ACCEPTED" })) as Result);
    await gateway.whenIdle();
    home = valueOf((await gateway.invoke("/home", { session: marie })) as Result).home;
    expect(home.plans.find((p: any) => p.plan === plan).status).toBe("COMMITTED");
  });

  test("organizer cannot add an unsaved or unconnected participant", async () => {
    const gateway = createGateway<any>({ application: fixture.makeApplication() });
    const josie = await register(gateway, "josie");
    const marie = await register(gateway, "marie");
    const alex = await register(gateway, "alex");
    await connect(gateway, josie, marie, "marie");
    for (const session of [josie, marie, alex]) {
      valueOf((await gateway.invoke("/intentions/express", {
        session, name: "Dalia", reference: "https://example.com/dalia"
      })) as Result);
    }
    const item = valueOf((await gateway.invoke("/home", { session: josie })) as Result).home.intentions[0].item;
    expectFailure((await gateway.invoke("/plans/propose", {
      session: josie, item, participants: ["josie", "marie", "alex"], time: "Friday"
    })) as Result);
  });
});
