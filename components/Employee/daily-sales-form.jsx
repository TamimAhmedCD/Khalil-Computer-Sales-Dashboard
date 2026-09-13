"use client";

import DailySalesFormMultiItem from "@/components/sales/DailySalesFormMultiItem";

export default function DailySalesForm(props) {
  return <DailySalesFormMultiItem redirectTo="/employee/sales" {...props} />;
}
