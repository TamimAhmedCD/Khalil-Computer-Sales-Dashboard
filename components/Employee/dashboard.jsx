'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, TrendingUp, DollarSign, Award, Target, Clock, Activity, ShoppingCart, CheckCircle, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmployeeDashboard({ onNavigate, session }) {
  // Mock data
  const todaysSalesAmount = 45000;
  const todaysProfit = 9000;
  const myCommission = 2700;
  const monthlySales = 325000;
  const todaysTarget = 50000;

  const completionPercentage = (todaysSalesAmount / todaysTarget) * 100;
  const remainingTarget = todaysTarget - todaysSalesAmount;

  const todaysSales = [
    {
      time: '09:30 AM',
      productName: 'Wireless Headphones',
      category: 'Electronics',
      saleAmount: 8500,
      profit: 1700,
    },
    {
      time: '10:15 AM',
      productName: 'Smart Watch',
      category: 'Gadgets',
      saleAmount: 12000,
      profit: 2400,
    },
    {
      time: '11:45 AM',
      productName: 'Phone Case Bundle',
      category: 'Accessories',
      saleAmount: 5500,
      profit: 1100,
    },
    {
      time: '02:20 PM',
      productName: 'USB-C Cable Pack',
      category: 'Accessories',
      saleAmount: 4200,
      profit: 840,
    },
    {
      time: '03:50 PM',
      productName: 'Laptop Stand',
      category: 'Office',
      saleAmount: 14800,
      profit: 2960,
    },
  ];

  const recentActivities = [
    {
      id: 1,
      action: 'Added new sale',
      product: 'Wireless Headphones',
      time: '2 hours ago',
      icon: 'plus',
    },
    {
      id: 2,
      action: 'Updated sale',
      product: 'Smart Watch',
      time: '1 hour ago',
      icon: 'edit',
    },
    {
      id: 3,
      action: 'Completed sale',
      product: 'Phone Case Bundle',
      time: '30 minutes ago',
      icon: 'check',
    },
    {
      id: 4,
      action: 'Added new sale',
      product: 'USB-C Cable Pack',
      time: '15 minutes ago',
      icon: 'plus',
    },
  ];

  const getCategoryColor = (category) => {
    const colors = {
      Electronics: 'bg-blue-100 text-blue-700',
      Gadgets: 'bg-purple-100 text-purple-700',
      Accessories: 'bg-green-100 text-green-700',
      Office: 'bg-orange-100 text-orange-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const getActivityIcon = (iconType) => {
    const iconClasses = 'h-4 w-4';
    switch (iconType) {
      case 'plus':
        return <Plus className={iconClasses} />;
      case 'edit':
        return <TrendingUp className={iconClasses} />;
      case 'check':
        return <Award className={iconClasses} />;
      default:
        return <Activity className={iconClasses} />;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="space-y-6">
        {/* Header Section */}
        <div className={cn(
          'relative overflow-hidden rounded-xl p-8 md:p-10 border border-border shadow-lg',
          'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent',
          'before:absolute before:-right-20 before:-top-20 before:h-40 before:w-40 before:bg-primary/5 before:rounded-full',
          'after:absolute after:-left-20 after:-bottom-20 after:h-40 after:w-40 after:bg-primary/5 after:rounded-full'
        )}>
          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">Welcome back, {session.user.name}!</h1>
              </div>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-4">
                You&apos;re all set to manage your sales operations. Here&apos;s your dashboard overview for{' '}
                <span className="font-semibold text-foreground">
                  {new Date().toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </p>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-foreground">All systems operational</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="text-sm text-foreground">On track with targets</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap md:flex-col lg:flex-row justify-start md:justify-end">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 whitespace-nowrap">
                <ShoppingCart className="h-4 w-4" />
                Add Sale
              </Button>
              <Button variant="outline" className="border-border text-foreground gap-2 whitespace-nowrap hover:bg-accent">
                <DollarSign className="h-4 w-4" />
                Add Expense
              </Button>
              <Button variant="outline" className="border-border text-foreground gap-2 whitespace-nowrap hover:bg-accent">
                <Users className="h-4 w-4" />
                Add Employee
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards Section */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Today's Sales Amount */}
          <Card className="bg-card border border-border rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Today&apos;s Sales Amount
                </p>
                <p className="text-2xl font-bold text-foreground">
                  ₹{todaysSalesAmount.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Today's Profit */}
          <Card className="bg-card border border-border rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Today&apos;s Profit
                </p>
                <p className="text-2xl font-bold text-foreground">
                  ₹{todaysProfit.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          {/* My Commission */}
          <Card className="bg-card border border-border rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  My Commission
                </p>
                <p className="text-2xl font-bold text-foreground">
                  ₹{myCommission.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>

          {/* Monthly Sales */}
          <Card className="bg-card border border-border rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Monthly Sales
                </p>
                <p className="text-2xl font-bold text-foreground">
                  ₹{monthlySales.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Button
            onClick={() => onNavigate('sales')}
            className="h-auto flex flex-col items-center justify-center gap-3 p-6 bg-card border border-border text-foreground hover:bg-muted rounded-lg cursor-pointer"
          >
            <Plus className="h-6 w-6" />
            <span className="font-semibold">Add New Sale</span>
          </Button>
          <Button
            onClick={() => onNavigate('sales-list')}
            className="h-auto flex flex-col items-center justify-center gap-3 p-6 bg-card border border-border text-foreground hover:bg-muted rounded-lg cursor-pointer"
          >
            <TrendingUp className="h-6 w-6" />
            <span className="font-semibold">My Sales</span>
          </Button>
          <Button
            onClick={() => onNavigate('today-report')}
            className="h-auto flex flex-col items-center justify-center gap-3 p-6 bg-card border border-border text-foreground hover:bg-muted rounded-lg cursor-pointer"
          >
            <Clock className="h-6 w-6" />
            <span className="font-semibold">Today&apos;s Report</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Today's Sales Preview Table */}
          <div className="lg:col-span-2">
            <Card className="bg-card border border-border rounded-lg shadow-sm">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">
                  Today&apos;s Sales Preview
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                        Product Name
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                        Category
                      </th>
                      <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                        Sale Amount
                      </th>
                      <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                        Profit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaysSales.map((sale, index) => (
                      <tr key={index} className="border-b border-border hover:bg-muted/20">
                        <td className="px-6 py-4 text-foreground">{sale.time}</td>
                        <td className="px-6 py-4 text-foreground">{sale.productName}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                              sale.category
                            )}`}
                          >
                            {sale.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-foreground font-medium">
                          ₹{sale.saleAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-foreground font-medium">
                          ₹{sale.profit.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Performance Section */}
          <Card className="bg-card border border-border rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Today&apos;s Performance
            </h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Target</span>
                  <span className="text-sm font-semibold text-foreground">
                    ₹{todaysTarget.toLocaleString()}
                  </span>
                </div>
                <Progress value={Math.min(completionPercentage, 100)} className="h-2" />
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Current Sales
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    ₹{todaysSalesAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {completionPercentage.toFixed(1)}% of target
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Remaining Target
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    ₹{remainingTarget.toLocaleString()}
                  </p>
                  {remainingTarget <= 0 && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      🎉 Target achieved!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <Card className="bg-card border border-border rounded-lg shadow-sm">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="divide-y divide-border">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="p-6 flex items-center gap-4 hover:bg-muted/20">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {getActivityIcon(activity.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.product}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {activity.time}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
