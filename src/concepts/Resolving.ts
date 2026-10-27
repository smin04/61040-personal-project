import type {
  Collection,
  Db,
} from "mongodb";

interface ItemRecord {
  item: string;
  name?: string;
  normalizedName?: string;
  reference?: string;
}

interface ResolutionRecord {
  reference: string;
  item: string;
}

export class ItemNotFound extends Error {
  constructor() {
    super("This item does not exist.");
    this.name = "ItemNotFound";
  }
}

function normalizeReference(
  reference: string,
): string {
  const trimmed =
    reference.trim();

  try {
    const url =
      new URL(trimmed);

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return trimmed;
    }

    // Canonicalize stable post identities; never use a caption as a video ID.
    // Short-link redirects cannot be identified offline and need the final URL.
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "instagram.com") {
      const match = url.pathname.match(/^\/(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/);
      if (match) return `https://instagram.com/${match[1] === "reels" ? "reel" : match[1]}/${match[2]}`;
    }
    if (host === "tiktok.com" || host === "m.tiktok.com") {
      const match = url.pathname.match(/\/video\/(\d+)/);
      if (match) return `https://www.tiktok.com/video/${match[1]}`;
    }
    url.hash = "";

    url.hostname =
      url.hostname.toLowerCase();

    if (
      (url.protocol === "http:" &&
        url.port === "80") ||
      (url.protocol === "https:" &&
        url.port === "443")
    ) {
      url.port = "";
    }

    if (
      url.pathname.length > 1
    ) {
      url.pathname =
        url.pathname.replace(
          /\/+$/,
          "",
        );
    }

    return url.toString();
  } catch {
    return trimmed;
  }
}

function normalizeName(
  name: string,
): string {
  return name
    .normalize("NFKD")
    .toLowerCase()
    .replace(
      /['’‘]/g,
      "",
    )
    .replace(
      /[^a-z0-9]+/g,
      " ",
    )
    .trim()
    .replace(
      /\s+/g,
      " ",
    );
}

function isDuplicateKey(
  error: unknown,
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as {
      code?: unknown;
    }).code === 11000
  );
}

export class ResolvingConcept {
  private readonly items:
    Collection<ItemRecord>;

  private readonly resolutions:
    Collection<ResolutionRecord>;

  private ready:
    Promise<unknown> | undefined;

  constructor(
    db: Db,
    namespace = "Resolving",
    private readonly freshID:
      () => string =
      () => crypto.randomUUID(),
  ) {
    this.items =
      db.collection<ItemRecord>(
        `${namespace}.items`,
      );

    this.resolutions =
      db.collection<ResolutionRecord>(
        `${namespace}.resolutions`,
      );
  }

  async resolve({
    reference,
  }: {
    reference: string;
  }): Promise<{
    item: string;
  }> {
    this.ready ??=
      Promise.all([
        this.items.createIndex(
          {
            item: 1,
          },
          {
            unique: true,
          },
        ),

        this.resolutions.createIndex(
          {
            reference: 1,
          },
          {
            unique: true,
          },
        ),

        this.resolutions.createIndex({
          item: 1,
        }),
      ]);

    await this.ready;

    const normalized =
      normalizeReference(
        reference,
      );

    const existing =
      await this.resolutions.findOne({
        reference: normalized,
      });

    if (existing) {
      return {
        item: existing.item,
      };
    }

    const item =
      this.freshID();

    await this.items.insertOne({
      item,
      name: normalized,
      reference: normalized,
    });

    try {
      await this.resolutions.insertOne({
        reference: normalized,
        item,
      });
    } catch (error) {
      if (
        !isDuplicateKey(
          error,
        )
      ) {
        throw error;
      }

      await this.items.deleteOne({
        item,
      });

      const winner =
        await this.resolutions.findOne({
          reference: normalized,
        });

      if (!winner) {
        throw error;
      }

      return {
        item: winner.item,
      };
    }

    return {
      item,
    };
  }

