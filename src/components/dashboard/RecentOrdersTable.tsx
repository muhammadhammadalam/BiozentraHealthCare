import { motion } from "framer-motion";
import { MoreHorizontal, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const orders = [
  {
    id: "ORD-2024-001",
    customer: "City Medical Store",
    items: 12,
    total: 24500,
    status: "delivered",
    date: "2 hours ago",
  },
  {
    id: "ORD-2024-002",
    customer: "HealthPlus Pharmacy",
    items: 8,
    total: 18200,
    status: "processing",
    date: "4 hours ago",
  },
  {
    id: "ORD-2024-003",
    customer: "MediCare Clinic",
    items: 24,
    total: 52800,
    status: "shipped",
    date: "6 hours ago",
  },
  {
    id: "ORD-2024-004",
    customer: "Apollo Distributors",
    items: 45,
    total: 98500,
    status: "pending",
    date: "1 day ago",
  },
  {
    id: "ORD-2024-005",
    customer: "Care Hospital",
    items: 18,
    total: 34200,
    status: "delivered",
    date: "1 day ago",
  },
];

const statusStyles: Record<string, string> = {
  delivered: "bg-success/10 text-success border-success/20",
  processing: "bg-primary/10 text-primary border-primary/20",
  shipped: "bg-accent/10 text-accent border-accent/20",
  pending: "bg-warning/10 text-warning border-warning/20",
};

export function RecentOrdersTable() {
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
        <Button variant="ghost" size="sm" className="gap-1 text-primary">
          View all
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date
              </th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order, index) => (
              <motion.tr
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                className="group transition-colors hover:bg-muted/30"
              >
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">
                  {order.id}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                  {order.customer}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                  {order.items} items
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">
                  Rs. {order.total.toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Badge variant="outline" className={statusStyles[order.status]}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                  {order.date}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
