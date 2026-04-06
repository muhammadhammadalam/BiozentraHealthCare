import { useMemo, useState } from "react";
import { DollarSign, ShoppingCart, TrendingUp, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SalesTrendChart } from "@/components/dashboard/SalesTrendChart";
import { InventoryChart } from "@/components/dashboard/InventoryChart";
import { RevenueExpenseChart } from "@/components/dashboard/RevenueExpenseChart";
import { RecentOrdersTable } from "@/components/dashboard/RecentOrdersTable";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useData } from "@/contexts/DataContext";
import { exportComprehensiveReportPDF } from "@/utils/pdfExport";
import { toast } from "sonner";

const EXPENSES_KEY = "biozentra-expenses";
function loadExpenses() {
  try { return JSON.parse(localStorage.getItem(EXPENSES_KEY) || "[]"); } catch { return []; }
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 2, currentYear - 1, currentYear].map(String);

function getMonthKey(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 7); // "YYYY-MM"
}

function calcTrend(current: number, previous: number) {
  if (previous === 0) return current > 0 ? { value: 100, isPositive: true } : null;
  const pct = ((current - previous) / previous) * 100;
  return { value: Math.abs(parseFloat(pct.toFixed(1))), isPositive: pct >= 0 };
}

const Index = () => {
  const { orders, invoices } = useData();
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState<"monthly" | "annual">("monthly");
  const [reportMonth, setReportMonth] = useState(MONTHS[new Date().getMonth()]);
  const [reportYear, setReportYear] = useState(String(currentYear));
  const [generatingReport, setGeneratingReport] = useState(false);

  const thisMonth = getMonthKey(0);
  const lastMonth = getMonthKey(-1);

  // ── Total Sales (all-time delivered) ─────────────────────────────────────
  const totalSales = useMemo(
    () => orders.filter(o => o.status === "Delivered").reduce((s, o) => s + o.total, 0),
    [orders]
  );
  const totalSalesLastMonth = useMemo(
    () => orders.filter(o => o.status === "Delivered" && o.date?.startsWith(lastMonth)).reduce((s, o) => s + o.total, 0),
    [orders, lastMonth]
  );
  const totalSalesThisMonth = useMemo(
    () => orders.filter(o => o.status === "Delivered" && o.date?.startsWith(thisMonth)).reduce((s, o) => s + o.total, 0),
    [orders, thisMonth]
  );

  // ── Total Orders ──────────────────────────────────────────────────────────
  const totalOrders = orders.length;
  const ordersThisMonth = useMemo(
    () => orders.filter(o => o.date?.startsWith(thisMonth)).length,
    [orders, thisMonth]
  );
  const ordersLastMonth = useMemo(
    () => orders.filter(o => o.date?.startsWith(lastMonth)).length,
    [orders, lastMonth]
  );

  // ── Monthly Revenue (current month invoices paid) ─────────────────────────
  const monthlyRevenue = useMemo(
    () => invoices.filter(i => i.status === "Paid" && i.date?.startsWith(thisMonth)).reduce((s, i) => s + i.amount, 0),
    [invoices, thisMonth]
  );
  const monthlyRevenueLast = useMemo(
    () => invoices.filter(i => i.status === "Paid" && i.date?.startsWith(lastMonth)).reduce((s, i) => s + i.amount, 0),
    [invoices, lastMonth]
  );

  const salesTrend = calcTrend(totalSalesThisMonth, totalSalesLastMonth);
  const ordersTrend = calcTrend(ordersThisMonth, ordersLastMonth);
  const revTrend = calcTrend(monthlyRevenue, monthlyRevenueLast);

  // ── Download report ───────────────────────────────────────────────────────
  const handleDownload = () => setReportDialogOpen(true);

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const expenses = loadExpenses();
      let period: string;
      let filterPrefix: string;

      if (reportType === "annual") {
        period = `Annual ${reportYear}`;
        filterPrefix = reportYear;
      } else {
        const monthIdx = MONTHS.indexOf(reportMonth) + 1;
        const mm = String(monthIdx).padStart(2, "0");
        filterPrefix = `${reportYear}-${mm}`;
        period = `${reportMonth} ${reportYear}`;
      }

      const filteredOrders = orders.filter(o => o.date?.startsWith(filterPrefix));
      const filteredInvoices = invoices.filter(i => i.date?.startsWith(filterPrefix));
      const filteredExpenses = expenses.filter((e: { date: string }) => e.date?.startsWith(filterPrefix));

      await exportComprehensiveReportPDF({
        period,
        isAnnual: reportType === "annual",
        orders: filteredOrders.map(o => ({
          id: o.id,
          customer: o.customer,
          date: o.date,
          total: o.total,
          status: o.status,
          products: "",
        })),
        invoices: filteredInvoices.map(i => ({
          id: i.id,
          customer: i.customer,
          date: i.date,
          amount: i.amount,
          status: i.status,
        })),
        expenses: filteredExpenses.map((e: { id: string; date: string; category: string; description: string; amount: number }) => ({
          id: e.id,
          date: e.date,
          category: e.category,
          description: e.description,
          amount: e.amount,
        })),
      });
      toast.success(`${period} report downloaded!`);
      setReportDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const fmt = (val: number) => {
    if (val >= 100000) return `Rs. ${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `Rs. ${(val / 1000).toFixed(1)}K`;
    return `Rs. ${val.toLocaleString("en-PK")}`;
  };

  const kpis = [
    {
      title: "Total Sales",
      value: fmt(totalSales),
      sub: "All delivered orders",
      icon: DollarSign,
      trend: salesTrend,
      gradient: "from-slate-800 to-slate-700",
      iconBg: "bg-white/10",
    },
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString(),
      sub: `${ordersThisMonth} this month`,
      icon: ShoppingCart,
      trend: ordersTrend,
      gradient: "from-emerald-600 to-emerald-500",
      iconBg: "bg-white/20",
    },
    {
      title: "Monthly Revenue",
      value: fmt(monthlyRevenue),
      sub: "Paid invoices this month",
      icon: TrendingUp,
      trend: revTrend,
      gradient: "from-amber-500 to-orange-400",
      iconBg: "bg-white/20",
    },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
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
        >
          <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download Report
          </Button>
        </motion.div>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid gap-5 sm:grid-cols-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            whileHover={{ y: -4, transition: { duration: 0.18 } }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${kpi.gradient} p-6 text-white shadow-lg`}
          >
            {/* bg glow */}
            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-4 h-24 w-24 rounded-full bg-black/10" />

            <div className="relative flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium opacity-80">{kpi.title}</p>
                <p className="text-3xl font-extrabold tracking-tight">{kpi.value}</p>
                <p className="text-xs opacity-60">{kpi.sub}</p>
              </div>
              <div className={`rounded-xl p-3 ${kpi.iconBg}`}>
                <kpi.icon className="h-6 w-6" />
              </div>
            </div>

            {kpi.trend && (
              <div className="relative mt-4 flex items-center gap-1.5">
                <span className={`flex items-center gap-0.5 text-sm font-semibold ${kpi.trend.isPositive ? "text-green-200" : "text-red-200"}`}>
                  {kpi.trend.isPositive
                    ? <ArrowUpRight className="h-4 w-4" />
                    : <ArrowDownRight className="h-4 w-4" />}
                  {kpi.trend.value}%
                </span>
                <span className="text-xs opacity-60">vs last month</span>
              </div>
            )}
            {!kpi.trend && (
              <div className="relative mt-4">
                <span className="text-xs opacity-50">No previous data yet</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <SalesTrendChart />
        <InventoryChart />
      </div>

      <div className="mb-8">
        <RevenueExpenseChart />
      </div>

      <RecentOrdersTable />

      {/* Report Download Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Download Report</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as "monthly" | "annual")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                  <SelectItem value="annual">Annual Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {reportType === "monthly" && (
              <div className="grid gap-2">
                <Label>Month</Label>
                <Select value={reportMonth} onValueChange={setReportMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label>Year</Label>
              <Select value={reportYear} onValueChange={setReportYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Includes orders, invoices, expenses, and profit &amp; loss summary for the selected period.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateReport} disabled={generatingReport}>
              <Download className="h-4 w-4 mr-2" />
              {generatingReport ? "Generating..." : "Download PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Index;
