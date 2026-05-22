'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    TrendingUp,
    TrendingDown,
    Users,
    AlertCircle,
    DollarSign,
    ShoppingCart,
    Zap,
    Clock,
    Target,
    Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SummaryGrid } from './SummaryCards';
import DashboardCharts from './DashboardCharts';
import RecentSalesTable from './RecentSalesTable';
import TopEmployeesTable from './TopEmployeesTable';
import ExpenseOverview from './ExpenseOverview';
import NotificationSection from './NotificationSection';

const chartColors = {
    sales: '#0066FF',
    profit: '#00CC99',
    expense: '#FF6B6B',
    commission: '#FFB946',
};

const salesData = [
    { date: 'Apr 06', sales: 15000, profit: 4500 },
    { date: 'Apr 07', sales: 18000, profit: 5400 },
    { date: 'Apr 08', sales: 12000, profit: 3600 },
    { date: 'Apr 09', sales: 22000, profit: 6600 },
    { date: 'Apr 10', sales: 19000, profit: 5700 },
    { date: 'Apr 11', sales: 25000, profit: 7500 },
    { date: 'Apr 12', sales: 28000, profit: 8400 },
];

const profitData = [
    { date: 'Apr 01', profit: 8000 },
    { date: 'Apr 05', profit: 12000 },
    { date: 'Apr 08', profit: 15000 },
    { date: 'Apr 12', profit: 18000 },
    { date: 'Apr 15', profit: 14000 },
    { date: 'Apr 19', profit: 16000 },
    { date: 'Apr 22', profit: 20000 },
    { date: 'Apr 26', profit: 22000 },
    { date: 'Apr 30', profit: 25000 },
];

const recentSales = [
    { id: 1, time: '10:30 AM', employee: 'Rahul Kumar', product: 'Premium Plan', category: 'Electronics', amount: 15000, profit: 4500 },
    { id: 2, time: '11:15 AM', employee: 'Priya Singh', product: 'Basic Plan', category: 'Software', amount: 8500, profit: 1700 },
    { id: 3, time: '12:00 PM', employee: 'Amit Patel', product: 'Enterprise Plan', category: 'Services', amount: 45000, profit: 9000 },
    { id: 4, time: '01:45 PM', employee: 'Neha Sharma', product: 'Pro Plan', category: 'Electronics', amount: 28000, profit: 8400 },
    { id: 5, time: '02:30 PM', employee: 'Rajesh Verma', product: 'Standard Plan', category: 'Software', amount: 18000, profit: 3600 },
    { id: 6, time: '03:15 PM', employee: 'Deepika Nair', product: 'Premium Plan', category: 'Services', amount: 35000, profit: 7000 },
    { id: 7, time: '04:00 PM', employee: 'Vikram Singh', product: 'Basic Plan', category: 'Electronics', amount: 12000, profit: 3600 },
    { id: 8, time: '04:45 PM', employee: 'Anjali Desai', product: 'Enterprise Plan', category: 'Software', amount: 52000, profit: 10400 },
    { id: 9, time: '05:30 PM', employee: 'Suresh Kumar', product: 'Pro Plan', category: 'Services', amount: 32000, profit: 6400 },
    { id: 10, time: '06:15 PM', employee: 'Divya Reddy', product: 'Premium Plan', category: 'Electronics', amount: 25000, profit: 7500 },
];

const topEmployees = [
    { id: 1, name: 'Rahul Kumar', sales: 425000, profit: 102000, commission: 15300 },
    { id: 2, name: 'Priya Singh', sales: 385000, profit: 92400, commission: 13860 },
    { id: 3, name: 'Amit Patel', sales: 468000, profit: 112320, commission: 16848 },
    { id: 4, name: 'Neha Sharma', sales: 392000, profit: 94080, commission: 14112 },
    { id: 5, name: 'Rajesh Verma', sales: 351000, profit: 84240, commission: 12636 },
];

export function AdminDashboard({ session }) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(recentSales.length / itemsPerPage);
    const paginatedSales = recentSales.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const todaysSales = 28000;
    const todaysProfit = 8400;
    const todaysExpense = 2500;
    const totalCommission = 76000;
    const totalEmployees = 15;
    const netProfit = 125000;

    return (
        <div className="min-h-screen bg-background">
            <div className="space-y-6">
                {/* Welcome Banner */}
                <div className={cn(
                    'relative overflow-hidden rounded-3xl border border-primary/10 shadow-xl',
                    'bg-white dark:bg-zinc-950',
                    'bg-linear-to-br from-primary/3 to-transparent',
                    'p-1' // Outer border ring effect
                )}>
                    <div className="relative z-10 bg-white dark:bg-zinc-950 rounded-[calc(1.5rem-1px)] p-6 md:p-10 flex flex-col lg:flex-row gap-10">

                        {/* Left Side: Information & Primary Call to Action */}
                        <div className="flex-1 space-y-6">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                                    <Zap className="h-3 w-3 fill-current" />
                                    Live Dashboard
                                </div>

                                <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight">
                                    Welcome back,<br />
                                    <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60">
                                        {session.user.name}
                                    </span>
                                </h1>

                                <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
                                    Your sales operations are currently <span className="text-green-600 font-medium">ahead of schedule</span>.
                                    Review your stats for {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.
                                </p>
                            </div>

                            {/* Primary Button placed right under the intro text */}
                            <div className="flex items-center gap-4">
                                <Button className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 rounded-2xl gap-3 text-lg font-bold transition-all hover:-translate-y-1">
                                    <Plus className="h-6 w-6" />
                                    Add New Sale
                                </Button>
                            </div>
                        </div>

                        {/* Right Side: Quick Action Card */}
                        <div className="lg:w-80 w-full flex flex-col gap-3 justify-center">
                            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">
                                    Quick Management
                                </p>

                                <div className="grid grid-cols-1 gap-2">
                                    <Button variant="ghost" className="justify-start h-12 rounded-xl hover:bg-white dark:hover:bg-zinc-900 hover:shadow-sm border border-transparent hover:border-border transition-all gap-3 group">
                                        <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20">
                                            <DollarSign className="h-4 w-4 text-orange-600" />
                                        </div>
                                        <span className="font-semibold">Log Expense</span>
                                    </Button>

                                    <Button variant="ghost" className="justify-start h-12 rounded-xl hover:bg-white dark:hover:bg-zinc-900 hover:shadow-sm border border-transparent hover:border-border transition-all gap-3 group">
                                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20">
                                            <Users className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <span className="font-semibold">Staff Members</span>
                                    </Button>

                                    <Button variant="ghost" className="justify-start h-12 rounded-xl hover:bg-white dark:hover:bg-zinc-900 hover:shadow-sm border border-transparent hover:border-border transition-all gap-3 group">
                                        <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20">
                                            <Target className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <span className="font-semibold">Set Goals</span>
                                    </Button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Summary Cards */}
                <SummaryGrid todaysSales={todaysSales} todaysProfit={todaysProfit} todaysExpense={todaysExpense} totalCommission={totalCommission} totalEmployees={totalEmployees} netProfit={netProfit} />

                {/* Charts Section */}
                <DashboardCharts salesData={salesData} profitData={profitData} />

                {/* Recent Sales Section */}
                <RecentSalesTable paginatedSales={paginatedSales} currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={totalPages} itemsPerPage={itemsPerPage} recentSales={recentSales} />

                {/* Expense Overview Section */}
                <ExpenseOverview />

                {/* Top Employees Section */}
                <TopEmployeesTable topEmployees={topEmployees} />

                {/* Alerts / Notifications Section */}
                <NotificationSection />
            </div>
        </div>
    );
}
