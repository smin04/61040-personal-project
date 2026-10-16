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
  AlreadyConnected,
  CannotConnectSelf,
  ConnectingConcept,
  ConnectionNotFound,
  NotConnectionMember,
  NotRequestRecipient,
  RequestExists,
  RequestNotFound,
} from "../../src/concepts/Connecting.ts";

const url =
  process.env.MONGODB_URL ??
  "mongodb://dev:dev@127.0.0.1:27017/weshould?authSource=admin";

const client = new MongoClient(url);
const db = client.db("weshould_test");

describe("Connecting", () => {
  let concept: ConnectingConcept;

  beforeAll(async () => {
    await client.connect();
  });

  beforeEach(async () => {
    await db.dropDatabase();

    let next = 0;

    concept = new ConnectingConcept(
      db,
      "ConnectingTest",
      () => `id-${++next}`,
    );
  });

  afterAll(async () => {
    await client.close();
  });

  test("request creates a connection request", async () => {
    const result = await concept.request({
      requester: "josie",
      recipient: "marie",
    });

    expect(result).toEqual({
      request: "id-1",
    });
  });

  test("a user cannot request themself", async () => {
    await expect(
      concept.request({
        requester: "josie",
        recipient: "josie",
      }),
    ).rejects.toBeInstanceOf(CannotConnectSelf);
  });

  test("the same request cannot be created twice", async () => {
    await concept.request({
      requester: "josie",
      recipient: "marie",
    });

    await expect(
      concept.request({
        requester: "josie",
        recipient: "marie",
      }),
    ).rejects.toBeInstanceOf(RequestExists);
  });

  test("_pendingFor returns requests for a recipient", async () => {
    await concept.request({
      requester: "josie",
      recipient: "marie",
    });

    await concept.request({
      requester: "alex",
      recipient: "marie",
    });

    const result = await concept._pendingFor({
      recipient: "marie",
    });

    expect(result).toHaveLength(2);

    expect(
      result.map((row) => row.requester).sort(),
    ).toEqual([
      "alex",
      "josie",
    ]);
  });

  test("recipient can accept a request", async () => {
    const { request } = await concept.request({
      requester: "josie",
      recipient: "marie",
    });

    const result = await concept.accept({
      recipient: "marie",
      request,
    });

    expect(result.connection).toBe("id-2");
  });

  test("someone other than the recipient cannot accept", async () => {
    const { request } = await concept.request({
      requester: "josie",
      recipient: "marie",
    });

    await expect(
      concept.accept({
        recipient: "alex",
        request,
      }),
    ).rejects.toBeInstanceOf(NotRequestRecipient);
  });

  test("accept refuses an unknown request", async () => {
    await expect(
      concept.accept({
        recipient: "marie",
        request: "missing",
      }),
    ).rejects.toBeInstanceOf(RequestNotFound);
  });

  test("accept creates a reciprocal connection", async () => {
    const { request } = await concept.request({
      requester: "josie",
      recipient: "marie",
    });

    await concept.accept({
      recipient: "marie",
      request,
    });

    expect(
      await concept._areConnected({
        first: "josie",
        second: "marie",
      }),
    ).toEqual({
      connected: true,
    });

    expect(
      await concept._areConnected({
        first: "marie",
        second: "josie",
      }),
    ).toEqual({
      connected: true,
    });
  });

  test("accepted request is no longer pending", async () => {
    const { request } = await concept.request({
      requester: "josie",
      recipient: "marie",
    });

    await concept.accept({
      recipient: "marie",
      request,
    });

    expect(
      await concept._pendingFor({
        recipient: "marie",
      }),
    ).toEqual([]);
  });

  test("_connections returns the peer from either side", async () => {
    const { request } = await concept.request({
      requester: "josie",
      recipient: "marie",
    });

    await concept.accept({
      recipient: "marie",
      request,
    });

    const josieConnections =
      await concept._connections({
        user: "josie",
      });

    const marieConnections =
      await concept._connections({
        user: "marie",
      });

    expect(josieConnections).toHaveLength(1);
    expect(josieConnections[0].peer).toBe("marie");

    expect(marieConnections).toHaveLength(1);
    expect(marieConnections[0].peer).toBe("josie");
  });

  test("connected users cannot create another request", async () => {
    const { request } = await concept.request({
      requester: "josie",
      recipient: "marie",
    });

    await concept.accept({
      recipient: "marie",
      request,
    });

    await expect(
      concept.request({
        requester: "josie",
        recipient: "marie",
      }),
    ).rejects.toBeInstanceOf(AlreadyConnected);
  });

  test("recipient can decline a request", async () => {
    const { request } = await concept.request({
      requester: "josie",
      recipient: "marie",
    });

    const result = await concept.decline({
      recipient: "marie",
      request,
    });

    expect(result).toEqual({
      request,
    });

    expect(
      await concept._pendingFor({
        recipient: "marie",
      }),
    ).toEqual([]);
  });

  test("someone other than the recipient cannot decline", async () => {
    const { request } = await concept.request({
      requester: "josie",
      recipient: "marie",
    });

    await expect(
      concept.decline({
        recipient: "alex",
        request,
      }),
    ).rejects.toBeInstanceOf(NotRequestRecipient);
  });

  test("a member can disconnect", async () => {
    const { request } = await concept.request({
      requester: "josie",
      recipient: "marie",
    });

    const { connection } = await concept.accept({
      recipient: "marie",
      request,
    });

    const result = await concept.disconnect({
      user: "josie",
      connection,
    });

    expect(result).toEqual({
      connection,
    });

    expect(
      await concept._areConnected({
        first: "josie",
        second: "marie",
      }),
    ).toEqual({
      connected: false,
    });
  });

  test("a non-member cannot disconnect users", async () => {
    const { request } = await concept.request({
      requester: "josie",
      recipient: "marie",
    });

    const { connection } = await concept.accept({
      recipient: "marie",
      request,
    });

    await expect(
      concept.disconnect({
        user: "alex",
        connection,
      }),
    ).rejects.toBeInstanceOf(NotConnectionMember);
  });

  test("disconnect refuses an unknown connection", async () => {
    await expect(
      concept.disconnect({
        user: "josie",
        connection: "missing",
      }),
    ).rejects.toBeInstanceOf(ConnectionNotFound);
  });
});