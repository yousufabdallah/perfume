import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Plus,
} from "lucide-react";
import ProductManagement from "../inventory/ProductManagement";
import InventoryTransfers from "../inventory/InventoryTransfers";
import POSSystem from "../pos/POSSystem";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BranchManagerDashboardProps {
  branchId?: string;
}

const BranchManagerDashboard = ({ branchId }: BranchManagerDashboardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    pendingTransfers: 0,
    todaySales: 0,
  });
  const [branch, setBranch] = useState<any>(null);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    productId: "",
    quantity: "10",
    notes: "",
  });
  const [products, setProducts] = useState<any[]>([]);
  const [mainBranch, setMainBranch] = useState<any>(null);

  useEffect(() => {
    if (branchId) {
      fetchBranchData();
      fetchDashboardData();
    }
  }, [branchId]);

  const fetchBranchData = async () => {
    try {
      // Fetch branch details
      const { data: branchData, error: branchError } = await supabase
        .from("branches")
        .select("*")
        .eq("id", branchId)
        .single();

      if (branchError) throw branchError;
      setBranch(branchData);

      // Fetch main branch (for inventory requests)
      const { data: mainBranchData, error: mainBranchError } = await supabase
        .from("branches")
        .select("*")
        .neq("id", branchId)
        .limit(1)
        .single();

      if (mainBranchError && mainBranchError.code !== "PGRST116") {
        throw mainBranchError;
      }
      setMainBranch(mainBranchData);
    } catch (error) {
      console.error("Error fetching branch data:", error);
    }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch inventory stats
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory")
        .select("*, product:products(*)")
        .eq("branch_id", branchId);

      if (inventoryError) throw inventoryError;

      // Count low stock and out of stock items
      const lowStock =
        inventoryData?.filter(
          (item) => item.quantity > 0 && item.quantity <= 10,
        ) || [];
      const outOfStock =
        inventoryData?.filter((item) => item.quantity <= 0) || [];

      setLowStockProducts([...lowStock, ...outOfStock]);
      setProducts(inventoryData?.map((item) => item.product) || []);

      // Fetch pending transfers
      const { data: transfersData, error: transfersError } = await supabase
        .from("inventory_transfers")
        .select(
          `*, 
          from_branch:branches!inventory_transfers_from_branch_id_fkey(*), 
          to_branch:branches!inventory_transfers_to_branch_id_fkey(*)`,
        )
        .eq("to_branch_id", branchId)
        .eq("status", "pending");

      if (transfersError) throw transfersError;
      setPendingTransfers(transfersData || []);

      // Calculate today's sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todaySalesData, error: todaySalesError } = await supabase
        .from("financial_transactions")
        .select("amount")
        .eq("transaction_type", "sale")
        .eq("branch_id", branchId)
        .gte("transaction_date", today.toISOString());

      if (todaySalesError) throw todaySalesError;

      // Set stats
      setStats({
        totalProducts: inventoryData?.length || 0,
        lowStockItems: lowStock.length,
        outOfStockItems: outOfStock.length,
        pendingTransfers: transfersData?.length || 0,
        todaySales:
          todaySalesData?.reduce((sum, item) => sum + item.amount, 0) || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainBranch) return;

    try {
      // Create inventory transfer request
      const { data: transferData, error: transferError } = await supabase
        .from("inventory_transfers")
        .insert({
          from_branch_id: mainBranch.id,
          to_branch_id: branchId,
          status: "pending",
          request_date: new Date().toISOString(),
          notes: requestFormData.notes || null,
        })
        .select()
        .single();

      if (transferError) throw transferError;

      // Create transfer item
      const { error: itemError } = await supabase
        .from("inventory_transfer_items")
        .insert({
          transfer_id: transferData.id,
          product_id: requestFormData.productId,
          quantity: parseInt(requestFormData.quantity),
        });

      if (itemError) throw itemError;

      // Reset form and close dialog
      setRequestFormData({
        productId: "",
        quantity: "10",
        notes: "",
      });
      setRequestDialogOpen(false);
      fetchDashboardData();
    } catch (error) {
      console.error("Error creating transfer request:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            لوحة التحكم - مدير الفرع
          </h1>
          {branch && (
            <p className="text-muted-foreground">فرع: {branch.name}</p>
          )}
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm">
          تحديث البيانات
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي المنتجات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="h-4 w-4 text-muted-foreground ml-2" />
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">مخزون منخفض</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-amber-500 ml-2" />
              <div className="text-2xl font-bold">{stats.lowStockItems}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              نفذ من المخزون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />
              <div className="text-2xl font-bold">{stats.outOfStockItems}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">طلبات معلقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <RefreshCw className="h-4 w-4 text-blue-500 ml-2" />
              <div className="text-2xl font-bold">{stats.pendingTransfers}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">مبيعات اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 ml-2" />
              <div className="text-2xl font-bold">
                {stats.todaySales.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>منتجات ذات مخزون منخفض</CardTitle>
              <CardDescription>منتجات تحتاج إلى إعادة تزويد</CardDescription>
            </div>
            <Dialog
              open={requestDialogOpen}
              onOpenChange={setRequestDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  طلب تزويد مخزون
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>طلب تزويد مخزون</DialogTitle>
                  <DialogDescription>
                    إنشاء طلب تزويد مخزون من المخزن الرئيسي
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRequestSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label
                        htmlFor="product"
                        className="text-right col-span-1"
                      >
                        المنتج
                      </Label>
                      <select
                        id="product"
                        value={requestFormData.productId}
                        onChange={(e) =>
                          setRequestFormData({
                            ...requestFormData,
                            productId: e.target.value,
                          })
                        }
                        className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="">اختر المنتج</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label
                        htmlFor="quantity"
                        className="text-right col-span-1"
                      >
                        الكمية
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={requestFormData.quantity}
                        onChange={(e) =>
                          setRequestFormData({
                            ...requestFormData,
                            quantity: e.target.value,
                          })
                        }
                        className="col-span-3"
                        min="1"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="notes" className="text-right col-span-1">
                        ملاحظات
                      </Label>
                      <Textarea
                        id="notes"
                        value={requestFormData.notes}
                        onChange={(e) =>
                          setRequestFormData({
                            ...requestFormData,
                            notes: e.target.value,
                          })
                        }
                        className="col-span-3"
                        placeholder="أي ملاحظات إضافية"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">إرسال الطلب</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المنتج</TableHead>
                    <TableHead>الكمية المتبقية</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                        لا توجد منتجات ذات مخزون منخفض
                      </TableCell>
                    </TableRow>
                  ) : (
                    lowStockProducts.slice(0, 5).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.product?.name || "غير معروف"}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          {item.quantity <= 0 ? (
                            <Badge variant="destructive">نفذ المخزون</Badge>
                          ) : item.quantity < 5 ? (
                            <Badge variant="warning" className="bg-amber-500">
                              منخفض جداً
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-yellow-100 text-yellow-800"
                            >
                              منخفض
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRequestFormData({
                                ...requestFormData,
                                productId: item.product_id,
                              });
                              setRequestDialogOpen(true);
                            }}
                          >
                            طلب تزويد
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => {}}>
              عرض كل المنتجات
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>طلبات نقل المخزون المعلقة</CardTitle>
            <CardDescription>طلبات تحتاج إلى موافقة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>من فرع</TableHead>
                    <TableHead>تاريخ الطلب</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTransfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                        لا توجد طلبات معلقة
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingTransfers.map((transfer: any) => (
                      <TableRow key={transfer.id}>
                        <TableCell className="font-medium">
                          {transfer.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {transfer.from_branch?.name || "غير معروف"}
                        </TableCell>
                        <TableCell>
                          {new Date(transfer.request_date).toLocaleDateString(
                            "ar-SA",
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            عرض التفاصيل
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => {}}>
              عرض كل الطلبات
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="inventory" className="flex items-center">
            <Package className="h-4 w-4 ml-2" />
            إدارة المخزون
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex items-center">
            <RefreshCw className="h-4 w-4 ml-2" />
            طلبات نقل المخزون
          </TabsTrigger>
          <TabsTrigger value="pos" className="flex items-center">
            <ShoppingCart className="h-4 w-4 ml-2" />
            نقطة البيع
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <ProductManagement branchId={branchId} />
        </TabsContent>

        <TabsContent value="transfers">
          <InventoryTransfers branchId={branchId} />
        </TabsContent>

        <TabsContent value="pos">
          <POSSystem branchId={branchId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BranchManagerDashboard;
