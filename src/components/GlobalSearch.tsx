import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, ShoppingCart, Users, Receipt, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useData } from "@/contexts/DataContext";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchResult {
  id: string | number;
  title: string;
  subtitle: string;
  type: "product" | "order" | "customer" | "invoice";
  href: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const { products, orders, customers, invoices } = useData();
  const navigate = useNavigate();

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTerm = query.toLowerCase();
    const newResults: SearchResult[] = [];

    // Search products
    products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm) ||
          p.category.toLowerCase().includes(searchTerm)
      )
      .slice(0, 3)
      .forEach((p) => {
        newResults.push({
          id: p.id,
          title: p.name,
          subtitle: `${p.category} • Rs. ${p.price} • ${p.status}`,
          type: "product",
          href: "/products",
        });
      });

    // Search orders
    orders
      .filter(
        (o) =>
          o.id.toLowerCase().includes(searchTerm) ||
          o.customer.toLowerCase().includes(searchTerm)
      )
      .slice(0, 3)
      .forEach((o) => {
        newResults.push({
          id: o.id,
          title: o.id,
          subtitle: `${o.customer} • Rs. ${o.total.toLocaleString()} • ${o.status}`,
          type: "order",
          href: "/orders",
        });
      });

    // Search customers
    customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm) ||
          c.email.toLowerCase().includes(searchTerm)
      )
      .slice(0, 3)
      .forEach((c) => {
        newResults.push({
          id: c.id,
          title: c.name,
          subtitle: `${c.email} • ${c.orders} orders`,
          type: "customer",
          href: "/customers",
        });
      });

    // Search invoices
    invoices
      .filter(
        (i) =>
          i.id.toLowerCase().includes(searchTerm) ||
          i.customer.toLowerCase().includes(searchTerm)
      )
      .slice(0, 3)
      .forEach((i) => {
        newResults.push({
          id: i.id,
          title: i.id,
          subtitle: `${i.customer} • Rs. ${i.amount.toLocaleString()} • ${i.status}`,
          type: "invoice",
          href: "/invoices",
        });
      });

    setResults(newResults);
  }, [query, products, orders, customers, invoices]);

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "product":
        return <Package className="h-4 w-4" />;
      case "order":
        return <ShoppingCart className="h-4 w-4" />;
      case "customer":
        return <Users className="h-4 w-4" />;
      case "invoice":
        return <Receipt className="h-4 w-4" />;
    }
  };

  const handleSelect = (result: SearchResult) => {
    navigate(result.href);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <div
        className="relative cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products, orders... (⌘K)"
          className="w-64 cursor-pointer pl-9 lg:w-80"
          readOnly
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-0">
          <DialogHeader className="border-b p-4">
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Global Search
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products, orders, customers, invoices..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 pr-9"
                autoFocus
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  onClick={() => setQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <ScrollArea className="max-h-[300px]">
            {results.length > 0 ? (
              <div className="px-2 pb-4">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                      "hover:bg-accent focus:bg-accent focus:outline-none"
                    )}
                    onClick={() => handleSelect(result)}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium text-sm">{result.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {result.subtitle}
                      </p>
                    </div>
                    <span className="shrink-0 rounded bg-secondary px-2 py-0.5 text-xs capitalize">
                      {result.type}
                    </span>
                  </button>
                ))}
              </div>
            ) : query ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Start typing to search across all modules
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
