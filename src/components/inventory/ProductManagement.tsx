import React, { useState, useEffect } from "react";
import { supabase, Product, Inventory, Branch } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, AlertTriangle, RefreshCw } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

interface ProductManagementProps {
  branchId?: string;
}

const ProductManagement = ({ branchId }: ProductManagementProps) => {
  const { user, userRole } = useAuth();
  const [products, setProducts] = useState<
    (Product & { inventory: Inventory | null })[]
  >([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(branchId || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showLowStock, setShowLowStock] = useState(false);
  const [userBranchId, setUserBranchId] = useState<string | null>(
    branchId || null,
  );

  useEffect(() => {
    // If branchId is provided, use it; otherwise fetch user's branch
    if (branchId) {
      setUserBranchId(branchId);
      setSelectedBranch(branchId);
    } else if (user) {
      fetchUserBranch();
    }
  }, [branchId, user]);

  const fetchUserBranch = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("branch_id")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      if (data?.branch_id) {
        setUserBranchId(data.branch_id);
        setSelectedBranch(data.branch_id);
      }
    } catch (error) {
      console.error("Error fetching user branch:", error);
    }
  };

  useEffect(() => {
    if ((!selectedBranch || selectedBranch === "") && branches.length > 0) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchProducts();
    }
  }, [selectedBranch, showLowStock]);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase.from("branches").select("*");
      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      if (!selectedBranch) {
        setProducts([]);
        return;
      }

      // First get all products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*");

      if (productsError) {
        console.error("Products fetch error:", productsError);
        throw productsError;
      }

      if (!productsData || productsData.length === 0) {
        setProducts([]);
        return;
      }

      // Then get inventory for the selected branch
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory")
        .select("*")
        .eq("branch_id", selectedBranch);

      if (inventoryError) {
        console.error("Inventory fetch error:", inventoryError);
        throw inventoryError;
      }

      // Map inventory to products
      const productsWithInventory = productsData.map((product) => {
        const inventoryItem = inventoryData?.find(
          (item) => item.product_id === product.id,
        );
        return {
          ...product,
          inventory: inventoryItem || null,
        };
      });

      // Filter by low stock if needed
      let filteredProducts = productsWithInventory;
      if (showLowStock) {
        filteredProducts = productsWithInventory.filter(
          (product) =>
            product.inventory &&
            product.inventory.min_quantity &&
            product.inventory.quantity <= product.inventory.min_quantity,
        );
      }

      setProducts(filteredProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku &&
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const getStockStatus = (
    product: Product & { inventory: Inventory | null },
  ) => {
    if (!product.inventory) return "غير متوفر";

    const { quantity, min_quantity } = product.inventory;
    if (quantity <= 0) return "نفذ المخزون";
    if (min_quantity && quantity <= min_quantity) return "مخزون منخفض";
    return "متوفر";
  };

  const getStockStatusBadge = (
    product: Product & { inventory: Inventory | null },
  ) => {
    const status = getStockStatus(product);

    switch (status) {
      case "نفذ المخزون":
        return <Badge variant="destructive">{status}</Badge>;
      case "مخزون منخفض":
        return (
          <Badge variant="warning" className="bg-amber-500">
            {status}
          </Badge>
        );
      case "متوفر":
        return (
          <Badge variant="success" className="bg-green-500">
            {status}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold">إدارة المنتجات</CardTitle>
        <CardDescription>إدارة المنتجات والمخزون لكل فرع</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-64">
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفرع" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث عن منتج..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLowStock(!showLowStock)}
              className={showLowStock ? "bg-amber-100" : ""}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {showLowStock ? "عرض الكل" : "المخزون المنخفض فقط"}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchProducts}>
              <RefreshCw className="h-4 w-4 mr-2" />
              تحديث
            </Button>
            <AddProductDialog
              branchId={selectedBranch}
              onSuccess={fetchProducts}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المنتج</TableHead>
                  <TableHead>الرمز</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>التكلفة</TableHead>
                  <TableHead>الكمية المتوفرة</TableHead>
                  <TableHead>الحد الأدنى</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      لا توجد منتجات متاحة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>{product.sku || "-"}</TableCell>
                      <TableCell>{product.price.toFixed(2)}</TableCell>
                      <TableCell>{product.cost.toFixed(2)}</TableCell>
                      <TableCell>
                        {product.inventory ? product.inventory.quantity : "-"}
                      </TableCell>
                      <TableCell>
                        {product.inventory && product.inventory.min_quantity
                          ? product.inventory.min_quantity
                          : "-"}
                      </TableCell>
                      <TableCell>{getStockStatusBadge(product)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <UpdateStockDialog
                            product={product}
                            branchId={selectedBranch}
                            onSuccess={fetchProducts}
                          />
                          <CheckOtherBranchesDialog
                            product={product}
                            currentBranchId={selectedBranch}
                          />
                          <RequestStockDialog
                            product={product}
                            branchId={selectedBranch}
                            onSuccess={fetchProducts}
                            userId={user?.id}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface AddProductDialogProps {
  branchId: string;
  onSuccess: () => void;
}

const AddProductDialog = ({ branchId, onSuccess }: AddProductDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [quantity, setQuantity] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!branchId) {
        throw new Error("يجب اختيار الفرع أولاً");
      }

      // First create the product
      const { data: productData, error: productError } = await supabase
        .from("products")
        .insert({
          name,
          sku: sku || null,
          price: parseFloat(price) || 0,
          cost: parseFloat(cost) || 0,
          description: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (productError) {
        console.error("Product error:", productError);
        throw productError;
      }

      // Then create the inventory entry
      const { error: inventoryError } = await supabase
        .from("inventory")
        .insert({
          branch_id: branchId,
          product_id: productData.id,
          quantity: parseInt(quantity) || 0,
          min_quantity: minQuantity ? parseInt(minQuantity) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (inventoryError) {
        console.error("Inventory error:", inventoryError);
        throw inventoryError;
      }

      setOpen(false);
      resetForm();
      onSuccess();
    } catch (error) {
      console.error("Error adding product:", error);
      alert("حدث خطأ أثناء إضافة المنتج. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setSku("");
    setPrice("");
    setCost("");
    setQuantity("");
    setMinQuantity("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          إضافة منتج
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>إضافة منتج جديد</DialogTitle>
          <DialogDescription>
            أضف منتجًا جديدًا وحدد الكمية المتوفرة في المخزون
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right col-span-1">
                اسم المنتج
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="sku" className="text-right col-span-1">
                الرمز
              </label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="price" className="text-right col-span-1">
                السعر
              </label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="cost" className="text-right col-span-1">
                التكلفة
              </label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="quantity" className="text-right col-span-1">
                الكمية
              </label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="minQuantity" className="text-right col-span-1">
                الحد الأدنى
              </label>
              <Input
                id="minQuantity"
                type="number"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "جاري الإضافة..." : "إضافة المنتج"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface UpdateStockDialogProps {
  product: Product & { inventory: Inventory | null };
  branchId: string;
  onSuccess: () => void;
}

const UpdateStockDialog = ({
  product,
  branchId,
  onSuccess,
}: UpdateStockDialogProps) => {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && product.inventory) {
      setQuantity(product.inventory.quantity.toString());
      setMinQuantity(
        product.inventory.min_quantity
          ? product.inventory.min_quantity.toString()
          : "",
      );
    }
  }, [open, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!branchId) {
        throw new Error("يجب اختيار الفرع أولاً");
      }

      if (product.inventory) {
        // Update existing inventory
        const { error } = await supabase
          .from("inventory")
          .update({
            quantity: parseInt(quantity) || 0,
            min_quantity: minQuantity ? parseInt(minQuantity) : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.inventory.id);

        if (error) {
          console.error("Inventory update error:", error);
          throw error;
        }
      } else {
        // Create new inventory entry
        const { error } = await supabase.from("inventory").insert({
          branch_id: branchId,
          product_id: product.id,
          quantity: parseInt(quantity) || 0,
          min_quantity: minQuantity ? parseInt(minQuantity) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) {
          console.error("Inventory create error:", error);
          throw error;
        }
      }

      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("حدث خطأ أثناء تحديث المخزون. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تحديث المخزون</DialogTitle>
          <DialogDescription>
            تحديث كمية المخزون لـ {product.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="quantity" className="text-right col-span-1">
                الكمية
              </label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="minQuantity" className="text-right col-span-1">
                الحد الأدنى
              </label>
              <Input
                id="minQuantity"
                type="number"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "جاري التحديث..." : "تحديث المخزون"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface CheckOtherBranchesDialogProps {
  product: Product & { inventory: Inventory | null };
  currentBranchId: string;
}

const CheckOtherBranchesDialog = ({
  product,
  currentBranchId,
}: CheckOtherBranchesDialogProps) => {
  const [open, setOpen] = useState(false);
  const [branchInventory, setBranchInventory] = useState<
    (Inventory & { branch: Branch })[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchOtherBranchesInventory();
    }
  }, [open]);

  const fetchOtherBranchesInventory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*, branch:branches(*)")
        .eq("product_id", product.id)
        .neq("branch_id", currentBranchId)
        .gt("quantity", 0);

      if (error) throw error;
      setBranchInventory(data as (Inventory & { branch: Branch })[]);
    } catch (error) {
      console.error("Error fetching other branches inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>توفر المنتج في الفروع الأخرى</DialogTitle>
          <DialogDescription>
            عرض توفر {product.name} في الفروع الأخرى
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : branchInventory.length === 0 ? (
          <div className="text-center py-8">
            <p>المنتج غير متوفر في أي فرع آخر</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الفرع</TableHead>
                  <TableHead>الكمية المتوفرة</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>الهاتف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.branch.name}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.branch.address || "-"}</TableCell>
                    <TableCell>{item.branch.phone || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface RequestStockDialogProps {
  product: Product & { inventory: Inventory | null };
  branchId: string;
  onSuccess: () => void;
  userId?: string;
}

const RequestStockDialog = ({
  product,
  branchId,
  onSuccess,
  userId,
}: RequestStockDialogProps) => {
  const [open, setOpen] = useState(false);
  const [targetBranch, setTargetBranch] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchBranches();
    }
  }, [open]);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .neq("id", branchId);

      if (error) throw error;
      setBranches(data || []);
      if (data && data.length > 0) {
        setTargetBranch(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!branchId || !targetBranch) {
        throw new Error("يجب اختيار الفروع أولاً");
      }

      // Create transfer request
      const { data: transfer, error: transferError } = await supabase
        .from("inventory_transfers")
        .insert({
          from_branch_id: targetBranch,
          to_branch_id: branchId,
          status: "pending",
          requested_by: userId || "00000000-0000-0000-0000-000000000000",
          request_date: new Date().toISOString(),
          notes: `طلب نقل ${product.name} من فرع آخر`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (transferError) {
        console.error("Transfer error:", transferError);
        throw transferError;
      }

      // Add transfer item
      const { error: itemError } = await supabase
        .from("inventory_transfer_items")
        .insert({
          transfer_id: transfer.id,
          product_id: product.id,
          quantity: parseInt(quantity) || 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (itemError) {
        console.error("Transfer item error:", itemError);
        throw itemError;
      }

      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error creating transfer request:", error);
      alert("حدث خطأ أثناء إنشاء طلب النقل. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>طلب نقل مخزون</DialogTitle>
          <DialogDescription>
            طلب نقل {product.name} من فرع آخر
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="branch" className="text-right col-span-1">
                من فرع
              </label>
              <Select value={targetBranch} onValueChange={setTargetBranch}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="اختر الفرع" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="quantity" className="text-right col-span-1">
                الكمية
              </label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading || !targetBranch}>
              {isLoading ? "جاري الإرسال..." : "إرسال الطلب"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductManagement;
