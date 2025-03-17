import React, { useState, useEffect } from "react";
import { supabase, Product, Inventory, Branch } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Printer,
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

interface POSSystemProps {
  branchId?: string;
}

interface CartItem {
  product: Product & { inventory: Inventory | null };
  quantity: number;
}

const POSSystem = ({ branchId }: POSSystemProps) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<
    (Product & { inventory: Inventory | null })[]
  >([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(branchId || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    if (!selectedBranch && branches.length > 0) {
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
  }, [selectedBranch]);

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
      // First get all products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*");

      if (productsError) throw productsError;

      // Then get inventory for the selected branch
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory")
        .select("*")
        .eq("branch_id", selectedBranch);

      if (inventoryError) throw inventoryError;

      // Map inventory to products
      const productsWithInventory = productsData.map((product) => {
        const inventoryItem = inventoryData.find(
          (item) => item.product_id === product.id,
        );
        return {
          ...product,
          inventory: inventoryItem || null,
        };
      });

      // Only show products with inventory > 0
      const availableProducts = productsWithInventory.filter(
        (product) => product.inventory && product.inventory.quantity > 0,
      );

      setProducts(availableProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
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

  const addToCart = (product: Product & { inventory: Inventory | null }) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product.id === product.id,
      );

      if (existingItem) {
        // Check if we have enough inventory
        if (
          product.inventory &&
          existingItem.quantity + 1 <= product.inventory.quantity
        ) {
          return prevCart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          );
        } else {
          // Not enough inventory
          return prevCart;
        }
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product.id !== productId),
    );
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === productId) {
          // Check if we have enough inventory
          if (
            item.product.inventory &&
            newQuantity <= item.product.inventory.quantity
          ) {
            return { ...item, quantity: newQuantity };
          } else {
            // Not enough inventory
            return item;
          }
        }
        return item;
      }),
    );
  };

  const calculateTotal = () => {
    return cart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0,
    );
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      // 1. Create financial transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from("financial_transactions")
        .insert({
          branch_id: selectedBranch,
          transaction_type: "sale",
          amount: calculateTotal(),
          description: `Sale to ${customerName || "Customer"} - ${cart.length} items`,
          reference_number: `POS-${Date.now()}`,
          transaction_date: new Date().toISOString(),
          created_by: user?.id || "00000000-0000-0000-0000-000000000000", // Use actual user ID if available
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // 2. Update inventory for each product
      for (const item of cart) {
        if (item.product.inventory) {
          const newQuantity = item.product.inventory.quantity - item.quantity;

          const { error: inventoryError } = await supabase
            .from("inventory")
            .update({ quantity: newQuantity })
            .eq("id", item.product.inventory.id);

          if (inventoryError) throw inventoryError;
        }
      }

      setTransactionId(transactionData.id);
      setCheckoutDialogOpen(false);
      setSuccessDialogOpen(true);
      setCart([]);
      fetchProducts(); // Refresh products to update inventory
    } catch (error) {
      console.error("Error processing checkout:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Product Selection */}
      <Card className="w-full lg:w-2/3 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold">نقطة البيع (POS)</CardTitle>
          <CardDescription>اختر المنتجات لإضافتها إلى السلة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-64">
                <Select
                  value={selectedBranch}
                  onValueChange={setSelectedBranch}
                >
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
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <p>لا توجد منتجات متاحة</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-square bg-slate-100 rounded-md flex items-center justify-center mb-2">
                      <ShoppingCart className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="font-medium truncate">{product.name}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-muted-foreground">
                        المتوفر: {product.inventory?.quantity || 0}
                      </p>
                      <p className="font-bold">{product.price.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cart */}
      <Card className="w-full lg:w-1/3 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold">سلة المشتريات</CardTitle>
          <CardDescription>
            {cart.length} منتج | الإجمالي: {calculateTotal().toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p>السلة فارغة</p>
              <p className="text-sm text-muted-foreground mt-1">
                اضغط على المنتجات لإضافتها إلى السلة
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المنتج</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>الإجمالي</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.product.id}>
                      <TableCell className="font-medium">
                        {item.product.name}
                      </TableCell>
                      <TableCell>{item.product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(item.product.price * item.quantity).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="w-full flex justify-between text-lg font-bold">
            <span>الإجمالي:</span>
            <span>{calculateTotal().toFixed(2)}</span>
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={cart.length === 0}
            onClick={() => setCheckoutDialogOpen(true)}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            إتمام عملية الشراء
          </Button>
        </CardFooter>
      </Card>

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>إتمام عملية الشراء</DialogTitle>
            <DialogDescription>
              أدخل معلومات الدفع لإتمام العملية
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="customerName" className="text-right col-span-1">
                اسم العميل
              </label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="col-span-3"
                placeholder="اختياري"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="total" className="text-right col-span-1">
                المبلغ الإجمالي
              </label>
              <Input
                id="total"
                value={calculateTotal().toFixed(2)}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="payment" className="text-right col-span-1">
                المبلغ المدفوع
              </label>
              <Input
                id="payment"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            {parseFloat(paymentAmount) > 0 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="change" className="text-right col-span-1">
                  المبلغ المتبقي
                </label>
                <Input
                  id="change"
                  value={
                    parseFloat(paymentAmount) - calculateTotal() > 0
                      ? (parseFloat(paymentAmount) - calculateTotal()).toFixed(
                          2,
                        )
                      : "0.00"
                  }
                  className="col-span-3"
                  disabled
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={
                isProcessing ||
                parseFloat(paymentAmount) < calculateTotal() ||
                cart.length === 0
              }
              onClick={handleCheckout}
            >
              {isProcessing ? "جاري المعالجة..." : "تأكيد الدفع"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تمت العملية بنجاح</DialogTitle>
            <DialogDescription>
              تم إتمام عملية البيع بنجاح وتحديث المخزون
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-green-50 p-4 rounded-md text-green-800 mb-4">
              <p className="font-medium">رقم العملية: {transactionId}</p>
              <p className="text-sm mt-1">
                تم بيع {cart.length} منتج بقيمة {calculateTotal().toFixed(2)}
              </p>
            </div>
            <Button className="w-full" variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              طباعة الإيصال
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POSSystem;
