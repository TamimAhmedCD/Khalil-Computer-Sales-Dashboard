export const DATE_LABELS = {
  today: "Today",
  yesterday: "Yesterday",
  week: "This Week",
  month: "This Month",
  "last-month": "Last Month",
  year: "This Year",
  custom: "Custom Range",
};

export const formatCurrency = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

export const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-BD");

export const calculateMargin = (profit, revenue) => {
  if (!revenue || Number(revenue) === 0) return 0;
  return (Number(profit || 0) / Number(revenue)) * 100;
};
