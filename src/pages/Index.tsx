import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp,
  ArrowUpRight,
  Calendar
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { SalesTrendChart } from "@/components/dashboard/SalesTrendChart";
import { InventoryChart } from "@/components/dashboard/InventoryChart";
import { RevenueExpenseChart } from "@/components/dashboard/RevenueExpenseChart";
import { RecentOrdersTable } from "@/components/dashboard/RecentOrdersTable";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-foreground sm:text-3xl"
          >
            Dashboard
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-1 text-muted-foreground"
          >
            Welcome back! Here's what's happening with your business.
          </motion.p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            Last 30 days
          </Button>
          <Button size="sm" className="gap-2">
            Download Report
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="Total Sales"
          value="Rs. 12.4L"
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
          variant="primary"
          delay={0}
        />
        <KPICard
          title="Total Orders"
          value="1,284"
          icon={ShoppingCart}
          trend={{ value: 8.2, isPositive: true }}
          delay={0.05}
        />
        <KPICard
          title="Products in Stock"
          value="2,847"
          icon={Package}
          trend={{ value: 3.1, isPositive: false }}
          variant="accent"
          delay={0.1}
        />
        <KPICard
          title="Suppliers & Customers"
          value="348"
          icon={Users}
          trend={{ value: 5.4, isPositive: true }}
          delay={0.15}
        />
        <KPICard
          title="Monthly Revenue"
          value="Rs. 6.8L"
          icon={TrendingUp}
          trend={{ value: 15.3, isPositive: true }}
          variant="warning"
          delay={0.2}
        />
      </div>

      {/* Charts Grid */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <SalesTrendChart />
        <InventoryChart />
      </div>

      <div className="mb-8">
        <RevenueExpenseChart />
      </div>

      {/* Recent Orders */}
      <RecentOrdersTable />
    </DashboardLayout>
  );
};

export default Index;
