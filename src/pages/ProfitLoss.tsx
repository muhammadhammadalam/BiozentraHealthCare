import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Receipt,
  Wallet, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from "recharts";
import { useData } from "@/contexts/DataContext";

// ─── Expense loader ───────────────────────────────────────────────────────────
const EXPENSES_KEY = "biozentra-expenses";
interface StoredExpense { id: string; date: string; category: string; description: string; amount: number; }
function loadExpenses(): StoredExpense[] {
  try { return JSON.parse(localStorage.getItem(EXPENSES_KEY) || "[]"); } catch { return []; }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  "Rs. " + Math.abs(n).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${MONTHS[parseInt(m) - 1]} ${y}`;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProfitLoss() {
  const { invoices, orders, products } = useData();
  const expenses = useMemo(() => loadExpenses(), []);

  // Build a name → costPrice lookup from products
  const costMap = useMemo(() => {
    const m: Record<string, number> = {};
    products.forEach(p => { m[p.name.toLowerCase()] = p.costPrice ?? 0; });
    return m;
  }, [products]);

  // COGS for a single order: sum of costPrice × qty per line item
  const orderCOGS = (order: { lineItems?: { product: string; qty: number }[]; total?: number }) => {
    if (order.lineItems && order.lineItems.length > 0) {
      return order.lineItems.reduce((sum, li) => {
        const cost = costMap[li.product.toLowerCase()] ?? 0;
        return sum + cost * li.qty;
      }, 0);
    }
    return 0;
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const years = useMemo(() => {
    const set = new Set<number>();
    set.add(currentYear);
    invoices.forEach(i => { if (i.date) set.add(new Date(i.date).getFullYear()); });
    orders.forEach(o => { if (o.date) set.add(new Date(o.date).getFullYear()); });
    expenses.forEach(e => { if (e.date) set.add(new Date(e.date).getFullYear()); });
    return Array.from(set).sort((a, b) => b - a);
  }, [invoices, orders, expenses, currentYear]);

  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  // ── Monthly data ─────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const yr = selectedYear;
    const map: Record<string, { revenue: number; cogs: number; opex: number }> = {};

    for (let m = 1; m <= 12; m++) {
      const key = `${yr}-${String(m).padStart(2, "0")}`;
      map[key] = { revenue: 0, cogs: 0, opex: 0 };
    }

    // Revenue: paid invoices
    invoices
      .filter(i => i.status === "Paid" && i.date?.startsWith(yr))
      .forEach(i => {
        const key = i.date!.slice(0, 7);
        if (map[key]) map[key].revenue += i.total ?? 0;
      });

    // COGS: costPrice × qty per line item in delivered orders
    orders
      .filter(o => o.status === "Delivered" && o.date?.startsWith(yr))
      .forEach(o => {
        const key = o.date!.slice(0, 7);
        if (map[key]) map[key].cogs += orderCOGS(o);
      });

    // OpEx: all expenses
    expenses
      .filter(e => e.date?.startsWith(yr))
      .forEach(e => {
        const key = e.date.slice(0, 7);
        if (map[key]) map[key].opex += e.amount ?? 0;
      });

    return Object.entries(map).map(([ym, v]) => ({
      month: monthLabel(ym),
      revenue: Math.round(v.revenue),
      cogs: Math.round(v.cogs),
      opex: Math.round(v.opex),
      grossProfit: Math.round(v.revenue - v.cogs),
      netProfit: Math.round(v.revenue - v.cogs - v.opex),
    }));
  }, [invoices, orders, expenses, selectedYear, orderCOGS]);

  // ── Annual totals ─────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const revenue  = monthlyData.reduce((s, m) => s + m.revenue, 0);
    const cogs     = monthlyData.reduce((s, m) => s + m.cogs, 0);
    const opex     = monthlyData.reduce((s, m) => s + m.opex, 0);
    const gross    = revenue - cogs;
    const net      = gross - opex;
    const grossPct = revenue > 0 ? ((gross / revenue) * 100).toFixed(1) : "0.0";
    const netPct   = revenue > 0 ? ((net / revenue) * 100).toFixed(1) : "0.0";
    return { revenue, cogs, opex, gross, net, grossPct, netPct };
  }, [monthlyData]);

  // ── Prior year comparison ─────────────────────────────────────────────────
  const priorYear = String(parseInt(selectedYear) - 1);
  const priorNet = useMemo(() => {
    const rev = invoices.filter(i => i.status === "Paid" && i.date?.startsWith(priorYear)).reduce((s, i) => s + (i.total ?? 0), 0);
    const cog = orders.filter(o => o.status === "Delivered" && o.date?.startsWith(priorYear)).reduce((s, o) => s + orderCOGS(o), 0);
    const opx = expenses.filter(e => e.date?.startsWith(priorYear)).reduce((s, e) => s + (e.amount ?? 0), 0);
    return rev - cog - opx;
  }, [invoices, orders, expenses, priorYear, orderCOGS]);

  const yoyChange = priorNet !== 0
    ? (((totals.net - priorNet) / Math.abs(priorNet)) * 100).toFixed(1)
    : totals.net > 0 ? "+100.0" : "0.0";

  const isPositiveYoy = parseFloat(yoyChange) >= 0;

  // ── Expense breakdown ─────────────────────────────────────────────────────
  const expenseBreakdown = useMemo(() => {
    const catMap: Record<string, number> = {};
    expenses
      .filter(e => e.date?.startsWith(selectedYear))
      .forEach(e => { catMap[e.category] = (catMap[e.category] ?? 0) + e.amount; });
    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [expenses, selectedYear]);

  const BAR_COLORS = ["#0f5228","#22c55e","#166534","#4ade80","#15803d","#86efac","#14532d","#bbf7d0"];

  // ─── Stat card ─────────────────────────────────────────────────────────────
  const StatCard = ({
    label, value, sub, icon: Icon, positive, neutral,
  }: {
    label: string; value: string; sub?: string;
    icon: React.ElementType; positive?: boolean; neutral?: boolean;
  }) => (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold ${neutral ? "text-foreground" : positive ? "text-emerald-600" : "text-red-500"}`}>
              {value}
            </p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`rounded-lg p-2.5 ${neutral ? "bg-muted" : positive ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
            <Icon className={`h-5 w-5 ${neutral ? "text-muted-foreground" : positive ? "text-emerald-600" : "text-red-500"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-card p-3 shadow-lg text-xs space-y-1">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex justify-between gap-6">
            <span className="text-muted-foreground">{p.name}</span>
            <span className="font-medium" style={{ color: p.color }}>{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6 p-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Profit & Loss</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Revenue, cost of goods, operating expenses, and net profit
            </p>
          </div>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Revenue"   value={fmt(totals.revenue)} sub="Paid invoices"              icon={Receipt}      positive neutral={totals.revenue === 0} />
          <StatCard label="Cost of Sales"   value={fmt(totals.cogs)}    sub="Delivered orders"           icon={ShoppingCart} positive={false} neutral={totals.cogs === 0} />
          <StatCard label="Gross Profit"    value={fmt(totals.gross)}   sub={`${totals.grossPct}% margin`} icon={TrendingUp}  positive={totals.gross >= 0} neutral={totals.gross === 0} />
          <StatCard label="Net Profit"      value={fmt(totals.net)}     sub={`${totals.netPct}% margin`}   icon={DollarSign}  positive={totals.net >= 0}   neutral={totals.net === 0} />
        </div>

        {/* P&L Summary strip */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">P&L Summary — {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: "Revenue",           value: totals.revenue, indent: false, bold: false,  color: "text-foreground" },
                { label: "Cost of Sales (COGS)", value: -totals.cogs, indent: true, bold: false, color: "text-red-500" },
                { label: "Gross Profit",      value: totals.gross,   indent: false, bold: true,  color: totals.gross >= 0 ? "text-emerald-600" : "text-red-500" },
                { label: "Operating Expenses",value: -totals.opex,   indent: true,  bold: false, color: "text-red-500" },
                { label: "Net Profit",         value: totals.net,    indent: false, bold: true,  color: totals.net >= 0 ? "text-emerald-600" : "text-red-500" },
              ].map(({ label, value, indent, bold, color }, i) => (
                <div key={i}>
                  {(i === 2 || i === 4) && <div className="my-2 border-t border-dashed border-border" />}
                  <div className={`flex items-center justify-between py-1.5 ${indent ? "pl-4" : ""}`}>
                    <span className={`text-sm ${bold ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                    <span className={`text-sm font-medium ${color}`}>
                      {value < 0 ? `(${fmt(value)})` : fmt(value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* YoY badge */}
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 p-3">
              {isPositiveYoy
                ? <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                : <ArrowDownRight className="h-4 w-4 text-red-500" />}
              <span className="text-xs text-muted-foreground">
                Net profit vs {priorYear}:
              </span>
              <Badge variant={isPositiveYoy ? "default" : "destructive"} className="text-xs">
                {isPositiveYoy ? "+" : ""}{yoyChange}%
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                Prior year: {fmt(priorNet)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* Monthly net profit line */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Monthly Net Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                    tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip content={customTooltip} />
                  <Line
                    type="monotone" dataKey="netProfit" name="Net Profit"
                    stroke="#0f5228" strokeWidth={2.5} dot={{ r: 3, fill: "#0f5228" }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone" dataKey="grossProfit" name="Gross Profit"
                    stroke="#22c55e" strokeWidth={1.5} strokeDasharray="4 2"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue vs COGS vs OpEx bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Revenue vs Costs by Month</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                    tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip content={customTooltip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[3,3,0,0]} maxBarSize={18} />
                  <Bar dataKey="cogs"    name="COGS"    fill="#f87171" radius={[3,3,0,0]} maxBarSize={18} />
                  <Bar dataKey="opex"    name="OpEx"    fill="#fb923c" radius={[3,3,0,0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Expense breakdown */}
        {expenseBreakdown.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Operating Expense Breakdown — {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Bar chart */}
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={expenseBreakdown} layout="vertical"
                    margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                      tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip content={customTooltip} />
                    <Bar dataKey="value" name="Amount" radius={[0,3,3,0]} maxBarSize={16}>
                      {expenseBreakdown.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Table */}
                <div className="space-y-2">
                  {expenseBreakdown.map((e, i) => {
                    const pct = totals.opex > 0 ? ((e.value / totals.opex) * 100).toFixed(1) : "0.0";
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }} />
                        <span className="flex-1 text-xs text-muted-foreground truncate">{e.name}</span>
                        <span className="text-xs font-medium text-foreground">{fmt(e.value)}</span>
                        <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                  <div className="mt-2 border-t border-border pt-2 flex justify-between">
                    <span className="text-xs font-semibold text-foreground">Total OpEx</span>
                    <span className="text-xs font-semibold text-red-500">{fmt(totals.opex)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {totals.revenue === 0 && totals.cogs === 0 && totals.opex === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="rounded-full bg-muted p-4">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">No data for {selectedYear}</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Add paid invoices, delivered orders, and expenses to see your Profit & Loss report.
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