  async describe({
    item,
    name,
    reference,
  }: {
    item: string;
    name: string;
    reference: string;
  }): Promise<{
    resolved: string;
  }> {
    this.ready ??=
      Promise.all([
        this.items.createIndex(
          {
            item: 1,
          },
          {
            unique: true,
          },
        ),

        this.resolutions.createIndex(
          {
            reference: 1,
          },
          {
            unique: true,
          },
        ),

        this.resolutions.createIndex({
          item: 1,
        }),
      ]);

    await this.ready;

    const found =
      await this.items.findOne({
        item,
      });

    if (!found) {
      throw new ItemNotFound();
    }

    const canonicalReference =
      normalizeReference(
        reference,
      );

    const displayName =
      name.trim();

    const normalizedName =
      normalizeName(
        displayName,
      );

    let matching =
      await this.items.findOne({
        item: {
          $ne: item,
        },

        normalizedName,
      });

    if (!matching) {
      const olderItems =
        await this.items
          .find({
            item: {
              $ne: item,
            },
          })
          .toArray();

      matching =
        olderItems.find(
          (candidate) =>
            candidate.name !==
              undefined &&
            normalizeName(
              candidate.name,
            ) ===
              normalizedName,
        ) ?? null;
    }

    if (matching) {
      await this.resolutions.updateOne(
        {
          reference:
            canonicalReference,
        },
        {
          $set: {
            item:
              matching.item,
          },
        },
        {
          upsert: true,
        },
      );

      const remainingReference =
        await this.resolutions.findOne({
          item,
        });

      if (
        remainingReference ===
          null
      ) {
        await this.items.deleteOne({
          item,
        });
      }

      await this.items.updateOne(
        {
          item:
            matching.item,
        },
        {
          $set: {
            normalizedName:
              normalizeName(
                matching.name ??
                  displayName,
              ),
          },
        },
      );

      return {
        resolved:
          matching.item,
      };
    }

    await this.items.updateOne(
      {
        item,
      },
      {
        $set: {
          name:
            displayName,

          normalizedName,

          reference:
            canonicalReference,
        },
      },
    );

    return {
      resolved: item,
    };
  }

  async associate({
    reference,
    item,
  }: {
    reference: string;
    item: string;
  }): Promise<
    Record<
      string,
      never
    >
  > {
    this.ready ??=
      Promise.all([
        this.items.createIndex(
          {
            item: 1,
          },
          {
            unique: true,
          },
        ),

        this.resolutions.createIndex(
          {
            reference: 1,
          },
          {
            unique: true,
          },
        ),

        this.resolutions.createIndex({
          item: 1,
        }),
      ]);

    await this.ready;

    const existingItem =
      await this.items.findOne({
        item,
      });

    if (!existingItem) {
      throw new ItemNotFound();
    }

    const normalized =
      normalizeReference(
        reference,
      );

    await this.resolutions.updateOne(
      {
        reference: normalized,
      },
      {
        $set: {
          item,
        },
      },
      {
        upsert: true,
      },
    );

    return {};
  }

  async _item({
    reference,
  }: {
    reference: string;
  }): Promise<
    {
      item: string;
    }[]
  > {
    this.ready ??=
      Promise.all([
        this.items.createIndex(
          {
            item: 1,
          },
          {
            unique: true,
          },
        ),

        this.resolutions.createIndex(
          {
            reference: 1,
          },
          {
            unique: true,
          },
        ),

        this.resolutions.createIndex({
          item: 1,
        }),
      ]);

    await this.ready;

    const normalized =
      normalizeReference(
        reference,
      );

    const resolution =
      await this.resolutions.findOne({
        reference: normalized,
      });

    if (!resolution) {
      return [];
    }

    return [
      {
        item:
          resolution.item,
      },
    ];
  }

  async _references({
    item,
  }: {
    item: string;
  }): Promise<
    {
      reference: string;
    }[]
  > {
    this.ready ??=
      Promise.all([
        this.items.createIndex(
          {
            item: 1,
          },
          {
            unique: true,
          },
        ),

        this.resolutions.createIndex(
          {
            reference: 1,
          },
          {
            unique: true,
          },
        ),

        this.resolutions.createIndex({
          item: 1,
        }),
      ]);

    await this.ready;

    const rows =
      await this.resolutions
        .find({
          item,
        })
        .sort({
          reference: 1,
        })
        .toArray();

    return rows.map(
      ({
        reference,
      }) => ({
        reference,
      }),
    );
  }

  async _get({
    item,
  }: {
    item: string;
  }): Promise<
    {
      name: string;
      reference: string;
    }[]
  > {
    this.ready ??=
      Promise.all([
        this.items.createIndex(
          {
            item: 1,
          },
          {
            unique: true,
          },
        ),

        this.resolutions.createIndex(
          {
            reference: 1,
          },
          {
            unique: true,
          },
        ),

        this.resolutions.createIndex({
          item: 1,
        }),
      ]);

    await this.ready;

    const found =
      await this.items.findOne({
        item,
      });

    if (!found) {
      return [];
    }

    if (
      found.name &&
      found.reference
    ) {
      return [
        {
          name:
            found.name,

          reference:
            found.reference,
        },
      ];
    }

    const resolution =
      await this.resolutions.findOne(
        {
          item,
        },
        {
          sort: {
            reference: 1,
          },
        },
      );

    if (!resolution) {
      return [];
    }

    const fallbackName =
      found.name ??
      resolution.reference;

    await this.items.updateOne(
      {
        item,
      },
      {
        $set: {
          name:
            fallbackName,

          normalizedName:
            normalizeName(
              fallbackName,
            ),

          reference:
            resolution.reference,
        },
      },
    );

    return [
      {
        name:
          fallbackName,

        reference:
          resolution.reference,
      },
    ];
  }
}