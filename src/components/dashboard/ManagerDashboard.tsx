import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  Users,
  Package,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  BarChart2,
} from "lucide-react";
import BranchManagement from "../branches/BranchManagement";
import UserManagement from "../users/UserManagement";
import FinancialReports from "../accounting/FinancialReports";
import SalesAnalytics from "../accounting/SalesAnalytics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ManagerDashboardProps {}

const ManagerDashboard = ({}: ManagerDashboardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBranches: 0,
    totalUsers: 0,
    totalProducts: 0,
    lowStockItems: 0,
    monthSales: 0,
    monthExpenses: 0,
  });
  const [branches, setBranches] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch branches count
      const { data: branchesData, error: branchesError } = await supabase
        .from("branches")
        .select("*");

      if (branchesError) throw branchesError;
      setBranches(branchesData || []);

      // Fetch users count
      const { count: usersCount, error: usersError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      if (usersError) throw usersError;

      // Fetch products count
      const { count: productsCount, error: productsError } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      if (productsError) throw productsError;

      // Fetch low stock items
      const { data: lowStockData, error: lowStockError } = await supabase
        .from("inventory")
        .select("*, product:products(*)")
        .lt("quantity", 10); // Assuming 10 is the threshold for low stock

      if (lowStockError) throw lowStockError;
      setLowStockProducts(lowStockData || []);

      // Calculate month sales and expenses
      const today = new Date();
      const firstDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      );

      const { data: monthSalesData, error: monthSalesError } = await supabase
        .from("financial_transactions")
        .select("amount")
        .eq("transaction_type", "sale")
        .gte("transaction_date", firstDayOfMonth.toISOString());

      if (monthSalesError) throw monthSalesError;

      const { data: monthExpensesData, error: monthExpensesError } =
        await supabase
          .from("financial_transactions")
          .select("amount")
          .eq("transaction_type", "expense")
          .gte("transaction_date", firstDayOfMonth.toISOString());

      if (monthExpensesError) throw monthExpensesError;

      // Set stats
      setStats({
        totalBranches: branchesData?.length || 0,
        totalUsers: usersCount || 0,
        totalProducts: productsCount || 0,
        lowStockItems: lowStockData?.length || 0,
        monthSales:
          monthSalesData?.reduce((sum, item) => sum + item.amount, 0) || 0,
        monthExpenses:
          monthExpensesData?.reduce((sum, item) => sum + item.amount, 0) || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          لوحة التحكم - المدير العام
        </h1>
        <Button onClick={fetchDashboardData} variant="outline" size="sm">
          تحديث البيانات
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">عدد الفروع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Building className="h-4 w-4 text-muted-foreground ml-2" />
              <div className="text-2xl font-bold">{stats.totalBranches}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">المستخدمين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground ml-2" />
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">المنتجات</CardTitle>
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
            <CardTitle className="text-sm font-medium">مبيعات الشهر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 ml-2" />
              <div className="text-2xl font-bold">
                {stats.monthSales.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">مصروفات الشهر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 text-red-500 ml-2" />
              <div className="text-2xl font-bold">
                {stats.monthExpenses.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>الفروع</CardTitle>
            <CardDescription>قائمة بجميع فروع الشركة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم الفرع</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center h-24">
                        لا توجد فروع متاحة
                      </TableCell>
                    </TableRow>
                  ) : (
                    branches.slice(0, 5).map((branch) => (
                      <TableRow key={branch.id}>
                        <TableCell className="font-medium">
                          {branch.name}
                        </TableCell>
                        <TableCell>{branch.address || "-"}</TableCell>
                        <TableCell>{branch.phone || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>منتجات ذات مخزون منخفض</CardTitle>
            <CardDescription>منتجات تحتاج إلى إعادة تزويد</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المنتج</TableHead>
                    <TableHead>الفرع</TableHead>
                    <TableHead>الكمية المتبقية</TableHead>
                    <TableHead>الحالة</TableHead>
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
                        <TableCell>
                          {branches.find((b) => b.id === item.branch_id)
                            ?.name || "-"}
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="branches" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="branches" className="flex items-center">
            <Building className="h-4 w-4 ml-2" />
            إدارة الفروع
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="h-4 w-4 ml-2" />
            إدارة المستخدمين
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center">
            <BarChart2 className="h-4 w-4 ml-2" />
            التقارير المالية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branches">
          <BranchManagement />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="reports">
          <FinancialReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagerDashboard;
