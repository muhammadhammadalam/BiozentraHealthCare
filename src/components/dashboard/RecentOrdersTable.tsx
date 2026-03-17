import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";
import { Link } from "react-router-dom";

const statusStyles: Record<string, string> = {
  Delivered: "bg-success/10 text-success border-success/20",
  Processing: "bg-primary/10 text-primary border-primary/20",
  Shipped: "bg-accent/10 text-accent border-accent/20",
  Pending: "bg-warning/10 text-warning border-warning/20",
};

export function RecentOrdersTable() {
  const { orders } = useData();
  const recentOrders = [...orders]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="rounded-xl border border-border bg-card shadow-card"
    >
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Orders</h3>
          <p className="text-sm text-muted-foreground">Latest transactions across all channels</p>
        </div>
        <Button variant="ghost" size="sm" className="gap-1 text-primary" asChild>
          <Link to="/orders">
            View all
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {recentOrders.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          No orders yet. Start adding orders to see them here.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Products</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentOrders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className="group transition-colors hover:bg-muted/30"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">{order.id}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">{order.customer}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground max-w-[150px] truncate">{order.products}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">Rs. {order.total.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <Badge variant="outline" className={statusStyles[order.status] || ""}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{order.date}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
