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
import { useState, cloneElement, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ScrollArea } from "./ui/scroll-area";

export function Sidebar({ isCollapsed, setIsCollapsed }) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) return null;

  /* ---------------- Render Helper ---------------- */

  const renderNavSection = (title, links) => {
    if (!Array.isArray(links) || links.length === 0) return null;
    return (
      <div className="px-3 mb-6">
        {showFullSidebar && (
          <p className="text-[10px] font-bold text-muted-foreground/80 mb-3 px-3 uppercase tracking-wider">
            {title}
          </p>
        )}
        <div className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                title={!showFullSidebar ? link.label : undefined}
                className={cn(
                  "group relative flex items-center rounded-xl transition-all duration-200 cursor-pointer overflow-hidden",
                  !showFullSidebar ? "justify-center p-2.5 mx-auto w-11" : "gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent/80 hover:text-foreground",
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary rounded-r-full" />
                )}

                <span
                  className={cn(
                    "shrink-0 transition-transform duration-200",
                    isActive ? "scale-110" : "group-hover:scale-110",
                  )}
                >
                  {cloneElement(link.icon, { size: 20 })}
                </span>

                {showFullSidebar && (
                  <span className="text-sm tracking-tight whitespace-nowrap">
                    {link.label}
                  </span>
                )}
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
          className="fixed top-3 left-4 z-50 md:hidden p-2 rounded-lg bg-background/80 backdrop-blur-md text-foreground border border-border shadow-sm hover:bg-accent transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-background/80 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 z-40 bg-background/95",
          "border-r border-border backdrop-blur-xl",
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
            "h-16 flex items-center border-b border-border/50 px-4 shrink-0",
            !showFullSidebar ? "justify-center" : "justify-between",
          )}
        >
          {showFullSidebar && (
            <div className="flex items-center gap-3 pl-2">
              <div className="w-9 h-9 bg-primary/10 rounded-[10px] flex items-center justify-center border border-primary/20">
                <Cpu className="text-primary w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-bold text-foreground tracking-tight leading-none">
                  KHALIL
                </h1>
                <span className="text-[10px] font-semibold text-primary uppercase tracking-widest mt-1">
                  Computers
                </span>
              </div>
            </div>
          )}

          {!isMobileOpen && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "p-1.5 hover:bg-accent rounded-lg text-muted-foreground transition-colors",
                !showFullSidebar && "mx-auto"
              )}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>
          )}
        </div>

        <ScrollArea className="flex-1 py-6 h-[calc(100vh-8rem)]">
          <div className="pb-8">
            {navigationSections.map((section, index) => (
              <div key={index}>
                {renderNavSection(section.section, section.links)}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div
          className={cn(
            "p-3 border-t border-border/50 mt-auto",
            !showFullSidebar && "flex justify-center",
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-3 rounded-xl transition-all outline-none group w-full",
                  !showFullSidebar
                    ? "justify-center p-1"
                    : "p-2 hover:bg-accent border border-transparent hover:border-border/50",
                )}
              >
                <div className="w-9 h-9 bg-primary/10 rounded-[10px] flex items-center justify-center text-primary font-bold text-sm border border-primary/20 transition-transform group-hover:scale-95 shrink-0">
                  {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                </div>

                {showFullSidebar && (
                  <>
                    <div className="flex-1 text-left overflow-hidden">
                      <p className="text-sm font-semibold text-foreground tracking-tight leading-none truncate mb-1">
                        {session?.user?.name || "User"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">
                        {session?.user?.role || "Staff"}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side={showFullSidebar ? "top" : "right"}
              align={showFullSidebar ? "end" : "end"}
              sideOffset={12}
              className="w-56 p-2 rounded-xl bg-card border-border shadow-lg"
            >
              <DropdownMenuLabel className="px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
                  Session Info
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {session?.user?.email || "No email"}
                </p>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem asChild className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer focus:bg-accent transition-colors">
                <Link href="/profile">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Profile</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer focus:bg-accent transition-colors">
                <Link href="/profile">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Preferences</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem
                onClick={() => signOut()}
                className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
