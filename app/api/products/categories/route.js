import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("products");

    const categories = await db
      .collection("categories")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}
