import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";

import {
  MongoClient,
} from "mongodb";

import {
  ItemNotFound,
  ResolvingConcept,
} from "../../src/concepts/Resolving.ts";

const url =
  process.env.MONGODB_URL ??
  "mongodb://dev:dev@127.0.0.1:27017/weshould?authSource=admin";

const client =
  new MongoClient(url);

const db =
  client.db(
    "weshould_test",
  );

describe("Resolving", () => {
  let concept:
    ResolvingConcept;

  beforeAll(async () => {
    await client.connect();
  });

  beforeEach(async () => {
    await db.dropDatabase();

    let next = 0;

    concept =
      new ResolvingConcept(
        db,
        "ResolvingTest",
        () =>
          `id-${++next}`,
      );
  });

  afterAll(async () => {
    await client.close();
  });

  test("Instagram reel share parameters resolve to the same post", async () => {
    const first = await concept.resolve({ reference: "https://www.instagram.com/reel/Cw123abc/?igsh=test" });
    const second = await concept.resolve({ reference: "https://instagram.com/reels/Cw123abc/?utm_source=copy" });
    expect(second.item).toBe(first.item);
  });

  test("TikTok variants with the same video ID resolve together", async () => {
    const first = await concept.resolve({ reference: "https://www.tiktok.com/@one/video/7422222222222222222?is_from_webapp=1" });
    const second = await concept.resolve({ reference: "https://m.tiktok.com/@other/video/7422222222222222222?share_id=x" });
    expect(second.item).toBe(first.item);
  });

  test(
    "resolving a new reference creates an item",
    async () => {
      const result =
        await concept.resolve({
          reference:
            "https://example.com/wallys",
        });

      expect(
        result.item,
      ).toBe("id-1");
    },
  );

  test(
    "resolving the same reference returns the same item",
    async () => {
      const first =
        await concept.resolve({
          reference:
            "https://example.com/wallys",
        });

      const second =
        await concept.resolve({
          reference:
            "https://example.com/wallys",
        });

      expect(
        second.item,
      ).toBe(
        first.item,
      );
    },
  );

  test(
    "normalized forms of the same URL return the same item",
    async () => {
      const first =
        await concept.resolve({
          reference:
            "https://EXAMPLE.com/wallys/#details",
        });

      const second =
        await concept.resolve({
          reference:
            "https://example.com/wallys",
        });

      expect(
        second.item,
      ).toBe(
        first.item,
      );
    },
  );

  test(
    "different references initially create different items",
    async () => {
      const first =
        await concept.resolve({
          reference:
            "https://example.com/wallys",
        });

      const second =
        await concept.resolve({
          reference:
            "https://example.com/pottery",
        });

      expect(
        second.item,
      ).not.toBe(
        first.item,
      );
    },
  );

  test(
    "describe stores a human-readable name and canonical reference",
    async () => {
      const {
        item,
      } =
        await concept.resolve({
          reference:
            "https://example.com/wallys",
        });

      const described =
        await concept.describe({
          item,
          name:
            "Wally's Cafe",
          reference:
            "https://example.com/wallys",
        });

      expect(
        described.resolved,
      ).toBe(item);

      expect(
        await concept._get({
          item,
        }),
      ).toEqual([
        {
          name:
            "Wally's Cafe",
          reference:
            "https://example.com/wallys",
        },
      ]);
    },
  );

  test(
    "the same normalized name merges different references into one item",
    async () => {
      const first =
        await concept.resolve({
          reference:
            "https://example.com/wallys",
        });

      const firstDescription =
        await concept.describe({
          item:
            first.item,
          name:
            "Wally's Cafe",
          reference:
            "https://example.com/wallys",
        });

      const second =
        await concept.resolve({
          reference:
            "https://instagram.com/wallys-cafe",
        });

      const secondDescription =
        await concept.describe({
          item:
            second.item,
          name:
            "  wallys   cafe  ",
          reference:
            "https://instagram.com/wallys-cafe",
        });

      expect(
        secondDescription.resolved,
      ).toBe(
        firstDescription.resolved,
      );

      const firstLookup =
        await concept._item({
          reference:
            "https://example.com/wallys",
        });

      const secondLookup =
        await concept._item({
          reference:
            "https://instagram.com/wallys-cafe",
        });

      expect(
        firstLookup,
      ).toEqual([
        {
          item:
            firstDescription.resolved,
        },
      ]);

      expect(
        secondLookup,
      ).toEqual([
        {
          item:
            firstDescription.resolved,
        },
      ]);
    },
  );

  test(
    "meaningfully different names do not merge different references",
    async () => {
      const first =
        await concept.resolve({
          reference:
            "https://example.com/wallys",
        });

      const firstDescription =
        await concept.describe({
          item:
            first.item,
          name:
            "Wally's Cafe",
          reference:
            "https://example.com/wallys",
        });

      const second =
        await concept.resolve({
          reference:
            "https://events.example.com/wallys-jazz-night",
        });

      const secondDescription =
        await concept.describe({
          item:
            second.item,
          name:
            "Wally's Cafe Jazz Night",
          reference:
            "https://events.example.com/wallys-jazz-night",
        });

      expect(
        secondDescription.resolved,
      ).not.toBe(
        firstDescription.resolved,
      );
    },
  );

  test(
    "associate points a reference at an existing item",
    async () => {
      const {
        item,
      } =
        await concept.resolve({
          reference:
            "https://example.com/wallys",
        });

      await concept.associate({
        reference:
          "https://instagram.com/wallys",
        item,
      });

      const result =
        await concept._item({
          reference:
            "https://instagram.com/wallys",
        });

      expect(
        result,
      ).toEqual([
        {
          item,
        },
      ]);
    },
  );

  test(
    "associate refuses an unknown item",
    async () => {
      await expect(
        concept.associate({
          reference:
            "https://example.com/unknown",
          item:
            "missing-item",
        }),
      ).rejects.toBeInstanceOf(
        ItemNotFound,
      );
    },
  );

  test(
    "_references returns references in deterministic order",
    async () => {
      const {
        item,
      } =
        await concept.resolve({
          reference:
            "https://example.com/wallys",
        });

      await concept.associate({
        reference:
          "https://b.example.com/wallys",
        item,
      });

      await concept.associate({
        reference:
          "https://a.example.com/wallys",
        item,
      });

      const refs =
        await concept._references({
          item,
        });

      expect(
        refs,
      ).toEqual([
        {
          reference:
            "https://a.example.com/wallys",
        },
        {
          reference:
            "https://b.example.com/wallys",
        },
        {
          reference:
            "https://example.com/wallys",
        },
      ]);
    },
  );
});