import { MongoClient } from "mongodb";

const url = process.env.MONGODB_URL;

if (!url) {
  throw new Error("MONGODB_URL is not set");
}

export const mongoClient = new MongoClient(url);
export const db = mongoClient.db("weshould");