import type { Collection, Db } from "mongodb";

export class CannotConnectSelf extends Error {}
export class AlreadyConnected extends Error {}
export class RequestExists extends Error {}
export class RequestNotFound extends Error {}
export class NotRequestRecipient extends Error {}
export class ConnectionNotFound extends Error {}
export class NotConnectionMember extends Error {}

type RequestDocument = {
  request: string;
  requester: string;
  recipient: string;
};

type ConnectionDocument = {
  connection: string;
  first: string;
  second: string;
};

export class ConnectingConcept {
  private readonly requests: Collection<RequestDocument>;
  private readonly connections: Collection<ConnectionDocument>;
  private ready: Promise<unknown> | undefined;

  constructor(
    db: Db,
    namespace = "Connecting",
    private readonly freshID: () => string = () => crypto.randomUUID(),
  ) {
    this.requests = db.collection<RequestDocument>(
      `${namespace}.requests`,
    );

    this.connections = db.collection<ConnectionDocument>(
      `${namespace}.connections`,
    );
  }

  async request({
    requester,
    recipient,
  }: {
    requester: string;
    recipient: string;
  }): Promise<{ request: string }> {
    this.ready ??= Promise.all([
      this.requests.createIndex(
        { requester: 1, recipient: 1 },
        { unique: true },
      ),
      this.connections.createIndex(
        { first: 1, second: 1 },
        { unique: true },
      ),
    ]);

    await this.ready;

    if (requester === recipient) {
      throw new CannotConnectSelf(
        "A user cannot connect with themself.",
      );
    }

    const [first, second] =
      requester < recipient
        ? [requester, recipient]
        : [recipient, requester];

    const existingConnection =
      await this.connections.findOne({
        first,
        second,
      });

    if (existingConnection !== null) {
      throw new AlreadyConnected(
        "These users are already connected.",
      );
    }

    const existingRequest = await this.requests.findOne({
      requester,
      recipient,
    });

    if (existingRequest !== null) {
      throw new RequestExists(
        "This connection request already exists.",
      );
    }

    const request = this.freshID();

    try {
      await this.requests.insertOne({
        request,
        requester,
        recipient,
      });
    } catch (error) {
      const duplicate = await this.requests.findOne({
        requester,
        recipient,
      });

      if (duplicate !== null) {
        throw new RequestExists(
          "This connection request already exists.",
        );
      }

      throw error;
    }

    return { request };
  }

  async accept({
    recipient,
    request,
  }: {
    recipient: string;
    request: string;
  }): Promise<{ connection: string }> {
    this.ready ??= Promise.all([
      this.requests.createIndex(
        { requester: 1, recipient: 1 },
        { unique: true },
      ),
      this.connections.createIndex(
        { first: 1, second: 1 },
        { unique: true },
      ),
    ]);

    await this.ready;

    const found = await this.requests.findOne({
      request,
    });

    if (found === null) {
      throw new RequestNotFound(
        "There is no such connection request.",
      );
    }

    if (found.recipient !== recipient) {
      throw new NotRequestRecipient(
        "Only the recipient can accept this request.",
      );
    }

    const [first, second] =
      found.requester < found.recipient
        ? [found.requester, found.recipient]
        : [found.recipient, found.requester];

    const existingConnection =
      await this.connections.findOne({
        first,
        second,
      });

    if (existingConnection !== null) {
      await this.requests.deleteOne({ request });

      return {
        connection: existingConnection.connection,
      };
    }

    const connection = this.freshID();

    await this.connections.insertOne({
      connection,
      first,
      second,
    });

    await this.requests.deleteOne({
      request,
    });

    return { connection };
  }

  async decline({
    recipient,
    request,
  }: {
    recipient: string;
    request: string;
  }): Promise<{ request: string }> {
    this.ready ??= Promise.all([
      this.requests.createIndex(
        { requester: 1, recipient: 1 },
        { unique: true },
      ),
      this.connections.createIndex(
        { first: 1, second: 1 },
        { unique: true },
      ),
    ]);

    await this.ready;

    const found = await this.requests.findOne({
      request,
    });

    if (found === null) {
      throw new RequestNotFound(
        "There is no such connection request.",
      );
    }

    if (found.recipient !== recipient) {
      throw new NotRequestRecipient(
        "Only the recipient can decline this request.",
      );
    }

    await this.requests.deleteOne({
      request,
    });

    return { request };
  }

  async disconnect({
    user,
    connection,
  }: {
    user: string;
    connection: string;
  }): Promise<{ connection: string }> {
    this.ready ??= Promise.all([
      this.requests.createIndex(
        { requester: 1, recipient: 1 },
        { unique: true },
      ),
      this.connections.createIndex(
        { first: 1, second: 1 },
        { unique: true },
      ),
    ]);

    await this.ready;

    const found = await this.connections.findOne({
      connection,
    });

    if (found === null) {
      throw new ConnectionNotFound(
        "There is no such connection.",
      );
    }

    if (found.first !== user && found.second !== user) {
      throw new NotConnectionMember(
        "This user is not part of the connection.",
      );
    }

    await this.connections.deleteOne({
      connection,
    });

    return { connection };
  }

  async _connections({
    user,
  }: {
    user: string;
  }): Promise<{ connection: string; peer: string }[]> {
    this.ready ??= Promise.all([
      this.requests.createIndex(
        { requester: 1, recipient: 1 },
        { unique: true },
      ),
      this.connections.createIndex(
        { first: 1, second: 1 },
        { unique: true },
      ),
    ]);

    await this.ready;

    const rows = await this.connections
      .find({
        $or: [
          { first: user },
          { second: user },
        ],
      })
      .sort({ connection: 1 })
      .toArray();

    return rows.map((row) => ({
      connection: row.connection,
      peer:
        row.first === user
          ? row.second
          : row.first,
    }));
  }

  async _pendingFor({
    recipient,
  }: {
    recipient: string;
  }): Promise<{ request: string; requester: string }[]> {
    this.ready ??= Promise.all([
      this.requests.createIndex(
        { requester: 1, recipient: 1 },
        { unique: true },
      ),
      this.connections.createIndex(
        { first: 1, second: 1 },
        { unique: true },
      ),
    ]);

    await this.ready;

    const rows = await this.requests
      .find({ recipient })
      .sort({ request: 1 })
      .toArray();

    return rows.map(({ request, requester }) => ({
      request,
      requester,
    }));
  }

  async _areConnected({
    first,
    second,
  }: {
    first: string;
    second: string;
  }): Promise<{ connected: boolean }> {
    this.ready ??= Promise.all([
      this.requests.createIndex(
        { requester: 1, recipient: 1 },
        { unique: true },
      ),
      this.connections.createIndex(
        { first: 1, second: 1 },
        { unique: true },
      ),
    ]);

    await this.ready;

    if (first === second) {
      return {
        connected: false,
      };
    }

    const [left, right] =
      first < second
        ? [first, second]
        : [second, first];

    const found = await this.connections.findOne({
      first: left,
      second: right,
    });

    return {
      connected: found !== null,
    };
  }
}