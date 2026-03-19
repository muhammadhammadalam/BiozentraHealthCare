import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Filter, Pencil, Trash2, Package, PenLine } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";
import { CATALOG, CATALOG_MAP } from "@/lib/catalog";

const CUSTOM_VALUE = "__custom__";

const categories = [
  "Vitamins", "Calcium", "Cough & Cold", "Antibiotics", "Pain Relief",
  "Cardiac", "Diabetes", "Dermatology", "Supplements", "Other",
];

interface ProductFormData {
  name: string;
  category: string;
  stock: number;
  price: number;
}

const emptyProduct: ProductFormData = { name: "", category: "", stock: 0, price: 0 };

const Products = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useData();

  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyProduct);
  const [isCustomName, setIsCustomName] = useState(false);

  // Extra product names already saved but not in the built-in catalog
  const extraNames = products
    .map((p) => p.name)
    .filter((n) => !(n in CATALOG_MAP));

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (productId?: number) => {
    if (productId != null) {
      const product = products.find((p) => p.id === productId);
      if (product) {
        setEditingId(productId);
        setFormData({ name: product.name, category: product.category, stock: product.stock, price: product.price });
        // If the name isn't in the catalog, show as custom
        setIsCustomName(!(product.name in CATALOG_MAP));
      }
    } else {
      setEditingId(null);
      setFormData(emptyProduct);
      setIsCustomName(false);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(emptyProduct);
    setIsCustomName(false);
  };

  // When a name is selected from the dropdown
  const handleNameSelect = (value: string) => {
    if (value === CUSTOM_VALUE) {
      setIsCustomName(true);
      setFormData((prev) => ({ ...prev, name: "", price: 0 }));
    } else {
      setIsCustomName(false);
      const catalogPrice = CATALOG_MAP[value];
      setFormData((prev) => ({
        ...prev,
        name: value,
        price: catalogPrice !== undefined ? catalogPrice : prev.price,
      }));
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) { toast.error("Product name is required"); return; }
    if (!formData.category)    { toast.error("Category is required"); return; }
    if (formData.price <= 0)   { toast.error("Price must be greater than 0"); return; }

    if (editingId != null) {
      updateProduct(editingId, formData);
      toast.success("Product updated");
    } else {
      addProduct(formData);
      toast.success("Product added");
    }
    handleCloseDialog();
  };

  const handleDelete = (id: number) => {
    deleteProduct(id);
    toast.success("Product deleted");
  };

  // The value to show in the Select when dialog opens
  const selectValue = isCustomName
    ? CUSTOM_VALUE
    : (formData.name in CATALOG_MAP || extraNames.includes(formData.name))
      ? formData.name
      : "";

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Products</h1>
          <p className="mt-1 text-muted-foreground">Manage your pharmaceutical products</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
          <Button size="sm" className="gap-2" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </motion.div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Products ({filteredProducts.length})</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search products..." className="pl-9 w-64"
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 opacity-30 mb-3" />
              <p className="font-medium">No products yet</p>
              <p className="text-sm mt-1">Click "Add Product" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, i) => (
                  <motion.tr key={product.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="text-right">{product.stock}</TableCell>
                    <TableCell className="text-right">Rs. {product.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={
                        product.status === "In Stock" ? "default"
                        : product.status === "Low Stock" ? "secondary"
                        : "destructive"
                      }>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(product.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId != null ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">

            {/* ── Product Name ── */}
            <div className="grid gap-2">
              <Label>Product Name *</Label>

              {/* Dropdown: catalog + saved extras + "Enter custom" option */}
              <Select value={selectValue} onValueChange={handleNameSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product or enter custom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Catalog</SelectLabel>
                    {CATALOG.map((item) => (
                      <SelectItem key={item.name} value={item.name}>
                        {item.name}
                        <span className="ml-2 text-xs text-muted-foreground">Rs. {item.price}</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>

                  {extraNames.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Previously Added</SelectLabel>
                      {extraNames.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}

                  {/* Custom entry option */}
                  <SelectGroup>
                    <SelectLabel>Other</SelectLabel>
                    <SelectItem value={CUSTOM_VALUE}>
                      <span className="flex items-center gap-2">
                        <PenLine className="h-3.5 w-3.5" />
                        Enter custom name…
                      </span>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              {/* Custom name text input — shown when "Enter custom name" is selected */}
              {isCustomName && (
                <Input
                  autoFocus
                  placeholder="Type product name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              )}
            </div>

            {/* ── Category ── */}
            <div className="grid gap-2">
              <Label>Category *</Label>
              <Select value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* ── Stock ── */}
            <div className="grid gap-2">
              <Label>Stock Quantity</Label>
              <Input inputMode="numeric" placeholder="0"
                value={formData.stock === 0 ? "" : formData.stock.toString()}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} />
            </div>

            {/* ── Price — auto-filled from catalog, always editable ── */}
            <div className="grid gap-2">
              <Label>Price (Rs.) *</Label>
              <Input inputMode="numeric" placeholder="0.00"
                value={formData.price === 0 ? "" : formData.price.toString()}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} />
              {formData.name in CATALOG_MAP && (
                <p className="text-xs text-muted-foreground">
                  Catalog price: Rs. {CATALOG_MAP[formData.name]} — edit above to override
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave}>{editingId != null ? "Update" : "Add"} Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Products;
