import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;

    const db = client.db("auth");
    const data = await db.collection("credentials").find({}).toArray();

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: "MongoDB not connected" });
  }
}
