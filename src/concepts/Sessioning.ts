import type { Collection, Db } from "mongodb";

export class UnknownSession extends Error {}

type SessionDocument = {
  session: string;
  subject: string;
  expiresAt: Date;
};

const SESSION_LIFETIME_MS = 30 * 60 * 1000;

export class SessioningConcept {
  private readonly sessions: Collection<SessionDocument>;
  private ready: Promise<string> | undefined;

  constructor(
    db: Db,
    namespace = "Sessioning",
    private readonly clock: () => Date = () => new Date(),
    private readonly freshSession: () => string = () => crypto.randomUUID(),
  ) {
    this.sessions = db.collection<SessionDocument>(
      `${namespace}.sessions`,
    );
  }

  async start({
    subject,
  }: {
    subject: string;
  }): Promise<{
    session: string;
    expiresAt: Date;
  }> {
    this.ready ??= this.sessions.createIndex(
      { session: 1 },
      { unique: true },
    );

    await this.ready;

    const now = this.clock();

    await this.sessions.deleteMany({
      expiresAt: {
        $lte: now,
      },
    });

    const session = this.freshSession();
    const expiresAt = new Date(
      now.getTime() + SESSION_LIFETIME_MS,
    );

    await this.sessions.insertOne({
      session,
      subject,
      expiresAt,
    });

    return {
      session,
      expiresAt,
    };
  }

  async current({
    session,
  }: {
    session: string;
  }): Promise<{ subject: string }> {
    this.ready ??= this.sessions.createIndex(
      { session: 1 },
      { unique: true },
    );

    await this.ready;

    const now = this.clock();

    const found = await this.sessions.findOne({
      session,
    });

    if (
      found === null ||
      found.expiresAt.getTime() <= now.getTime()
    ) {
      if (found !== null) {
        await this.sessions.deleteOne({
          session,
        });
      }

      throw new UnknownSession(
        "This session is not active.",
      );
    }

    return {
      subject: found.subject,
    };
  }

  async end({
    session,
  }: {
    session: string;
  }): Promise<{ ended: boolean }> {
    this.ready ??= this.sessions.createIndex(
      { session: 1 },
      { unique: true },
    );

    await this.ready;

    const now = this.clock();

    const found = await this.sessions.findOne({
      session,
    });

    if (
      found === null ||
      found.expiresAt.getTime() <= now.getTime()
    ) {
      if (found !== null) {
        await this.sessions.deleteOne({
          session,
        });
      }

      throw new UnknownSession(
        "This session is not active.",
      );
    }

    await this.sessions.deleteOne({
      session,
    });

    return {
      ended: true,
    };
  }

  async _active({
    session,
  }: {
    session: string;
  }): Promise<
    {
      subject: string;
      expiresAt: Date;
    }[]
  > {
    this.ready ??= this.sessions.createIndex(
      { session: 1 },
      { unique: true },
    );

    await this.ready;

    const now = this.clock();

    const found = await this.sessions.findOne({
      session,
    });

    if (
      found === null ||
      found.expiresAt.getTime() <= now.getTime()
    ) {
      return [];
    }

    return [
      {
        subject: found.subject,
        expiresAt: found.expiresAt,
      },
    ];
  }
}