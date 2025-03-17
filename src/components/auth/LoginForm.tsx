import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "يرجى إدخال بريد إلكتروني صحيح" }),
  password: z
    .string()
    .min(6, { message: "يجب أن تكون كلمة المرور 6 أحرف على الأقل" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSubmit?: (values: LoginFormValues) => void;
  isLoading?: boolean;
  error?: string | null;
}

const LoginForm = ({
  onSubmit = () => {},
  isLoading = false,
  error = null,
}: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleFormSubmit = (data: LoginFormValues) => {
    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-md bg-white shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          تسجيل الدخول
        </CardTitle>
        <CardDescription className="text-center">
          أدخل بيانات الاعتماد الخاصة بك للوصول إلى حسابك
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 ml-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              dir="ltr"
              {...register("email")}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">كلمة المرور</Label>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-sm"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <span className="flex items-center">
                    <EyeOff className="h-4 w-4 ml-1" /> إخفاء
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Eye className="h-4 w-4 ml-1" /> إظهار
                  </span>
                )}
              </Button>
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              dir="ltr"
              {...register("password")}
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary ml-2"
              />
              <Label htmlFor="remember" className="text-sm font-normal">
                تذكرني
              </Label>
            </div>
            <Button type="button" variant="link" className="p-0 h-auto text-sm">
              نسيت كلمة المرور؟
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t p-4">
        <p className="text-sm text-gray-600">
          ليس لديك حساب؟{" "}
          <Button variant="link" className="p-0 h-auto text-sm">
            إنشاء حساب
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
