import React from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

const formSchema = z
  .object({
    fullName: z
      .string()
      .min(2, { message: "يجب أن يكون الاسم الكامل حرفين على الأقل." }),
    email: z.string().email({ message: "يرجى إدخال بريد إلكتروني صحيح." }),
    password: z
      .string()
      .min(8, { message: "يجب أن تكون كلمة المرور 8 أحرف على الأقل." }),
    confirmPassword: z.string(),
    role: z.string().min(1, { message: "يرجى اختيار دور." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمات المرور غير متطابقة",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

interface RegisterFormProps {
  onSubmit?: (values: FormValues) => void;
  isLoading?: boolean;
}

const RegisterForm = ({
  onSubmit = () => {},
  isLoading = false,
}: RegisterFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "",
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
  };

  return (
    <Card className="w-full max-w-md bg-white shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          إنشاء حساب جديد
        </CardTitle>
        <CardDescription className="text-center">
          أدخل معلوماتك لإنشاء حساب جديد
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم الكامل</FormLabel>
                  <FormControl>
                    <Input placeholder="محمد أحمد" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>البريد الإلكتروني</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@domain.com"
                      dir="ltr"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة المرور</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="********"
                      dir="ltr"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تأكيد كلمة المرور</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="********"
                      dir="ltr"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الدور الوظيفي</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر دوراً" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="general_manager">مدير عام</SelectItem>
                      <SelectItem value="branch_manager">مدير فرع</SelectItem>
                      <SelectItem value="accountant">محاسب</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    هذا يحدد مستوى الوصول الخاص بك في النظام.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <p className="text-sm text-gray-500">
          لديك حساب بالفعل؟{" "}
          <a href="#" className="text-blue-600 hover:underline">
            تسجيل الدخول
          </a>
        </p>
      </CardFooter>
    </Card>
  );
};

export default RegisterForm;
