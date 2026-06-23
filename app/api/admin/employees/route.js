import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await auth();
    if (
      !session ||
      !session.user ||
      !(session.user.role === "admin" || session.user.role === "superAdmin")
    ) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const client = await clientPromise;
    const db = client.db("auth");
    const employees = await db
      .collection("credentials")
      .find({ role: "employee" })
      .toArray();
    return Response.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to fetch employees" },
      { status: 500 },
    );
  }
}
