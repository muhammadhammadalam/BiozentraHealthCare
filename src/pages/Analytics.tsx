import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesTrendChart } from "@/components/dashboard/SalesTrendChart";
import { InventoryChart } from "@/components/dashboard/InventoryChart";
import { RevenueExpenseChart } from "@/components/dashboard/RevenueExpenseChart";
import { TrendingUp, TrendingDown, Target, Users } from "lucide-react";

const Analytics = () => {
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
        {[
          { title: "Revenue Growth", value: "+15.3%", icon: TrendingUp, color: "text-green-600" },
          { title: "Order Volume", value: "+8.2%", icon: TrendingUp, color: "text-green-600" },
          { title: "Avg. Order Value", value: "Rs. 2,450", icon: Target, color: "text-primary" },
          { title: "New Customers", value: "23", icon: Users, color: "text-primary" },
        ].map((stat, i) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-muted p-3">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
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
