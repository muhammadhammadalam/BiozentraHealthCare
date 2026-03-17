import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  Receipt,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { useData } from "@/contexts/DataContext";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { orders, products } = useData();

  // Dynamic badge counts
  const pendingOrdersCount = orders.filter((o) => o.status === "Pending").length;
  const lowStockCount = products.filter(
    (p) => p.status === "Low Stock" || p.status === "Out of Stock"
  ).length;

  const navigation = [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", icon: LayoutDashboard, href: "/" },
        { title: "Analytics", icon: BarChart3, href: "/analytics" },
      ],
    },
    {
      label: "Sales",
      items: [
        { title: "Orders", icon: ShoppingCart, href: "/orders", badge: pendingOrdersCount || undefined },
        { title: "Invoices", icon: Receipt, href: "/invoices" },
      ],
    },
    {
      label: "Inventory",
      items: [
        { title: "Products", icon: Package, href: "/products" },
        { title: "Stock", icon: Package, href: "/stock", badge: lowStockCount || undefined },
      ],
    },
    {
      label: "Contacts",
      items: [
        { title: "Customers", icon: Users, href: "/customers" },
        { title: "Suppliers", icon: Truck, href: "/suppliers" },
      ],
    },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex h-screen flex-col border-r border-sidebar-border bg-sidebar"
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <motion.div
          animate={{ scale: collapsed ? 1.1 : 1 }}
          className="flex h-10 w-10 items-center justify-center overflow-hidden"
        >
          <img src={logo} alt="Biozentra" className="h-10 w-10 object-contain" />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >
              <span className="text-sm font-bold text-sidebar-foreground">BIOZENTRA</span>
              <span className="text-xs text-muted-foreground">Healthcare</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navigation.map((group, groupIndex) => (
          <div key={group.label} className={cn("mb-6", groupIndex > 0 && "mt-6")}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 h-full w-1 rounded-r-full bg-sidebar-primary"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        isActive
                          ? "text-sidebar-primary"
                          : "text-muted-foreground group-hover:text-sidebar-foreground"
                      )}
                    />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="flex-1"
                        >
                          {item.title}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {item.badge != null && item.badge > 0 && !collapsed && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground"
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings */}
      <div className="border-t border-sidebar-border p-3">
        <Link
          to="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50"
        >
          <Settings className="h-5 w-5 text-muted-foreground" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-card shadow-md hover:bg-secondary"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>
    </motion.aside>
  );
}
