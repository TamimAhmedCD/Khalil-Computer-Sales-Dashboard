'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { 
  FileDown, Download, Printer, TrendingUp, DollarSign, 
  Zap, ChevronLeft, ChevronRight 
} from 'lucide-react';

const PAYMENT_COLORS = ['#1f83d2', '#55a6d6', '#34d399', '#a78bfa'];

export function Reports() {
  // --- States ---
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({ totalSalesAmount: 0, totalProfit: 0, totalCommission: 0 });
  const [pagination, setPagination] = useState({ totalResults: 0, totalPages: 1, currentPage: 1 });
  const [loading, setLoading] = useState(true);
  
  // ✅ Changed default state from 'today' to 'all' to show all data by default
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Custom Range States
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // --- Live API Sync Effect ---
  useEffect(() => {
    async function fetchSalesData() {
      try {
        setLoading(true);
        
        const params = new URLSearchParams();
        params.append('page', currentPage.toString());
        params.append('dateFilter', dateFilter);
        
        if (searchTerm) params.append('search', searchTerm);
        if (categoryFilter !== 'all') params.append('category', categoryFilter);
        
        // Only attach date bounds if the user actively wants a custom block
        if (dateFilter === 'custom' && customStartDate && customEndDate) {
          params.append('customStartDate', customStartDate);
          params.append('customEndDate', customEndDate);
        }

        const response = await fetch(`/api/products/sales?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
          setSales(result.data || []);
          setSummary(result.summary || { totalSalesAmount: 0, totalProfit: 0, totalCommission: 0 });
          setPagination(result.pagination || { totalResults: 0, totalPages: 1, currentPage: 1 });
        }
      } catch (error) {
        console.error('Frontend Fetch Error:', error);
      } finally {
        setLoading(false);
      }
    }

    const delayDebounceFn = setTimeout(() => {
      fetchSalesData();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, dateFilter, searchTerm, categoryFilter, customStartDate, customEndDate]);

  const handleFilterChange = (type, value) => {
    if (type === 'date') {
      setDateFilter(value);
      // Clean up custom dates if user switches away from custom
      if (value !== 'custom') {
        setCustomStartDate('');
        setCustomEndDate('');
      }
    }
    if (type === 'search') setSearchTerm(value);
    if (type === 'category') setCategoryFilter(value);
    setCurrentPage(1);
  };

  // --- Chart Calculations ---
  const chartSalesData = useMemo(() => {
    const dailyMap = {};
    
    sales.forEach((item) => {
      const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dailyMap[formattedDate]) {
        dailyMap[formattedDate] = { date: formattedDate, sales: 0, profit: 0, commission: 0 };
      }
      dailyMap[formattedDate].sales += item.totalPrice;
      dailyMap[formattedDate].profit += item.netProfit;
      dailyMap[formattedDate].commission += item.commission;
    });

    return Object.values(dailyMap).reverse();
  }, [sales]);

  const paymentBreakdown = useMemo(() => {
    const methods = {};
    sales.forEach((item) => {
      const field = item.paymentMethod || 'Unspecified';
      methods[field] = (methods[field] || 0) + item.totalPrice;
    });
    return Object.keys(methods).map((key) => ({
      name: key,
      value: methods[key],
    }));
  }, [sales]);

  const topProducts = useMemo(() => {
    const productMap = {};
    
    sales.forEach((item) => {
      if (!productMap[item.productName]) {
        productMap[item.productName] = { name: item.productName, quantity: 0, sales: 0 };
      }
      productMap[item.productName].quantity += item.quantity;
      productMap[item.productName].sales += item.totalPrice;
    });

    return Object.values(productMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [sales]);

  return (
    <div className="min-h-screen">
      <div className="space-y-8">
        {/* Header Container */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sales Reports</h1>
            <p className="text-muted-foreground mt-1">
              Live database tracking matching your backend configuration profiles
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Select value={dateFilter} onValueChange={(val) => handleFilterChange('date', val)}>
              <SelectTrigger className="w-full md:w-48 bg-card border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* Default select option changed to All Time */}
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 border-border text-foreground">
                <FileDown className="h-4 w-4" /> PDF
              </Button>
              <Button variant="outline" size="sm" className="gap-2 border-border text-foreground">
                <Download className="h-4 w-4" /> Excel
              </Button>
              <Button variant="outline" size="sm" className="gap-2 border-border text-foreground">
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          </div>
        </div>

        {/* Custom Range Selectors */}
        {dateFilter === 'custom' && (
          <Card className="bg-card p-4 border border-border flex flex-wrap gap-4 items-center">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Start Date</span>
              <Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="bg-background text-foreground text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">End Date</span>
              <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="bg-background text-foreground text-sm" />
            </div>
          </Card>
        )}

        {/* Summary Aggregations Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card p-6 rounded-lg border border-border flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Total Sales Amount</p>
              <p className="text-2xl font-bold text-foreground">৳{summary.totalSalesAmount.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </Card>

          <Card className="bg-card p-6 rounded-lg border border-border flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Total Net Profit</p>
              <p className="text-2xl font-bold text-foreground">৳{summary.totalProfit.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green- green-600" />
            </div>
          </Card>

          <Card className="bg-card p-6 rounded-lg border border-border flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Total Commission</p>
              <p className="text-2xl font-bold text-foreground">৳{summary.totalCommission.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Sales Chart</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartSalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#1f83d2" strokeWidth={2} name="Total Sales" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Profit Overview</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartSalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="profit" fill="#34d399" name="Net Profit" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Payment Methods</h3>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={paymentBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {paymentBreakdown.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={PAYMENT_COLORS[idx % PAYMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full space-y-2">
                {paymentBreakdown.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PAYMENT_COLORS[idx % PAYMENT_COLORS.length] }} />
                      <span className="text-foreground font-medium">{item.name}</span>
                    </div>
                    <span className="text-muted-foreground">৳{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top Volume Performance</h3>
            <div className="space-y-4">
              {topProducts.map((prod, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{prod.name}</span>
                    <span className="text-muted-foreground">{prod.quantity} Units Sold (৳{prod.sales.toLocaleString()})</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min((prod.quantity / 50) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Dynamic Filters Control Panel */}
        <Card className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search invoice or product..."
              value={searchTerm}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="bg-background border-border text-foreground"
            />
            <Select value={categoryFilter} onValueChange={(val) => handleFilterChange('category', val)}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Select Category Name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="DCR">DCR</SelectItem>
                <SelectItem value="Khajna Payment">Khajna Payment</SelectItem>
                <SelectItem value="Namjari">Namjari</SelectItem>
                <SelectItem value="Khajna Nibondon">Khajna Nibondon</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center justify-end text-sm font-medium text-muted-foreground px-2">
              Found {pagination.totalResults} documents match
            </div>
          </div>
        </Card>

        {/* Database Primary Ledger Table Layout */}
        <Card className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Refreshing server-side transaction rows...</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-foreground">Timestamp</th>
                    <th className="px-6 py-3 text-left font-semibold text-foreground">Product Title</th>
                    <th className="px-6 py-3 text-left font-semibold text-foreground">Category Class</th>
                    <th className="px-6 py-3 text-center font-semibold text-foreground">Quantity</th>
                    <th className="px-6 py-3 text-right font-semibold text-foreground">Price (৳)</th>
                    <th className="px-6 py-3 text-right font-semibold text-foreground">Expense (৳)</th>
                    <th className="px-6 py-3 text-right font-semibold text-foreground">Net Profit (৳)</th>
                    <th className="px-6 py-3 text-right font-semibold text-foreground">Commission (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sales.length > 0 ? (
                    sales.map((item) => (
                      <tr key={item._id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 text-foreground whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 text-foreground max-w-45 truncate" title={item.productName}>{item.productName}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground font-medium">
                            {item.categoryName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-foreground">{item.quantity}</td>
                        <td className="px-6 py-4 text-right text-foreground">{item.totalPrice.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-muted-foreground">{item.expenseCost.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-medium text-emerald-600">৳{item.netProfit.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-medium text-primary">৳{item.commission.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-muted-foreground">
                        No real-time sales transactions matched your active filtering requirements.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Backend Controlled Pagination Section */}
          <div className="px-6 py-4 flex items-center justify-between border-t border-border bg-muted/10">
            <div className="text-xs text-muted-foreground">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                disabled={currentPage === pagination.totalPages || loading}
                className="gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}