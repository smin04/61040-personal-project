import { beforeAll, beforeEach, afterAll, describe, expect, test } from "bun:test";
import { MongoClient } from "mongodb";

import {
  ResolvingConcept,
  ItemNotFound,
} from "../../src/concepts/Resolving.ts";

const url =
  process.env.MONGODB_URL ??
  "mongodb://dev:dev@127.0.0.1:27017/weshould?authSource=admin";

const client = new MongoClient(url);
const db = client.db("weshould_test");

describe("Resolving", () => {
  let concept: ResolvingConcept;

  beforeAll(async () => {
    await client.connect();
  });

  beforeEach(async () => {
    await db.dropDatabase();

    let next = 0;
    concept = new ResolvingConcept(
      db,
      "ResolvingTest",
      () => `id-${++next}`,
    );
  });

  afterAll(async () => {
    await client.close();
  });

  test("resolving a new reference creates an item", async () => {
    const result = await concept.resolve({
      reference: "https://example.com/wallys",
    });

    expect(result.item).toBe("id-1");
  });

  test("resolving the same reference returns the same item", async () => {
    const first = await concept.resolve({
      reference: "https://example.com/wallys",
    });

    const second = await concept.resolve({
      reference: "https://example.com/wallys",
    });

    expect(second.item).toBe(first.item);
  });

  test("different references create different items", async () => {
    const first = await concept.resolve({
      reference: "https://example.com/wallys",
    });

    const second = await concept.resolve({
      reference: "https://example.com/pottery",
    });

    expect(second.item).not.toBe(first.item);
  });

  test("associate points a reference at an existing item", async () => {
    const { item } = await concept.resolve({
      reference: "https://example.com/wallys",
    });

    await concept.associate({
      reference: "https://instagram.com/wallys",
      item,
    });

    const result = await concept._item({
      reference: "https://instagram.com/wallys",
    });

    expect(result).toEqual([{ item }]);
  });

  test("associate refuses an unknown item", async () => {
    await expect(
      concept.associate({
        reference: "https://example.com/unknown",
        item: "missing-item",
      }),
    ).rejects.toBeInstanceOf(ItemNotFound);
  });

  test("_references returns references in deterministic order", async () => {
    const { item } = await concept.resolve({
      reference: "https://example.com/wallys",
    });

    await concept.associate({
      reference: "https://b.example.com/wallys",
      item,
    });

    await concept.associate({
      reference: "https://a.example.com/wallys",
      item,
    });

    const refs = await concept._references({ item });

    expect(refs).toEqual([
      { reference: "https://a.example.com/wallys" },
      { reference: "https://b.example.com/wallys" },
      { reference: "https://example.com/wallys" },
    ]);
  });
});