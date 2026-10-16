import { pbkdf2Sync, timingSafeEqual } from "node:crypto";
import type { Collection, Db } from "mongodb";

export class InvalidUsername extends Error {}
export class WeakPassword extends Error {}
export class UsernameTaken extends Error {}
export class InvalidCredentials extends Error {}

type AccountDocument = {
  username: string;
  salt: string;
  passwordVerifier: string;
};

const USERNAME = /^[A-Za-z0-9_-]{3,32}$/;

function makeVerifier(password: string, salt: string): string {
  return pbkdf2Sync(
    password,
    salt,
    10_000,
    32,
    "sha256",
  ).toString("hex");
}

function verifiersMatch(
  stored: string,
  supplied: string,
): boolean {
  const storedBuffer = Buffer.from(stored, "hex");
  const suppliedBuffer = Buffer.from(supplied, "hex");

  if (storedBuffer.length !== suppliedBuffer.length) {
    return false;
  }

  return timingSafeEqual(
    storedBuffer,
    suppliedBuffer,
  );
}

export class AuthenticatingConcept {
  private readonly accounts: Collection<AccountDocument>;
  private ready: Promise<string> | undefined;

  constructor(
    db: Db,
    namespace = "Authenticating",
    private readonly freshSalt: () => string = () => crypto.randomUUID(),
  ) {
    this.accounts = db.collection<AccountDocument>(
      `${namespace}.accounts`,
    );
  }

  async register({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<{ account: string }> {
    this.ready ??= this.accounts.createIndex(
      { username: 1 },
      { unique: true },
    );

    await this.ready;

    if (!USERNAME.test(username)) {
      throw new InvalidUsername(
        "A username must contain 3 to 32 letters, numbers, underscores, or hyphens.",
      );
    }

    if (password.length < 8 || password.length > 128) {
      throw new WeakPassword(
        "A password must contain 8 to 128 characters.",
      );
    }

    const existing = await this.accounts.findOne({
      username,
    });

    if (existing !== null) {
      throw new UsernameTaken(
        "That username is already registered.",
      );
    }

    const salt = this.freshSalt();

    const passwordVerifier = makeVerifier(
      password,
      salt,
    );

    try {
      await this.accounts.insertOne({
        username,
        salt,
        passwordVerifier,
      });
    } catch (error) {
      const duplicate = await this.accounts.findOne({
        username,
      });

      if (duplicate !== null) {
        throw new UsernameTaken(
          "That username is already registered.",
        );
      }

      throw error;
    }

    return {
      account: username,
    };
  }

  async authenticate({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<{ account: string }> {
    this.ready ??= this.accounts.createIndex(
      { username: 1 },
      { unique: true },
    );

    await this.ready;

    const account = await this.accounts.findOne({
      username,
    });

    if (account === null) {
      throw new InvalidCredentials(
        "The username or password is incorrect.",
      );
    }

    const supplied = makeVerifier(
      password,
      account.salt,
    );

    if (
      !verifiersMatch(
        account.passwordVerifier,
        supplied,
      )
    ) {
      throw new InvalidCredentials(
        "The username or password is incorrect.",
      );
    }

    return {
      account: username,
    };
  }

  async _registered({
    username,
  }: {
    username: string;
  }): Promise<{ registered: boolean }> {
    this.ready ??= this.accounts.createIndex(
      { username: 1 },
      { unique: true },
    );

    await this.ready;

    const account = await this.accounts.findOne({
      username,
    });

    return {
      registered: account !== null,
    };
  }
}