import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "superAdmin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("admin");
    const settingsCollection = db.collection("settings");

    // Always use a single global settings document for simplicity
    let settings = await settingsCollection.findOne({ type: "global" });

    if (!settings) {
      // Create default settings if they don't exist
      settings = {
        type: "global",
        businessName: "Khalil Computer",
        businessAddress: "Dhaka, Bangladesh",
        contactEmail: "",
        contactPhone: "",
        currency: "BDT",
        invoicePrefix: "INV-",
        taxRate: 0,
        defaultCommissionRate: 0,
        enableNotifications: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await settingsCollection.insertOne(settings);
    }

    return NextResponse.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error("Settings GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await auth();

    if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "superAdmin")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    const client = await clientPromise;
    const db = client.db("admin");
    const settingsCollection = db.collection("settings");

    // Extract only allowed fields
    const updatedSettings = {
      businessName: data.businessName,
      businessAddress: data.businessAddress,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      currency: data.currency,
      invoicePrefix: data.invoicePrefix,
      taxRate: Number(data.taxRate) || 0,
      defaultCommissionRate: Number(data.defaultCommissionRate) || 0,
      enableNotifications: Boolean(data.enableNotifications),
      updatedAt: new Date()
    };

    // Remove undefined values
    Object.keys(updatedSettings).forEach(
      key => updatedSettings[key] === undefined && delete updatedSettings[key]
    );

    await settingsCollection.updateOne(
      { type: "global" },
      { $set: updatedSettings },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      data: updatedSettings
    });

  } catch (error) {
    console.error("Settings PUT Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update settings" },
      { status: 500 }
    );
  }
}
