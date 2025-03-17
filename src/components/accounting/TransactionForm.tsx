import React, { useState, useEffect } from "react";
import { supabase, Branch } from "@/lib/supabase";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Save } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface TransactionFormProps {
  branchId?: string;
  onSuccess?: () => void;
  transactionType?: string;
}

const TransactionForm = ({
  branchId,
  onSuccess,
  transactionType = "sale",
}: TransactionFormProps) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(branchId || "");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string>(transactionType);

  useEffect(() => {
    fetchBranches();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.from("financial_transactions").insert({
        branch_id: selectedBranch,
        transaction_type: selectedType,
        amount: parseFloat(amount),
        description: description || null,
        reference_number: referenceNumber || null,
        transaction_date: transactionDate.toISOString(),
        created_by: "00000000-0000-0000-0000-000000000000", // This should be the current user's ID in a real app
      });

      if (error) throw error;

      // Reset form
      setAmount("");
      setDescription("");
      setReferenceNumber("");
      setTransactionDate(new Date());

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold">تسجيل معاملة مالية</CardTitle>
        <CardDescription>
          {selectedType === "sale"
            ? "تسجيل عملية بيع"
            : selectedType === "purchase"
              ? "تسجيل عملية شراء"
              : selectedType === "expense"
                ? "تسجيل مصروفات"
                : selectedType === "income"
                  ? "تسجيل إيرادات"
                  : selectedType === "refund"
                    ? "تسجيل عملية استرجاع"
                    : selectedType === "transfer"
                      ? "تسجيل تحويل مخزون"
                      : "تسجيل معاملة مالية جديدة"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
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
              <Label htmlFor="type">نوع المعاملة</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="اختر نوع المعاملة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">بيع</SelectItem>
                  <SelectItem value="purchase">شراء</SelectItem>
                  <SelectItem value="expense">مصروفات</SelectItem>
                  <SelectItem value="income">إيرادات</SelectItem>
                  <SelectItem value="refund">استرجاع</SelectItem>
                  <SelectItem value="transfer">تحويل مخزون</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="أدخل المبلغ"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">تاريخ المعاملة</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={"w-full justify-start text-right font-normal"}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {transactionDate ? (
                      format(transactionDate, "PPP", { locale: ar })
                    ) : (
                      <span>اختر تاريخ</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={transactionDate}
                    onSelect={(date) => date && setTransactionDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">رقم المرجع</Label>
              <Input
                id="reference"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="رقم الفاتورة أو المرجع (اختياري)"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف المعاملة (اختياري)"
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            <Save className="ml-2 h-4 w-4" />
            {isLoading ? "جاري الحفظ..." : "حفظ المعاملة"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default TransactionForm;
