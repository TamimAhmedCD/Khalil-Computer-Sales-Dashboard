"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Settings,
  Users,
  Package,
  Store,
  FileText,
  Home,
  Menu,
  ClipboardList,
  Plus,
  List,
  ChevronLeft,
  ChevronRight,
  Cpu,
  ChevronDown,
  User,
  LogOut,
  Layers,
  ListPlus,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, cloneElement } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function Sidebar({ isCollapsed, setIsCollapsed }) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const showFullSidebar = isMobileOpen || !isCollapsed;

  /* ---------------- Navigation Definitions ---------------- */

  // SUPER ADMIN - All system access
  const superAdminNavLinks = [
    { section: "Dashboard", links: [
      { href: "/super-admin/dashboard", label: "Overview", icon: <Home /> },
    ]},
    { section: "Sales & Reports", links: [
      { href: "/super-admin/sales", label: "Sales Entry", icon: <BarChart3 /> },
      { href: "/super-admin/reports", label: "Reports", icon: <FileText /> },
    ]},
    { section: "System", links: [
      { href: "/settings", label: "Settings", icon: <Settings /> },
    ]},
  ];

  // ADMIN - Business operations
  const adminNavLinks = [
    { section: "Dashboard", links: [
      { href: "/admin/dashboard", label: "Overview", icon: <Home /> },
    ]},
    { section: "Sales", links: [
      { href: "/admin/sales/add", label: "New Sale", icon: <ListPlus /> },
      { href: "/admin/sales", label: "Sales List", icon: <List /> },
      { href: "/admin/transactions", label: "Transactions", icon: <Store /> },
    ]},
    { section: "Expenses", links: [
      { href: "/admin/expenses", label: "Manage Expenses", icon: <Wallet /> },
    ]},
    { section: "Inventory", links: [
      { href: "/admin/products", label: "Products", icon: <Package /> },
      { href: "/admin/add-product", label: "Add Product", icon: <Plus /> },
      { href: "/admin/categories", label: "Categories", icon: <Layers /> },
    ]},
    { section: "Team", links: [
      { href: "/admin/employees", label: "Employees", icon: <Users /> },
    ]},
    { section: "Reports", links: [
      { href: "/admin/reports", label: "Business Reports", icon: <FileText /> },
    ]},
    { section: "System", links: [
      { href: "/settings", label: "Settings", icon: <Settings /> },
    ]},
  ];

  // EMPLOYEE - Limited access
  const employeeNavLinks = [
    { section: "Dashboard", links: [
      { href: "/employee/dashboard", label: "My Dashboard", icon: <Home /> },
    ]},
    { section: "Products", links: [
      { href: "/employee/products", label: "View Products", icon: <Package /> },
    ]},
    { section: "Sales", links: [
      { href: "/employee/sales/add", label: "New Sale", icon: <Plus /> },
      { href: "/employee/sales", label: "My Sales", icon: <List /> },
    ]},
    { section: "Reports", links: [
      { href: "/employee/reports", label: "My Reports", icon: <ClipboardList /> },
    ]},
  ];

  // Role-based navigation
  const roleNavigation = {
    superAdmin: superAdminNavLinks,
    admin: adminNavLinks,
    employee: employeeNavLinks,
  };

  const navigationSections = roleNavigation[role] || [];

  /* ---------------- Render Helper (Fixed) ---------------- */

  const renderNavSection = (title, links) => {
    if (!Array.isArray(links) || links.length === 0) return null;
    return (
      <div className="px-4 mb-8">
        {showFullSidebar && (
          <p className="text-[10px] font-black text-zinc-500 mb-4 px-4 uppercase tracking-[0.3em]">
            {title}
          </p>
        )}
        <div className="space-y-1.5">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
              >
                <div
                  title={!showFullSidebar ? link.label : ""}
                  className={cn(
                    "group relative flex items-center rounded-2xl transition-all duration-300 cursor-pointer",
                    !showFullSidebar ? "justify-center p-3" : "gap-4 px-4 py-3",
                    isActive
                      ? "bg-black dark:bg-white text-white dark:text-black shadow-lg"
                      : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:text-black dark:hover:text-white",
                  )}
                >
                  {isActive && showFullSidebar && (
                    <div className="absolute left-0 w-1 h-5 bg-white dark:bg-black rounded-r-full" />
                  )}

                  {/* FIXED: Removed JSON.stringify. Using cloneElement to pass size safely */}
                  <span
                    className={cn(
                      "shrink-0 transition-transform duration-300 group-hover:scale-110",
                      isActive ? "scale-110" : "scale-100",
                    )}
                  >
                    {cloneElement(link.icon, { size: 18 })}
                  </span>

                  {showFullSidebar && (
                    <span className="text-sm font-black tracking-tight whitespace-nowrap">
                      {link.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-50 md:hidden p-3 rounded-xl bg-white dark:bg-zinc-900 text-black dark:text-white border border-zinc-200 dark:border-zinc-800 shadow-xl"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen flex flex-col transition-all duration-500 z-40",
          " border-r",
          isMobileOpen
            ? "w-72 translate-x-0"
            : cn(
                isCollapsed ? "w-20" : "w-64",
                "-translate-x-full md:translate-x-0",
              ),
        )}
      >
        <div
          className={cn(
            "h-16 flex items-center border-b border-zinc-100 dark:border-zinc-800/50 px-6 shrink-0",
            !showFullSidebar ? "justify-center" : "justify-between",
          )}
        >
          {showFullSidebar && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black dark:bg-white rounded-[1.2rem] flex items-center justify-center shadow-lg rotate-3">
                <Cpu className="text-white dark:text-black w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-black text-black dark:text-white tracking-tighter leading-none">
                  KHALIL
                </h1>
                <span className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] mt-0.5">
                  COMPUTER
                </span>
              </div>
            </div>
          )}

          {!isMobileOpen && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl text-zinc-400"
            >
              {isCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-8 no-scrollbar">
          {navigationSections.map((section, index) => (
            <div key={index}>
              {renderNavSection(section.section, section.links)}
            </div>
          ))}
        </nav>

        <div
          className={cn(
            "p-4 border-t border-zinc-100 dark:border-zinc-800/50 mt-auto",
            !showFullSidebar && "flex justify-center",
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-3 rounded-2xl transition-all outline-none group w-full",
                  !showFullSidebar
                    ? "justify-center p-1"
                    : "p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/50",
                )}
              >
                {/* Avatar Squircle */}
                <div className="w-9 h-9 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black font-black text-sm shadow-xl transition-transform group-hover:scale-95 group-hover:rotate-3 shrink-0">
                  {session?.user?.name?.charAt(0).toUpperCase() || "K"}
                </div>

                {/* User Info - Only visible when sidebar is open */}
                {showFullSidebar && (
                  <>
                    <div className="flex-1 text-left overflow-hidden">
                      <p className="text-xs font-black text-black dark:text-white uppercase tracking-tighter leading-none truncate">
                        {session?.user?.name}
                      </p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.15em] mt-1 truncate">
                        {session?.user?.role || "Staff"}
                      </p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>

            {/* Dropdown Content */}
            <DropdownMenuContent
              side={showFullSidebar ? "top" : "right"}
              align={showFullSidebar ? "end" : "start"}
              sideOffset={12}
              className="w-60 p-2 rounded-2xl bg-white dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            >
              <DropdownMenuLabel className="px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                  Staff Terminal
                </p>
                <p className="text-sm font-bold text-black dark:text-white mt-1 truncate">
                  {session?.user?.email}
                </p>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />

              <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-xl cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-900 transition-colors group/item">
                <User className="w-4 h-4 text-zinc-500 group-hover/item:text-black dark:group-hover/item:text-white transition-colors" />
                <span className="text-xs font-bold uppercase tracking-tight">
                  Profile Terminal
                </span>
              </DropdownMenuItem>

              <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-xl cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-900 transition-colors group/item">
                <Settings className="w-4 h-4 text-zinc-400 group-hover/item:text-black dark:group-hover/item:text-white transition-colors" />
                <span className="text-xs font-bold uppercase tracking-tight">
                  System Settings
                </span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />

              <DropdownMenuItem
                onClick={() => signOut()}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer text-red-500 focus:bg-red-50 dark:focus:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">
                  Terminate Session
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
