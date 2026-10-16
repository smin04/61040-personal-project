import type { Collection, Db } from "mongodb";

export class AlreadyIntending extends Error {}
export class IntentionNotFound extends Error {}

type IntentionDocument = {
  intention: string;
  user: string;
  item: string;
};

export class IntendingConcept {
  private readonly intentions: Collection<IntentionDocument>;
  private ready: Promise<string> | undefined;

  constructor(
    db: Db,
    namespace = "Intending",
    private readonly freshID: () => string = () => crypto.randomUUID(),
  ) {
    this.intentions = db.collection<IntentionDocument>(
      `${namespace}.intentions`,
    );
  }

  async express({
    user,
    item,
  }: {
    user: string;
    item: string;
  }): Promise<{ intention: string }> {
    this.ready ??= this.intentions.createIndex(
      { user: 1, item: 1 },
      { unique: true },
    );

    await this.ready;

    const existing = await this.intentions.findOne({
      user,
      item,
    });

    if (existing !== null) {
      throw new AlreadyIntending(
        "This user already has an active intention for this item.",
      );
    }

    const intention = this.freshID();

    try {
      await this.intentions.insertOne({
        intention,
        user,
        item,
      });
    } catch (error) {
      const duplicate = await this.intentions.findOne({
        user,
        item,
      });

      if (duplicate !== null) {
        throw new AlreadyIntending(
          "This user already has an active intention for this item.",
        );
      }

      throw error;
    }

    return { intention };
  }

  async withdraw({
    intention,}: {
    intention: string;
    }): Promise<{ intention: string }> {
    this.ready ??= this.intentions.createIndex(
        { user: 1, item: 1 },
        { unique: true },
    );

  await this.ready;

  const result = await this.intentions.deleteOne({
    intention,
  });

  if (result.deletedCount === 0) {
    throw new IntentionNotFound(
      "There is no such active intention.",
    );
  }

  return { intention };
}

  async _has({
    user,
    item,
  }: {
    user: string;
    item: string;
  }): Promise<{ active: boolean }> {
    this.ready ??= this.intentions.createIndex(
      { user: 1, item: 1 },
      { unique: true },
    );

    await this.ready;

    const found = await this.intentions.findOne({
      user,
      item,
    });

    return {
      active: found !== null,
    };
  }

  async _byUser({
    user,
  }: {
    user: string;
  }): Promise<{ intention: string; item: string }[]> {
    this.ready ??= this.intentions.createIndex(
      { user: 1, item: 1 },
      { unique: true },
    );

    await this.ready;

    const rows = await this.intentions
      .find({ user })
      .sort({ intention: 1 })
      .toArray();

    return rows.map(({ intention, item }) => ({
      intention,
      item,
    }));
  }

  async _forItem({
    item,
  }: {
    item: string;
  }): Promise<{ intention: string; user: string }[]> {
    this.ready ??= this.intentions.createIndex(
      { user: 1, item: 1 },
      { unique: true },
    );

    await this.ready;

    const rows = await this.intentions
      .find({ item })
      .sort({ intention: 1 })
      .toArray();

    return rows.map(({ intention, user }) => ({
      intention,
      user,
    }));
  }
}