import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Filter, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";
import { api, ApiProduct } from "@/lib/api";

interface Product {
  id: number;
  name: string;
  category: string;
  stock: number;
  price: number;
  status: string;
}

const initialProducts: Product[] = [
  { id: 1, name: "Multivitzen Syrup", category: "Vitamins", stock: 245, price: 185, status: "In Stock" },
  { id: 2, name: "Kalzen Syrup", category: "Calcium", stock: 180, price: 220, status: "In Stock" },
  { id: 3, name: "Ivyzen Syrup", category: "Cough & Cold", stock: 12, price: 145, status: "Low Stock" },
  { id: 4, name: "Multivitzen Tablets", category: "Vitamins", stock: 320, price: 185, status: "In Stock" },
  { id: 5, name: "Kalzen Tablets", category: "Calcium", stock: 0, price: 220, status: "Out of Stock" },
];

const categories = ["Vitamins", "Calcium", "Cough & Cold", "Antibiotics", "Pain Relief"];

const emptyProduct: Omit<Product, 'id' | 'status'> = {
  name: "",
  category: "",
  stock: 0,
  price: 0,
};

const getStatus = (stock: number): string => {
  if (stock === 0) return "Out of Stock";
  if (stock <= 20) return "Low Stock";
  return "In Stock";
};

const PRODUCTS_KEY = "biozentra-products";

const Products = () => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem(PRODUCTS_KEY);
      return stored ? JSON.parse(stored) : initialProducts;
    } catch { return initialProducts; }
  });

  useEffect(() => {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await api.products.list();
        if (data && data.length > 0) {
          setProducts(data);
          localStorage.setItem(PRODUCTS_KEY, JSON.stringify(data));
        }
      } catch {
        // Fallback to localStorage on API failure
      }
    };
    loadProducts();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'status'>>(emptyProduct);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        stock: product.stock,
        price: product.price,
      });
    } else {
      setEditingProduct(null);
      setFormData(emptyProduct);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData(emptyProduct);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.category || formData.price <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingProduct) {
      try {
        const updated = await api.products.update(editingProduct.id, formData);
        setProducts(products.map(p =>
          p.id === editingProduct.id
            ? { ...formData, id: updated.id, status: getStatus(formData.stock) }
            : p
        ));
        toast.success("Product updated successfully");
      } catch {
        // Fallback: update local state only
        setProducts(products.map(p =>
          p.id === editingProduct.id
            ? { ...formData, id: editingProduct.id, status: getStatus(formData.stock) }
            : p
        ));
        toast.success("Product updated (offline)");
      }
    } else {
      try {
        const created = await api.products.create({
          ...formData,
          status: getStatus(formData.stock),
        });
        const newProduct: Product = {
          ...formData,
          id: created.id,
          status: getStatus(formData.stock),
        };
        setProducts([...products, newProduct]);
        toast.success("Product added successfully");
      } catch {
        // Fallback: use temp ID
        const newProduct: Product = {
          ...formData,
          id: Math.max(0, ...products.map(p => p.id)) + 1,
          status: getStatus(formData.stock),
        };
        setProducts([...products, newProduct]);
        toast.success("Product added (offline)");
      }
    }
    handleCloseDialog();
  };

  const handleDelete = async (id: number) => {
    try {
      await api.products.delete(id);
      setProducts(products.filter(p => p.id !== id));
      toast.success("Product deleted successfully");
    } catch {
      // Fallback: delete from local state
      setProducts(products.filter(p => p.id !== id));
      toast.success("Product deleted (offline)");
    }
  };

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
            <CardTitle>All Products</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-9 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="text-right">{product.stock}</TableCell>
                  <TableCell className="text-right">Rs. {product.price}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.status === "In Stock"
                          ? "default"
                          : product.status === "Low Stock"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(product)}>
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
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter product name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                placeholder="Enter stock quantity"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price (Rs.) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                placeholder="Enter price"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave}>{editingProduct ? "Update" : "Add"} Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Products;
