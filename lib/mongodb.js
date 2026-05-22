import { MongoClient } from "mongodb";

const uri = process.env.DB_URI;
let client;
let clientPromise;

if (!process.env.DB_URI) {
  throw new Error("Please add your Mongo URI to .env.local");
}

client = new MongoClient(uri);
clientPromise = client.connect();

export default clientPromise;
