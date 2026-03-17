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
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-accent">In Stock: {payload[0]?.value ?? 0} units</p>
        {payload[1] && (
          <p className="text-sm text-warning">Low/Out: {payload[1].value} units</p>
        )}
      </div>
    );
  }
  return null;
};

export function InventoryChart() {
  const { products } = useData();

  const data = useMemo(() => {
    const categoryMap: Record<string, { inStock: number; lowStock: number }> = {};
    products.forEach((p) => {
      if (!categoryMap[p.category]) categoryMap[p.category] = { inStock: 0, lowStock: 0 };
      if (p.status === "In Stock") {
        categoryMap[p.category].inStock += p.stock;
      } else {
        categoryMap[p.category].lowStock += p.stock;
      }
    });
    return Object.entries(categoryMap).map(([name, vals]) => ({ name, ...vals }));
  }, [products]);

  const hasData = data.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Inventory Status</h3>
          <p className="text-sm text-muted-foreground">Stock levels by category</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-accent" />
            <span className="text-muted-foreground">In Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-warning" />
            <span className="text-muted-foreground">Low/Out</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          No product data yet. Add products to see inventory by category.
        </div>
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="inStock" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lowStock" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
