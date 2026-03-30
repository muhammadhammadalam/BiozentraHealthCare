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
  Cell,
} from "recharts";
import { useData } from "@/contexts/DataContext";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg max-w-[200px]">
        <p className="font-medium text-foreground text-xs mb-1 truncate">{label}</p>
        <p className="text-sm" style={{ color: payload[0]?.fill }}>
          Stock: {payload[0]?.value ?? 0} units
        </p>
        <p className="text-xs text-muted-foreground">{payload[0]?.payload?.status}</p>
      </div>
    );
  }
  return null;
};

export function InventoryChart() {
  const { products } = useData();

  const data = useMemo(() => {
    // Show individual medicines, sorted by stock ascending (low stock first)
    return products
      .map((p) => ({
        name: p.name.length > 16 ? p.name.slice(0, 14) + "…" : p.name,
        fullName: p.name,
        stock: p.stock,
        status: p.status,
      }))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 15); // cap at 15 products for readability
  }, [products]);

  // Colour each bar by stock status
  const barColor = (status: string) => {
    if (status === "Out of Stock") return "#dc2626"; // red
    if (status === "Low Stock")   return "#d97706"; // amber
    return "#16a34a"; // green
  };

  const hasData = data.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Inventory Status</h3>
          <p className="text-sm text-muted-foreground">Stock levels by medicine (lowest first)</p>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-green-600" />
            <span className="text-muted-foreground">In Stock</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-600" />
            <span className="text-muted-foreground">Out</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          No product data yet. Add products to see inventory levels.
        </div>
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="stock" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={barColor(entry.status)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
