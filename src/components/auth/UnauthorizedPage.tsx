import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "./AuthProvider";

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md bg-white shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="bg-red-50 border-b border-red-100">
          <div className="flex items-center justify-center mb-2">
            <ShieldAlert className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-red-700">
            غير مصرح بالوصول
          </CardTitle>
          <CardDescription className="text-center text-red-600">
            ليس لديك الصلاحيات اللازمة للوصول إلى هذه الصفحة
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <p className="text-gray-700">
              دورك الحالي:{" "}
              <span className="font-semibold">{userRole || "غير معروف"}</span>
            </p>
            <p className="text-gray-700">
              يرجى التواصل مع مسؤول النظام إذا كنت تعتقد أنه يجب أن يكون لديك
              وصول إلى هذه الصفحة.
            </p>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t p-4 flex justify-center">
          <Button
            onClick={() => navigate("/dashboard")}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            العودة إلى لوحة التحكم
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default UnauthorizedPage;
