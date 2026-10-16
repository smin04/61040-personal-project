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
  AlreadyIntending,
  IntendingConcept,
  IntentionNotFound,
} from "../../src/concepts/Intending.ts";

const url =
  process.env.MONGODB_URL ??
  "mongodb://dev:dev@127.0.0.1:27017/weshould?authSource=admin";

const client = new MongoClient(url);
const db = client.db("weshould_test");

describe("Intending", () => {
  let concept: IntendingConcept;

  beforeAll(async () => {
    await client.connect();
  });

  beforeEach(async () => {
    await db.dropDatabase();

    let next = 0;

    concept = new IntendingConcept(
      db,
      "IntendingTest",
      () => `intention-${++next}`,
    );
  });

  afterAll(async () => {
    await client.close();
  });

  test("express creates an intention", async () => {
    const result = await concept.express({
      user: "josie",
      item: "wallys",
    });

    expect(result).toEqual({
      intention: "intention-1",
    });
  });

  test("a user cannot express the same intention twice", async () => {
    await concept.express({
      user: "josie",
      item: "wallys",
    });

    await expect(
      concept.express({
        user: "josie",
        item: "wallys",
      }),
    ).rejects.toBeInstanceOf(AlreadyIntending);
  });

  test("different users can intend the same item", async () => {
    const first = await concept.express({
      user: "josie",
      item: "wallys",
    });

    const second = await concept.express({
      user: "marie",
      item: "wallys",
    });

    expect(first.intention).not.toBe(second.intention);
  });

  test("one user can intend different items", async () => {
    const first = await concept.express({
      user: "josie",
      item: "wallys",
    });

    const second = await concept.express({
      user: "josie",
      item: "pottery",
    });

    expect(first.intention).not.toBe(second.intention);
  });

  test("_has reports whether an intention exists", async () => {
    expect(
      await concept._has({
        user: "josie",
        item: "wallys",
      }),
    ).toEqual({
      active: false,
    });

    await concept.express({
      user: "josie",
      item: "wallys",
    });

    expect(
      await concept._has({
        user: "josie",
        item: "wallys",
      }),
    ).toEqual({
      active: true,
    });
  });

  test("_byUser returns that user's intentions", async () => {
    await concept.express({
      user: "josie",
      item: "wallys",
    });

    await concept.express({
      user: "josie",
      item: "pottery",
    });

    await concept.express({
      user: "marie",
      item: "concert",
    });

    const result = await concept._byUser({
      user: "josie",
    });

    expect(result).toHaveLength(2);

    expect(result.map((row) => row.item).sort()).toEqual([
      "pottery",
      "wallys",
    ]);
  });

  test("_forItem returns everyone intending an item", async () => {
    await concept.express({
      user: "josie",
      item: "wallys",
    });

    await concept.express({
      user: "marie",
      item: "wallys",
    });

    await concept.express({
      user: "alex",
      item: "pottery",
    });

    const result = await concept._forItem({
      item: "wallys",
    });

    expect(result).toHaveLength(2);

    expect(result.map((row) => row.user).sort()).toEqual([
      "josie",
      "marie",
    ]);
  });

  test("withdraw removes an active intention", async () => {
    const { intention } = await concept.express({
      user: "josie",
      item: "wallys",
    });

    await concept.withdraw({
      intention,
    });

    expect(
      await concept._has({
        user: "josie",
        item: "wallys",
      }),
    ).toEqual({
      active: false,
    });
  });

  test("withdraw refuses an unknown intention", async () => {
    await expect(
      concept.withdraw({
        intention: "does-not-exist",
      }),
    ).rejects.toBeInstanceOf(IntentionNotFound);
  });

  test("a withdrawn intention can be expressed again", async () => {
    const first = await concept.express({
      user: "josie",
      item: "wallys",
    });

    await concept.withdraw({
      intention: first.intention,
    });

    const second = await concept.express({
      user: "josie",
      item: "wallys",
    });

    expect(second.intention).not.toBe(first.intention);
  });
});