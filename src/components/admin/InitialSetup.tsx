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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";

const InitialSetup = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasGeneralManager, setHasGeneralManager] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    password: "",
    confirmPassword: "",
    branch_id: "",
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkGeneralManager();
    fetchBranches();
  }, []);

  const checkGeneralManager = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("role", "general_manager");

      if (error) throw error;
      setHasGeneralManager(data && data.length > 0);
    } catch (error) {
      console.error("Error checking general manager:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase.from("branches").select("*");
      if (error) throw error;
      setBranches(data || []);
      if (data && data.length > 0 && !formData.branch_id) {
        setFormData((prev) => ({ ...prev, branch_id: data[0].id }));
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!formData.branch_id) {
      alert("Please select a branch");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-create-initial-general-manager",
        {
          body: {
            password: formData.password,
            full_name: formData.full_name,
            branch_id: formData.branch_id,
          },
        },
      );

      if (error) throw error;
      alert("General manager created successfully. Please log in.");
      navigate("/login");
    } catch (error: any) {
      console.error("Error creating general manager:", error);
      alert(`Error: ${error.message || "Failed to create general manager"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is already logged in or general manager exists, redirect to dashboard
  if (user || hasGeneralManager) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold">الإعداد الأولي</CardTitle>
          <CardDescription>
            {user ? "أنت مسجل الدخول بالفعل" : "تم إعداد المدير العام بالفعل"}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => navigate("/dashboard")} className="w-full">
            الذهاب إلى لوحة التحكم
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold">الإعداد الأولي</CardTitle>
          <CardDescription>جاري التحميل...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8 bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold">إعداد المدير العام</CardTitle>
        <CardDescription>
          إنشاء حساب المدير العام (yousufabdallah2000@gmail.com)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">الاسم الكامل</Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch">الفرع</Label>
            <Select
              value={formData.branch_id}
              onValueChange={(value) => handleSelectChange("branch_id", value)}
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "جاري الإنشاء..." : "إنشاء المدير العام"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InitialSetup;
