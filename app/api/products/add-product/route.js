import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import cloudinary from "@/lib/cloudinary";
import { ObjectId } from "mongodb";

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Upload a single File (from formData) to Cloudinary and return { url, publicId }
const uploadBuffer = async (file) => {
  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "khalil-computer/products", resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
};

export async function POST(request) {
  try {
    // 🔐 1. Auth & admin check
    const session = await auth();
    const isAdmin =
      session?.user?.role === "admin" || session?.user?.role === "superAdmin";

    if (!isAdmin) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // 📦 2. Parse multipart form data
    const form = await request.formData();

    const name = form.get("name")?.toString().trim() || "";
    const categoryId = form.get("categoryId")?.toString().trim() || "";
    const brand = form.get("brand")?.toString().trim() || "";
    const description = form.get("description")?.toString().trim() || "";

    const buyRate = Number(form.get("buyRate"));
    const saleRate = Number(form.get("saleRate"));
    const stock = Number(form.get("stock") || 0);
    const lowStockAlert = Number(form.get("lowStockAlert") || 0);
    const unit = form.get("unit")?.toString().trim() || "pcs";

    const isActive = form.get("isActive") === "true";
    const isFeatured = form.get("isFeatured") === "true";

    // 🖼️ 3. Collect image files (ignore empty file inputs)
    const files = form.getAll("images").filter((f) => f && f.size > 0);

    if (files.length > MAX_IMAGES) {
      return Response.json(
        { success: false, message: `Maximum ${MAX_IMAGES} images allowed` },
        { status: 400 },
      );
    }

    for (const file of files) {
      if (!file.type?.startsWith("image/")) {
        return Response.json(
          { success: false, message: "Only image files are allowed" },
          { status: 400 },
        );
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return Response.json(
          { success: false, message: "Each image must be 5MB or smaller" },
          { status: 400 },
        );
      }
    }

    // ❌ 4. Required field validation
    if (!name || name.length < 2) {
      return Response.json(
        { success: false, message: "Product name is required" },
        { status: 400 },
      );
    }

    if (!categoryId || !ObjectId.isValid(categoryId)) {
      return Response.json(
        { success: false, message: "A valid category is required" },
        { status: 400 },
      );
    }

    if (
      !Number.isFinite(buyRate) ||
      !Number.isFinite(saleRate) ||
      buyRate < 0 ||
      saleRate < 0
    ) {
      return Response.json(
        { success: false, message: "Buy and sale rate must be valid numbers" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(stock) || stock < 0) {
      return Response.json(
        { success: false, message: "Stock must be zero or a positive number" },
        { status: 400 },
      );
    }

    // 🛑 5. DB connection
    const client = await clientPromise;
    const db = client.db("products");

    // 🔍 6. Validate category exists
    const category = await db
      .collection("categories")
      .findOne({ _id: new ObjectId(categoryId) });

    if (!category) {
      return Response.json(
        { success: false, message: "Category not found" },
        { status: 404 },
      );
    }

    // ☁️ 7. Upload images to Cloudinary (in parallel)
    const images = files.length
      ? await Promise.all(files.map((file) => uploadBuffer(file)))
      : [];

    // 📊 8. Derived value
    const profit = saleRate - buyRate;
    const now = new Date();

    // 💾 9. Insert product
    const result = await db.collection("products").insertOne({
      name,
      categoryId: new ObjectId(categoryId),
      categoryName: category.name,
      brand,
      description,
      buyRate,
      saleRate,
      profit,
      stock,
      unit,
      lowStockAlert,
      isActive,
      isFeatured,
      images,
      createdBy: session.user.id,
      createdByName: session.user.name || "",
      createdAt: now,
      updatedAt: now,
    });

    // ✅ 10. Success
    return Response.json(
      {
        success: true,
        message: "Product added successfully",
        productId: result.insertedId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("ADD PRODUCT API ERROR:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to add product",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("products");

    const products = await db
      .collection("products")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json({ success: true, data: products });
  } catch (error) {
    console.error("GET PRODUCTS API ERROR:", error);
    return Response.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
