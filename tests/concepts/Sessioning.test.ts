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
  SessioningConcept,
  UnknownSession,
} from "../../src/concepts/Sessioning.ts";

const url =
  process.env.MONGODB_URL ??
  "mongodb://dev:dev@127.0.0.1:27017/weshould?authSource=admin";

const client = new MongoClient(url);
const db = client.db("weshould_test");

describe("Sessioning", () => {
  let now: Date;
  let concept: SessioningConcept;

  beforeAll(async () => {
    await client.connect();
  });

  beforeEach(async () => {
    await db.dropDatabase();

    now = new Date("2026-10-15T18:00:00Z");

    let next = 0;

    concept = new SessioningConcept(
      db,
      "SessioningTest",
      () => now,
      () => `session-${++next}`,
    );
  });

  afterAll(async () => {
    await client.close();
  });

  test("start creates a session", async () => {
    const result = await concept.start({
      subject: "josie",
    });

    expect(result.session).toBe("session-1");

    expect(result.expiresAt).toEqual(
      new Date("2026-10-15T18:30:00Z"),
    );
  });

  test("current returns the session subject", async () => {
    const { session } = await concept.start({
      subject: "josie",
    });

    expect(
      await concept.current({
        session,
      }),
    ).toEqual({
      subject: "josie",
    });
  });

  test("_active returns the active session", async () => {
    const { session } = await concept.start({
      subject: "josie",
    });

    expect(
      await concept._active({
        session,
      }),
    ).toEqual([
      {
        subject: "josie",
        expiresAt: new Date("2026-10-15T18:30:00Z"),
      },
    ]);
  });

  test("_active returns no row for unknown session", async () => {
    expect(
      await concept._active({
        session: "missing",
      }),
    ).toEqual([]);
  });

  test("end removes an active session", async () => {
    const { session } = await concept.start({
      subject: "josie",
    });

    expect(
      await concept.end({
        session,
      }),
    ).toEqual({
      ended: true,
    });

    expect(
      await concept._active({
        session,
      }),
    ).toEqual([]);
  });

  test("current refuses an ended session", async () => {
    const { session } = await concept.start({
      subject: "josie",
    });

    await concept.end({
      session,
    });

    await expect(
      concept.current({
        session,
      }),
    ).rejects.toBeInstanceOf(UnknownSession);
  });

  test("current refuses an unknown session", async () => {
    await expect(
      concept.current({
        session: "missing",
      }),
    ).rejects.toBeInstanceOf(UnknownSession);
  });

  test("expired session is not active", async () => {
    const { session } = await concept.start({
      subject: "josie",
    });

    now = new Date("2026-10-15T18:31:00Z");

    expect(
      await concept._active({
        session,
      }),
    ).toEqual([]);
  });

  test("current refuses an expired session", async () => {
    const { session } = await concept.start({
      subject: "josie",
    });

    now = new Date("2026-10-15T18:31:00Z");

    await expect(
      concept.current({
        session,
      }),
    ).rejects.toBeInstanceOf(UnknownSession);
  });

  test("end refuses an expired session", async () => {
    const { session } = await concept.start({
      subject: "josie",
    });

    now = new Date("2026-10-15T18:31:00Z");

    await expect(
      concept.end({
        session,
      }),
    ).rejects.toBeInstanceOf(UnknownSession);
  });

  test("sessions persist across concept instances", async () => {
    const { session } = await concept.start({
      subject: "josie",
    });

    const anotherInstance = new SessioningConcept(
      db,
      "SessioningTest",
      () => now,
    );

    expect(
      await anotherInstance.current({
        session,
      }),
    ).toEqual({
      subject: "josie",
    });
  });
});