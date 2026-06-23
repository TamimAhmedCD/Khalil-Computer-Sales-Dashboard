import { auth } from "@/auth";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    // 🔐 AUTH CHECK
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

    const authDb = client.db("auth");
    const productsDb = client.db("products");

    // 👥 GET EMPLOYEES
    const employees = await authDb
      .collection("credentials")
      .find({ role: "employee", status: true })
      .toArray();

    // 💰 GET ALL SALES
    const sales = await productsDb.collection("sales").find({}).toArray();

    // ⚡ PRE-CALCULATE SALES MAP (FAST VERSION)
    const salesMap = {};

    for (const sale of sales) {
      const id = sale.sellerId;

      if (!salesMap[id]) {
        salesMap[id] = [];
      }

      salesMap[id].push(sale);
    }

    // 📊 BUILD EMPLOYEE STATS
    const result = employees.map((employee) => {
      const id = employee._id.toString();

      const employeeSales = salesMap[id] || [];

      const totalSales = employeeSales.reduce(
        (sum, s) => sum + (s.total || 0),
        0,
      );

      const totalProfit = employeeSales.reduce(
        (sum, s) => sum + (s.netProfit || 0),
        0,
      );

      const totalCommission = employeeSales.reduce(
        (sum, s) => sum + (s.commission || 0),
        0,
      );

      return {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,

        totalOrders: employeeSales.length,
        totalSales,
        totalProfit,
        totalCommission,
      };
    });

    // 🏆 TOP PERFORMER (BY SALES)
    const topPerformer = [...result].sort(
      (a, b) => b.totalSales - a.totalSales,
    )[0]?.name;

    return Response.json({
      success: true,
      data: result,
      summary: {
        totalStaff: employees.length,
        totalSales: result.reduce((a, b) => a + b.totalSales, 0),
        totalProfit: result.reduce((a, b) => a + b.totalProfit, 0),
        totalCommission: result.reduce((a, b) => a + b.totalCommission, 0),
        topPerformer,
      },
    });
  } catch (error) {
    console.error("EMPLOYEE STATS ERROR:", error);

    return Response.json(
      { success: false, message: "Failed to fetch employees" },
      { status: 500 },
    );
  }
}
