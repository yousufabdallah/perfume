import React, { useState, useEffect } from "react";
import { supabase, Branch } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Percent, DollarSign } from "lucide-react";

interface SalesAnalyticsProps {
  branchId?: string;
}

interface ProductSalesData {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_amount: number;
  profit_margin: number;
}

interface SalesTrend {
  date: string;
  amount: number;
}

const SalesAnalytics = ({ branchId }: SalesAnalyticsProps) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(branchId || "");
  const [timeRange, setTimeRange] = useState<string>("month");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [topProducts, setTopProducts] = useState<ProductSalesData[]>([]);
  const [salesTrend, setSalesTrend] = useState<SalesTrend[]>([]);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [salesGrowth, setSalesGrowth] = useState<number>(0);
  const [averageOrderValue, setAverageOrderValue] = useState<number>(0);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (!selectedBranch && branches.length > 0) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

  useEffect(() => {
    if (selectedBranch) {
      fetchSalesData();
    }
  }, [selectedBranch, timeRange]);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase.from("branches").select("*");
      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (timeRange) {
      case "week":
        startDate = subDays(now, 7);
        endDate = now;
        break;
      case "month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "quarter":
        startDate = subMonths(now, 3);
        endDate = now;
        break;
      case "year":
        startDate = subMonths(now, 12);
        endDate = now;
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    return { startDate, endDate };
  };

  const fetchSalesData = async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      // For this demo, we'll simulate sales data since we don't have actual sales data with product details
      // In a real app, you would query your sales/orders table with product details

      // 1. Fetch financial transactions of type 'sale'
      const { data: salesData, error: salesError } = await supabase
        .from("financial_transactions")
        .select("*")
        .eq("branch_id", selectedBranch)
        .eq("transaction_type", "sale")
        .gte("transaction_date", startDate.toISOString())
        .lte("transaction_date", endDate.toISOString())
        .order("transaction_date", { ascending: true });

      if (salesError) throw salesError;

      // 2. Calculate total sales and trends
      const totalSalesAmount = salesData.reduce(
        (sum, sale) => sum + sale.amount,
        0,
      );
      setTotalSales(totalSalesAmount);

      // 3. Calculate average order value
      const avgOrderValue =
        salesData.length > 0 ? totalSalesAmount / salesData.length : 0;
      setAverageOrderValue(avgOrderValue);

      // 4. Group sales by date for trend analysis
      const salesByDate: { [key: string]: number } = {};
      salesData.forEach((sale) => {
        const date = sale.transaction_date.split("T")[0];
        if (!salesByDate[date]) {
          salesByDate[date] = 0;
        }
        salesByDate[date] += sale.amount;
      });

      const trendData = Object.entries(salesByDate).map(([date, amount]) => ({
        date,
        amount,
      }));
      trendData.sort((a, b) => a.date.localeCompare(b.date));
      setSalesTrend(trendData);

      // 5. Calculate sales growth (comparing with previous period)
      // For simplicity, we'll compare the first half vs second half of the period
      if (trendData.length > 1) {
        const midPoint = Math.floor(trendData.length / 2);
        const firstHalfSales = trendData
          .slice(0, midPoint)
          .reduce((sum, day) => sum + day.amount, 0);
        const secondHalfSales = trendData
          .slice(midPoint)
          .reduce((sum, day) => sum + day.amount, 0);

        const growth =
          firstHalfSales > 0
            ? ((secondHalfSales - firstHalfSales) / firstHalfSales) * 100
            : 0;
        setSalesGrowth(growth);
      }

      // 6. For top products, we'll simulate data since we don't have actual product sales data
      // In a real app, you would join with order_items or similar table
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .limit(5);

      if (productsError) throw productsError;

      // Simulate product sales data
      const simulatedProductSales = productsData.map((product, index) => {
        // Generate random sales data for demonstration
        const quantity = Math.floor(Math.random() * 50) + 10;
        const amount = quantity * product.price;
        const profitMargin =
          ((product.price - product.cost) / product.price) * 100;

        return {
          product_id: product.id,
          product_name: product.name,
          total_quantity: quantity,
          total_amount: amount,
          profit_margin: profitMargin,
        };
      });

      // Sort by total amount descending
      simulatedProductSales.sort((a, b) => b.total_amount - a.total_amount);
      setTopProducts(simulatedProductSales);
    } catch (error) {
      console.error("Error fetching sales data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP", { locale: ar });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold">تحليل المبيعات</CardTitle>
        <CardDescription>
          تحليل أداء المبيعات والمنتجات الأكثر مبيعًا
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Label htmlFor="timeRange">الفترة الزمنية</Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger id="timeRange">
                <SelectValue placeholder="اختر الفترة الزمنية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">آخر أسبوع</SelectItem>
                <SelectItem value="month">الشهر الحالي</SelectItem>
                <SelectItem value="quarter">آخر 3 أشهر</SelectItem>
                <SelectItem value="year">آخر سنة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">جاري تحميل البيانات...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">إجمالي المبيعات</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center">
                  <DollarSign className="h-5 w-5 text-muted-foreground ml-2" />
                  <p className="text-2xl font-bold">{totalSales.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">نمو المبيعات</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center">
                  {salesGrowth >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500 ml-2" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500 ml-2" />
                  )}
                  <p
                    className={`text-2xl font-bold ${salesGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {Math.abs(salesGrowth).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">متوسط قيمة الطلب</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center">
                  <DollarSign className="h-5 w-5 text-muted-foreground ml-2" />
                  <p className="text-2xl font-bold">
                    {averageOrderValue.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    المنتجات الأكثر مبيعًا
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المنتج</TableHead>
                        <TableHead>الكمية</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>هامش الربح</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center h-24">
                            لا توجد بيانات متاحة
                          </TableCell>
                        </TableRow>
                      ) : (
                        topProducts.map((product) => (
                          <TableRow key={product.product_id}>
                            <TableCell className="font-medium">
                              {product.product_name}
                            </TableCell>
                            <TableCell>{product.total_quantity}</TableCell>
                            <TableCell>
                              {product.total_amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="flex items-center">
                              <Percent className="h-3 w-3 text-muted-foreground ml-1" />
                              {product.profit_margin.toFixed(1)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">اتجاه المبيعات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[300px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>التاريخ</TableHead>
                          <TableHead>المبيعات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesTrend.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center h-24">
                              لا توجد بيانات متاحة
                            </TableCell>
                          </TableRow>
                        ) : (
                          salesTrend.map((day, index) => (
                            <TableRow key={index}>
                              <TableCell>{formatDate(day.date)}</TableCell>
                              <TableCell className="font-medium">
                                {day.amount.toFixed(2)}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesAnalytics;
