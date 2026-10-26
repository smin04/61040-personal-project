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
  InvalidResponse,
  NotAllAccepted,
  NotParticipant,
  OrganizerNotParticipant,
  PlanClosed,
  PlanningConcept,
  PlanNotCommitted,
  PlanNotFound,
  PlanNotProposed,
  TooFewParticipants,
} from "../../src/concepts/Planning.ts";

const url =
  process.env.MONGODB_URL ??
  "mongodb://dev:dev@127.0.0.1:27017/weshould?authSource=admin";

const client = new MongoClient(url);
const db = client.db("weshould_test");

describe("Planning", () => {
  let concept: PlanningConcept;

  beforeAll(async () => {
    await client.connect();
  });

  beforeEach(async () => {
    await db.dropDatabase();

    let next = 0;

    concept = new PlanningConcept(
      db,
      "PlanningTest",
      () => `plan-${++next}`,
    );
  });

  afterAll(async () => {
    await client.close();
  });

  test("propose creates a proposed plan", async () => {
    const result = await concept.propose({
      organizer: "josie",
      item: "wallys",
      participants: ["josie", "marie"],
      time: "Friday 8 PM",
    });

    expect(result).toEqual({
      plan: "plan-1",
    });

    expect(
      await concept._get({
        plan: result.plan,
      }),
    ).toEqual([
      {
        organizer: "josie",
        item: "wallys",
        time: "Friday 8 PM",
        participants: ["josie", "marie"],
        status: "PROPOSED",
      },
    ]);
  });

  test("organizer must be a participant", async () => {
    await expect(
      concept.propose({
        organizer: "josie",
        item: "wallys",
        participants: ["marie", "alex"],
        time: "Friday 8 PM",
      }),
    ).rejects.toBeInstanceOf(
      OrganizerNotParticipant,
    );
  });

  test("a plan needs at least two distinct participants", async () => {
    await expect(
      concept.propose({
        organizer: "josie",
        item: "wallys",
        participants: ["josie", "josie"],
        time: "Friday 8 PM",
      }),
    ).rejects.toBeInstanceOf(
      TooFewParticipants,
    );
  });

  test("organizer begins accepted and other participants begin pending", async () => {
    const { plan } = await concept.propose({
      organizer: "josie",
      item: "wallys",
      participants: ["josie", "marie", "alex"],
      time: "Friday 8 PM",
    });

    expect(
      await concept._responses({ plan }),
    ).toEqual([
      {
        user: "alex",
        response: "PENDING",
      },
      {
        user: "josie",
        response: "ACCEPTED",
      },
      {
        user: "marie",
        response: "PENDING",
      },
    ]);
  });

  test("participant can accept a proposed plan", async () => {
    const { plan } = await concept.propose({
      organizer: "josie",
      item: "wallys",
      participants: ["josie", "marie"],
      time: "Friday 8 PM",
    });

    await concept.respond({
      user: "marie",
      plan,
      response: "ACCEPTED",
    });

    expect(
      await concept._responses({ plan }),
    ).toEqual([
      {
        user: "josie",
        response: "ACCEPTED",
      },
      {
        user: "marie",
        response: "ACCEPTED",
      },
    ]);
  });

  test("participant can decline a proposed plan", async () => {
    const { plan } = await concept.propose({
      organizer: "josie",
      item: "wallys",
      participants: ["josie", "marie"],
      time: "Friday 8 PM",
    });

    await concept.respond({
      user: "marie",
      plan,
      response: "DECLINED",
    });

    const responses =
      await concept._responses({ plan });

    expect(responses).toContainEqual({
      user: "marie",
      response: "DECLINED",
    });
  });

  test("respond refuses an unknown plan", async () => {
    await expect(
      concept.respond({
        user: "marie",
        plan: "missing",
        response: "ACCEPTED",
      }),
    ).rejects.toBeInstanceOf(
      PlanNotFound,
    );
  });

  test("non-participant cannot respond", async () => {
    const { plan } = await concept.propose({
      organizer: "josie",
      item: "wallys",
      participants: ["josie", "marie"],
      time: "Friday 8 PM",
    });

    await expect(
      concept.respond({
        user: "alex",
        plan,
        response: "ACCEPTED",
      }),
    ).rejects.toBeInstanceOf(
      NotParticipant,
    );
  });

  test("PENDING is not a valid participant response", async () => {
    const { plan } = await concept.propose({
      organizer: "josie",
      item: "wallys",
      participants: ["josie", "marie"],
      time: "Friday 8 PM",
    });

    await expect(
      concept.respond({
        user: "marie",
        plan,
        response: "PENDING",
      }),
    ).rejects.toBeInstanceOf(
      InvalidResponse,
    );
  });

  test("_allAccepted is false while someone is pending", async () => {
    const { plan } = await concept.propose({
      organizer: "josie",
      item: "wallys",
      participants: ["josie", "marie"],
      time: "Friday 8 PM",
    });

    expect(
      await concept._allAccepted({ plan }),
    ).toEqual({
      accepted: false,
    });
  });

  test("_allAccepted becomes true after everyone accepts", async () => {
    const { plan } = await concept.propose({
      organizer: "josie",
      item: "wallys",
      participants: ["josie", "marie"],
      time: "Friday 8 PM",
    });

    await concept.respond({
      user: "marie",
      plan,
      response: "ACCEPTED",
    });

    expect(
      await concept._allAccepted({ plan }),
    ).toEqual({
      accepted: true,
    });
  });

  test("_allAccepted is false for an unknown plan", async () => {
    expect(
      await concept._allAccepted({
        plan: "missing",
      }),
    ).toEqual({
      accepted: false,
    });
  });

  test("cannot commit until every participant accepts", async () => {
    const { plan } = await concept.propose({
      organizer: "josie",
      item: "wallys",
      participants: ["josie", "marie"],
      time: "Friday 8 PM",
    });

    await expect(
      concept.commit({ plan }),
    ).rejects.toBeInstanceOf(
      NotAllAccepted,
    );
  });

  test("plan can be committed after everyone accepts", async () => {
    const { plan } = await concept.propose({
      organizer: "josie",
      item: "wallys",
      participants: ["josie", "marie"],
      time: "Friday 8 PM",
    });

    await concept.respond({
      user: "marie",
      plan,
      response: "ACCEPTED",
    });

    await concept.commit({ plan });

    const result = await concept._get({
      plan,
    });

    expect(result[0].status).toBe(
      "COMMITTED",
    );
  });

  test("responses cannot change after commitment", async () => {
    const { plan } = await concept.propose({
      organizer: "josie",
      item: "wallys",
      participants: ["josie", "marie"],
      time: "Friday 8 PM",
    });

    await concept.respond({
      user: "marie",
      plan,
      response: "ACCEPTED",
    });

    await concept.commit({ plan });

    await expect(
      concept.respond({
        user: "marie",
        plan,
        response: "DECLINED",
      }),
    ).rejects.toBeInstanceOf(
      PlanNotProposed,
    );
  });

  test("participant can cancel a proposed plan", async () => {
    const { plan } = await concept.propose({
      organizer: "josie",
      item: "wallys",
      participants: ["josie", "marie"],
      time: "Friday 8 PM",
    });

    await concept.cancel({
      user: "marie",
      plan,
    });

    const result = await concept._get({
      plan,
    });

    expect(result[0].status).toBe(
      "CANCELLED",
    );
  });

  test("participant can cancel a committed plan", async () => {
    const { plan } = await concept.propose({
      organizer: "josie",
      item: "wallys",
      participants: ["josie", "marie"],
      time: "Friday 8 PM",
    });

    await concept.respond({
      user: "marie",
      plan,
      response: "ACCEPTED",
    });

    await concept.commit({ plan });

    await concept.cancel({
      user: "josie",
      plan,
    });

    const result = await concept._get({
      plan,
    });

    expect(result[0].status).toBe(
      "CANCELLED",
    );
  });

  test("non-participant cannot cancel", async () => {
    const { plan } = await concept.propose({
      organizer: "josie",
      item: "wallys",
      participants: ["josie", "marie"],
      time: "Friday 8 PM",
    });

    await expect(
      concept.cancel({
        user: "alex",
        plan,
      }),
    ).rejects.toBeInstanceOf(
      NotParticipant,
    );
  });

  test("cancelled plan cannot be cancelled again", async () => {
    const { plan } = await concept.propose({
      organizer: "josie",
      item: "wallys",
      participants: ["josie", "marie"],
      time: "Friday 8 PM",
    });

    await concept.cancel({
      user: "josie",
      plan,
    });

    await expect(
      concept.cancel({
        user: "marie",
        plan,
      }),
    ).rejects.toBeInstanceOf(
      PlanClosed,
    );
  });

  test("only a committed plan can be completed", async () => {
    const { plan } = await concept.propose({
      organizer: "josie",
      item: "wallys",
      participants: ["josie", "marie"],
      time: "Friday 8 PM",
    });

    await expect(
      concept.complete({ plan, user: "josie" }),
    ).rejects.toBeInstanceOf(
      PlanNotCommitted,
    );
  });

  test("committed plan can be completed", async () => {
    const { plan } = await concept.propose({
      organizer: "josie",
      item: "wallys",
      participants: ["josie", "marie"],
      time: "Friday 8 PM",
    });

    await concept.respond({
      user: "marie",
      plan,
      response: "ACCEPTED",
    });

    await concept.commit({ plan });

    await concept.complete({ plan, user: "josie" });

    const result = await concept._get({
      plan,
    });

    expect(result[0].status).toBe(
      "COMPLETED",
    );
  });

  test("_forUser returns plans containing that user", async () => {
    const first = await concept.propose({
      organizer: "josie",
      item: "wallys",
      participants: ["josie", "marie"],
      time: "Friday 8 PM",
    });

    await concept.propose({
      organizer: "alex",
      item: "concert",
      participants: ["alex", "marie"],
      time: "Saturday 9 PM",
    });

    const result = await concept._forUser({
      user: "josie",
    });

    expect(result).toEqual([
      {
        plan: first.plan,
        item: "wallys",
        time: "Friday 8 PM",
        status: "PROPOSED",
      },
    ]);
  });

  test("_get returns no row for an unknown plan", async () => {
    expect(
      await concept._get({
        plan: "missing",
      }),
    ).toEqual([]);
  });
});