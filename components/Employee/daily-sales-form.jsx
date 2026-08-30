"use client";

import SharedDailySalesForm from "@/components/sales/DailySalesForm";

export default function DailySalesForm(props) {
  return <SharedDailySalesForm redirectTo="/employee/sales" {...props} />;
}
