import { useMemo } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { SalesTrendChart } from "@/components/dashboard/SalesTrendChart";
import { InventoryChart } from "@/components/dashboard/InventoryChart";
import { RevenueExpenseChart } from "@/components/dashboard/RevenueExpenseChart";
import { TrendingUp, TrendingDown, Target, Users, Package } from "lucide-react";
import { useData } from "@/contexts/DataContext";

const Analytics = () => {
  const { orders, customers, products, invoices } = useData();

  const stats = useMemo(() => {
    // Total revenue from delivered orders
    const totalRevenue = orders
      .filter((o) => o.status === "Delivered")
      .reduce((sum, o) => sum + o.total, 0);

    // Average order value
    const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

    // Revenue this month vs last month
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.toISOString().slice(0, 7);

    const thisMonthRevenue = orders
      .filter((o) => o.date?.startsWith(thisMonth) && o.status === "Delivered")
      .reduce((sum, o) => sum + o.total, 0);
    const lastMonthRevenue = orders
      .filter((o) => o.date?.startsWith(lastMonth) && o.status === "Delivered")
      .reduce((sum, o) => sum + o.total, 0);

    const revenueGrowth =
      lastMonthRevenue > 0
        ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
        : thisMonthRevenue > 0
        ? "100"
        : "0";

    const isGrowthPositive = parseFloat(revenueGrowth as string) >= 0;

    // Orders this month vs last
    const thisMonthOrders = orders.filter((o) => o.date?.startsWith(thisMonth)).length;
    const lastMonthOrders = orders.filter((o) => o.date?.startsWith(lastMonth)).length;
    const orderGrowth =
      lastMonthOrders > 0
        ? (((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100).toFixed(1)
        : thisMonthOrders > 0
        ? "100"
        : "0";
    const isOrderGrowthPositive = parseFloat(orderGrowth as string) >= 0;

    // Low stock count
    const lowStock = products.filter(
      (p) => p.status === "Low Stock" || p.status === "Out of Stock"
    ).length;

    return {
      totalRevenue,
      avgOrderValue,
      revenueGrowth,
      isGrowthPositive,
      orderGrowth,
      isOrderGrowthPositive,
      totalCustomers: customers.length,
      totalOrders: orders.length,
      lowStock,
    };
  }, [orders, customers, products, invoices]);

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `Rs. ${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `Rs. ${(val / 1000).toFixed(1)}K`;
    return `Rs. ${val.toLocaleString()}`;
  };

  const statCards = [
    {
      title: "Revenue Growth",
      value: `${stats.isGrowthPositive ? "+" : ""}${stats.revenueGrowth}%`,
      icon: stats.isGrowthPositive ? TrendingUp : TrendingDown,
      color: stats.isGrowthPositive ? "text-green-600" : "text-destructive",
      sub: "vs last month",
    },
    {
      title: "Order Volume",
      value: `${stats.isOrderGrowthPositive ? "+" : ""}${stats.orderGrowth}%`,
      icon: stats.isOrderGrowthPositive ? TrendingUp : TrendingDown,
      color: stats.isOrderGrowthPositive ? "text-green-600" : "text-destructive",
      sub: "vs last month",
    },
    {
      title: "Avg. Order Value",
      value: formatCurrency(stats.avgOrderValue),
      icon: Target,
      color: "text-primary",
      sub: `${stats.totalOrders} orders total`,
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers.toString(),
      icon: Users,
      color: "text-primary",
      sub: stats.lowStock > 0 ? `${stats.lowStock} products low/out of stock` : "All stock healthy",
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Analytics</h1>
          <p className="mt-1 text-muted-foreground">Business insights and performance metrics</p>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-muted p-3">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                  {stat.sub && (
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <SalesTrendChart />
          <InventoryChart />
        </div>
        <RevenueExpenseChart />
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
