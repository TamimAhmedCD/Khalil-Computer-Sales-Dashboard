"use client";

import SharedDailySalesForm from "@/components/sales/DailySalesForm";

export default function DailySalesForm(props) {
  return <SharedDailySalesForm redirectTo="/admin/sales" {...props} />;
}
