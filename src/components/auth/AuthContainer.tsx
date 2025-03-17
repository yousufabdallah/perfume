import React, { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card } from "../ui/card";

interface AuthContainerProps {
  defaultTab?: "login" | "register";
  onLogin?: (values: { email: string; password: string }) => void;
  onRegister?: (values: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: string;
  }) => void;
  isLoading?: boolean;
  error?: string | null;
}

const AuthContainer = ({
  defaultTab = "login",
  onLogin = () => {},
  onRegister = () => {},
  isLoading = false,
  error = null,
}: AuthContainerProps) => {
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value as "login" | "register");
  };

  const handleLoginSubmit = (values: { email: string; password: string }) => {
    onLogin(values);
  };

  const handleRegisterSubmit = (values: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: string;
  }) => {
    onRegister(values);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md bg-white shadow-lg rounded-lg overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
            <TabsTrigger value="register">إنشاء حساب</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="p-0">
            <LoginForm
              onSubmit={handleLoginSubmit}
              isLoading={isLoading && activeTab === "login"}
              error={activeTab === "login" ? error : null}
            />
          </TabsContent>
          <TabsContent value="register" className="p-0">
            <RegisterForm
              onSubmit={handleRegisterSubmit}
              isLoading={isLoading && activeTab === "register"}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default AuthContainer;
