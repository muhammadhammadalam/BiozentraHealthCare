import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useData } from "@/contexts/DataContext";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const revenue = payload[0]?.value || 0;
    const expenses = payload[1]?.value || 0;
    const profit = revenue - expenses;
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-primary">Revenue: Rs. {revenue.toLocaleString()}</p>
        <p className="text-sm text-destructive">Expenses: Rs. {expenses.toLocaleString()}</p>
        <div className="mt-1 border-t border-border pt-1">
          <p className={`text-sm font-medium ${profit >= 0 ? "text-success" : "text-destructive"}`}>
            Profit: Rs. {profit.toLocaleString()}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function RevenueExpenseChart() {
  const { invoices } = useData();

  const data = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
      const monthName = d.toLocaleDateString("en-US", { month: "short" });

      // Revenue = paid invoices this month
      const revenue = invoices
        .filter((inv) => inv.date?.startsWith(monthKey) && inv.status === "Paid")
        .reduce((sum, inv) => sum + inv.amount, 0);

      // Expenses = pending + overdue invoices this month
      const expenses = invoices
        .filter(
          (inv) =>
            inv.date?.startsWith(monthKey) &&
            (inv.status === "Pending" || inv.status === "Overdue")
        )
        .reduce((sum, inv) => sum + inv.amount, 0);

      months.push({ month: monthName, revenue, expenses });
    }
    return months;
  }, [invoices]);

  const hasData = data.some((d) => d.revenue > 0 || d.expenses > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Revenue vs Expenses</h3>
          <p className="text-sm text-muted-foreground">Last 6 months comparison</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-chart-3" />
            <span className="text-muted-foreground">Expenses</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          No invoice data yet. Create invoices to see revenue vs expenses.
        </div>
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  v >= 1000 ? `Rs.${(v / 1000).toFixed(0)}k` : `Rs.${v}`
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
