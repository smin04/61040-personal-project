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
  AuthenticatingConcept,
  InvalidCredentials,
  InvalidUsername,
  UsernameTaken,
  WeakPassword,
} from "../../src/concepts/Authenticating.ts";

const url =
  process.env.MONGODB_URL ??
  "mongodb://dev:dev@127.0.0.1:27017/weshould?authSource=admin";

const client = new MongoClient(url);
const db = client.db("weshould_test");

describe("Authenticating", () => {
  let concept: AuthenticatingConcept;

  beforeAll(async () => {
    await client.connect();
  });

  beforeEach(async () => {
    await db.dropDatabase();

    let next = 0;

    concept = new AuthenticatingConcept(
      db,
      "AuthenticatingTest",
      () => `salt-${++next}`,
    );
  });

  afterAll(async () => {
    await client.close();
  });

  test("register creates an account", async () => {
    const result = await concept.register({
      username: "josie",
      password: "password123",
    });

    expect(result).toEqual({
      account: "josie",
    });
  });

  test("_registered reports whether a username exists", async () => {
    expect(
      await concept._registered({
        username: "josie",
      }),
    ).toEqual({
      registered: false,
    });

    await concept.register({
      username: "josie",
      password: "password123",
    });

    expect(
      await concept._registered({
        username: "josie",
      }),
    ).toEqual({
      registered: true,
    });
  });

  test("invalid username is refused", async () => {
    await expect(
      concept.register({
        username: "x",
        password: "password123",
      }),
    ).rejects.toBeInstanceOf(
      InvalidUsername,
    );
  });

  test("weak password is refused", async () => {
    await expect(
      concept.register({
        username: "josie",
        password: "short",
      }),
    ).rejects.toBeInstanceOf(
      WeakPassword,
    );
  });

  test("duplicate username is refused", async () => {
    await concept.register({
      username: "josie",
      password: "password123",
    });

    await expect(
      concept.register({
        username: "josie",
        password: "differentPassword",
      }),
    ).rejects.toBeInstanceOf(
      UsernameTaken,
    );
  });

  test("correct credentials authenticate", async () => {
    await concept.register({
      username: "josie",
      password: "password123",
    });

    const result = await concept.authenticate({
      username: "josie",
      password: "password123",
    });

    expect(result).toEqual({
      account: "josie",
    });
  });

  test("wrong password is refused", async () => {
    await concept.register({
      username: "josie",
      password: "password123",
    });

    await expect(
      concept.authenticate({
        username: "josie",
        password: "wrongPassword",
      }),
    ).rejects.toBeInstanceOf(
      InvalidCredentials,
    );
  });

  test("unknown username is refused", async () => {
    await expect(
      concept.authenticate({
        username: "marie",
        password: "password123",
      }),
    ).rejects.toBeInstanceOf(
      InvalidCredentials,
    );
  });

  test("password verifier persists across concept instances", async () => {
    await concept.register({
      username: "josie",
      password: "password123",
    });

    const anotherInstance =
      new AuthenticatingConcept(
        db,
        "AuthenticatingTest",
      );

    const result =
      await anotherInstance.authenticate({
        username: "josie",
        password: "password123",
      });

    expect(result).toEqual({
      account: "josie",
    });
  });
});