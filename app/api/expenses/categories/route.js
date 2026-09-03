import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

// Default categories to seed if collection is empty
const DEFAULT_CATEGORIES = [
  { name: "Shop Rent", type: "Business", description: "Monthly shop rent" },
  { name: "Inventory Purchase", type: "Business", description: "Buying stock/inventory" },
  { name: "Employee Salary", type: "Business", description: "Staff salary payments" },
  { name: "Electricity Bill", type: "Household", description: "Monthly electricity bill" },
  { name: "Gas Bill", type: "Household", description: "Monthly gas bill" },
  { name: "Water Bill", type: "Household", description: "Monthly water bill" },
  { name: "Internet Bill", type: "Household", description: "WiFi / broadband" },
  { name: "Rent", type: "Household", description: "House rent" },
  { name: "Groceries", type: "Household", description: "Daily household groceries" },
  { name: "Transportation", type: "Business", description: "Travel, fuel, delivery costs" },
  { name: "Maintenance", type: "Business", description: "Equipment and property maintenance" },
  { name: "Office Supplies", type: "Business", description: "Stationery, printer, accessories" },
  { name: "Personal Shopping", type: "Personal", description: "Personal items and shopping" },
  { name: "Health", type: "Personal", description: "Medical and health expenses" },
  { name: "Education", type: "Personal", description: "Books, courses, tuition" },
  { name: "Entertainment", type: "Personal", description: "Movies, outings, hobbies" },
  { name: "Other", type: "Other", description: "Miscellaneous expenses" },
];

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("products");

    // Auto-seed default categories if collection is empty
    const count = await db.collection("expenseCategories").countDocuments();
    if (count === 0) {
      const now = new Date();
      const docs = DEFAULT_CATEGORIES.map((cat) => ({
        name: cat.name,
        type: cat.type,
        description: cat.description,
        createdAt: now,
        updatedAt: now,
      }));
      await db.collection("expenseCategories").insertMany(docs);
    }

    const categories = await db
      .collection("expenseCategories")
      .find({})
      .sort({ type: 1, name: 1 })
      .toArray();

    return Response.json({ success: true, data: categories });
  } catch (error) {
    console.error("GET EXPENSE CATEGORIES ERROR:", error);
    return Response.json(
      { success: false, message: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, type, description } = body;

    if (!name || name.trim().length < 2) {
      return Response.json({ success: false, message: "Category name is required" }, { status: 400 });
    }

    if (!type || !["Business", "Household", "Personal", "Other"].includes(type)) {
      return Response.json({ success: false, message: "Valid category type is required (Business, Household, Personal, Other)" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("products");

    const existing = await db.collection("expenseCategories").findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") } });
    if (existing) {
      return Response.json({ success: false, message: "Category already exists" }, { status: 409 });
    }

    const newCategory = {
      name: name.trim(),
      type,
      description: description?.trim() || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("expenseCategories").insertOne(newCategory);

    return Response.json({ success: true, data: { ...newCategory, _id: result.insertedId } }, { status: 201 });
  } catch (error) {
    console.error("CREATE EXPENSE CATEGORY ERROR:", error);
    return Response.json({ success: false, message: "Failed to create category" }, { status: 500 });
  }
}
