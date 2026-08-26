import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import cloudinary from "@/lib/cloudinary";
import { ObjectId } from "mongodb";

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Upload a single File (from formData) to Cloudinary → { url, publicId }
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

// Best-effort delete of a Cloudinary asset — never throws (a storage hiccup
// must not block the DB write it accompanies).
const destroyImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary destroy failed:", publicId, err?.message);
  }
};

const isAdmin = (session) =>
  session?.user?.role === "admin" || session?.user?.role === "superAdmin";

// GET /api/products/[id] — single product (hydrates the edit page)
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id || !ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Invalid product id" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("products");

    const product = await db
      .collection("products")
      .findOne({ _id: new ObjectId(id) });

    if (!product) {
      return Response.json(
        { success: false, message: "Product not found" },
        { status: 404 },
      );
    }

    return Response.json({ success: true, data: product });
  } catch (error) {
    console.error("GET PRODUCT API ERROR:", error);
    return Response.json(
      { success: false, message: "Failed to fetch product" },
      { status: 500 },
    );
  }
}

// PATCH /api/products/[id] — update product (admin only)
export async function PATCH(request, { params }) {
  try {
    // 🔐 Auth & admin check
    const session = await auth();
    if (!isAdmin(session)) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Invalid product id" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("products");

    const existing = await db
      .collection("products")
      .findOne({ _id: new ObjectId(id) });

    if (!existing) {
      return Response.json(
        { success: false, message: "Product not found" },
        { status: 404 },
      );
    }

    // 📦 Parse multipart form data
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

    // ❌ Field validation (same rules as create)
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

    // 🔍 Validate category exists
    const category = await db
      .collection("categories")
      .findOne({ _id: new ObjectId(categoryId) });

    if (!category) {
      return Response.json(
        { success: false, message: "Category not found" },
        { status: 404 },
      );
    }

    // 🖼️ Reconcile images: keep the publicIds the client retained, drop the rest
    let keepIds = [];
    const keepRaw = form.get("keepImages");
    if (keepRaw) {
      try {
        const parsed = JSON.parse(keepRaw.toString());
        if (Array.isArray(parsed)) keepIds = parsed;
      } catch {
        keepIds = [];
      }
    }

    const existingImages = Array.isArray(existing.images) ? existing.images : [];
    const keptImages = existingImages.filter((img) =>
      keepIds.includes(img.publicId),
    );
    const removedImages = existingImages.filter(
      (img) => !keepIds.includes(img.publicId),
    );

    // New uploads
    const files = form.getAll("images").filter((f) => f && f.size > 0);

    if (keptImages.length + files.length > MAX_IMAGES) {
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

    // ☁️ Remove dropped images, upload new ones
    await Promise.all(removedImages.map((img) => destroyImage(img.publicId)));
    const uploaded = files.length
      ? await Promise.all(files.map((file) => uploadBuffer(file)))
      : [];
    const images = [...keptImages, ...uploaded];

    // 💾 Update
    const profit = saleRate - buyRate;

    await db.collection("products").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
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
          updatedAt: new Date(),
        },
      },
    );

    return Response.json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("UPDATE PRODUCT API ERROR:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to update product",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

// DELETE /api/products/[id] — remove product + its Cloudinary images (admin only)
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!isAdmin(session)) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Invalid product id" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("products");

    const product = await db
      .collection("products")
      .findOne({ _id: new ObjectId(id) });

    if (!product) {
      return Response.json(
        { success: false, message: "Product not found" },
        { status: 404 },
      );
    }

    // Best-effort cleanup of the product's Cloudinary images
    const images = Array.isArray(product.images) ? product.images : [];
    await Promise.all(images.map((img) => destroyImage(img.publicId)));

    const result = await db
      .collection("products")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return Response.json(
        { success: false, message: "Failed to delete product" },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PRODUCT API ERROR:", error);
    return Response.json(
      { success: false, message: "Failed to delete product" },
      { status: 500 },
    );
  }
}
