import React, { useState, useEffect } from "react";
import { supabase, Product, Branch } from "@/lib/supabase";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  CalendarIcon,
  Save,
  Plus,
  Minus,
  Trash2,
  Search,
  FileText,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface InvoiceFormProps {
  branchId?: string;
  onSuccess?: () => void;
  invoiceType?: "sale" | "purchase";
}

interface InvoiceItem {
  product: Product;
  quantity: number;
  price: number;
  discount?: number;
}

const InvoiceForm = ({
  branchId,
  onSuccess,
  invoiceType = "sale",
}: InvoiceFormProps) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(branchId || "");
  const [customerName, setCustomerName] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productDialogOpen, setProductDialogOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [successDialogOpen, setSuccessDialogOpen] = useState<boolean>(false);
  const [transactionId, setTransactionId] = useState<string>("");

  useEffect(() => {
    fetchBranches();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!selectedBranch && branches.length > 0) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

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
    try {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const addItem = (product: Product) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product.id === product.id,
      );

      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        return [
          ...prevItems,
          {
            product,
            quantity: 1,
            price: product.price,
            discount: 0,
          },
        ];
      }
    });
    setProductDialogOpen(false);
  };

  const removeItem = (productId: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => item.product.id !== productId),
    );
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item,
      ),
    );
  };

  const updatePrice = (productId: string, newPrice: number) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, price: newPrice } : item,
      ),
    );
  };

  const updateDiscount = (productId: string, newDiscount: number) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId
          ? { ...item, discount: newDiscount }
          : item,
      ),
    );
  };

  const calculateSubtotal = () => {
    return items.reduce(
      (total, item) =>
        total +
        item.quantity * item.price -
        (item.discount || 0) * item.quantity,
      0,
    );
  };

  const calculateTotal = () => {
    // In a real app, you might add tax calculation here
    return calculateSubtotal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsLoading(true);
    try {
      // 1. Create financial transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from("financial_transactions")
        .insert({
          branch_id: selectedBranch,
          transaction_type: invoiceType,
          amount: calculateTotal(),
          description: `${invoiceType === "sale" ? "فاتورة بيع" : "فاتورة شراء"} - ${customerName || "عميل"}`,
          reference_number: `INV-${Date.now()}`,
          transaction_date: invoiceDate.toISOString(),
          created_by: "00000000-0000-0000-0000-000000000000", // This should be the current user's ID in a real app
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // 2. If it's a sale, update inventory
      if (invoiceType === "sale") {
        for (const item of items) {
          // Get current inventory
          const { data: inventoryData, error: inventoryError } = await supabase
            .from("inventory")
            .select("*")
            .eq("branch_id", selectedBranch)
            .eq("product_id", item.product.id)
            .single();

          if (inventoryError && inventoryError.code !== "PGRST116") {
            // PGRST116 is the error code for no rows returned
            throw inventoryError;
          }

          if (inventoryData) {
            // Update existing inventory
            const newQuantity = inventoryData.quantity - item.quantity;
            const { error: updateError } = await supabase
              .from("inventory")
              .update({ quantity: newQuantity })
              .eq("id", inventoryData.id);

            if (updateError) throw updateError;
          }
        }
      }

      setTransactionId(transactionData.id);
      setSuccessDialogOpen(true);
      resetForm();

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating invoice:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setInvoiceDate(new Date());
    setNotes("");
    setItems([]);
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku &&
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          {invoiceType === "sale" ? "إصدار فاتورة بيع" : "إصدار فاتورة شراء"}
        </CardTitle>
        <CardDescription>
          {invoiceType === "sale"
            ? "إنشاء فاتورة بيع جديدة وتسجيل المعاملة المالية"
            : "إنشاء فاتورة شراء جديدة وتسجيل المعاملة المالية"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="branch">الفرع</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger id="branch">
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

            <div className="space-y-2">
              <Label htmlFor="customerName">
                {invoiceType === "sale" ? "اسم العميل" : "اسم المورد"}
              </Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={
                  invoiceType === "sale" ? "اسم العميل" : "اسم المورد"
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">تاريخ الفاتورة</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={"w-full justify-start text-right font-normal"}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {invoiceDate ? (
                      format(invoiceDate, "PPP", { locale: ar })
                    ) : (
                      <span>اختر تاريخ</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={invoiceDate}
                    onSelect={(date) => date && setInvoiceDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">المنتجات</h3>
              <Dialog
                open={productDialogOpen}
                onOpenChange={setProductDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة منتج
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>اختيار منتج</DialogTitle>
                    <DialogDescription>
                      اختر منتجًا لإضافته إلى الفاتورة
                    </DialogDescription>
                  </DialogHeader>
                  <div className="relative w-full mb-4">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث عن منتج..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>اسم المنتج</TableHead>
                          <TableHead>الرمز</TableHead>
                          <TableHead>السعر</TableHead>
                          <TableHead>الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">
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
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addItem(product)}
                                >
                                  <Plus className="h-4 w-4 ml-1" />
                                  إضافة
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المنتج</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>الخصم</TableHead>
                    <TableHead>الإجمالي</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        لا توجد منتجات في الفاتورة
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.product.id}>
                        <TableCell className="font-medium">
                          {item.product.name}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) =>
                              updatePrice(
                                item.product.id,
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity - 1,
                                )
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(
                                  item.product.id,
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className="w-16 text-center"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity + 1,
                                )
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.discount || 0}
                            onChange={(e) =>
                              updateDiscount(
                                item.product.id,
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {(
                            item.quantity * item.price -
                            (item.discount || 0) * item.quantity
                          ).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() => removeItem(item.product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-2 items-end">
              <div className="flex justify-between w-full md:w-1/3">
                <span className="font-medium">المجموع الفرعي:</span>
                <span>{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-full md:w-1/3">
                <span className="font-medium">الضريبة:</span>
                <span>0.00</span>
              </div>
              <div className="flex justify-between w-full md:w-1/3 text-lg font-bold">
                <span>الإجمالي:</span>
                <span>{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية على الفاتورة (اختياري)"
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            disabled={isLoading || items.length === 0}
            className="w-1/3"
          >
            <Save className="ml-2 h-4 w-4" />
            {isLoading ? "جاري الحفظ..." : "حفظ الفاتورة"}
          </Button>
        </CardFooter>
      </form>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تم إنشاء الفاتورة بنجاح</DialogTitle>
            <DialogDescription>
              تم إنشاء الفاتورة وتسجيل المعاملة المالية بنجاح
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-green-50 p-4 rounded-md text-green-800 mb-4">
              <p className="font-medium">رقم المعاملة: {transactionId}</p>
              <p className="text-sm mt-1">
                تم إنشاء فاتورة بقيمة {calculateTotal().toFixed(2)}
              </p>
            </div>
            <Button className="w-full" variant="outline">
              <FileText className="h-4 w-4 ml-2" />
              طباعة الفاتورة
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setSuccessDialogOpen(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default InvoiceForm;
