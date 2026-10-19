import { MongoClient } from "mongodb";

const url =
  process.env.MONGODB_URL ??
  process.env.MONGODB_URI;

if (!url) {
  throw new Error(
    "MONGODB_URL or MONGODB_URI is not set",
  );
}

export const mongoClient =
  new MongoClient(url);

export const db =
  mongoClient.db();
