import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  PlusCircle,
  FileText,
  Package,
  DollarSign,
  ShoppingCart,
  BarChart,
} from "lucide-react";

interface QuickActionProps {
  actions?: {
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
  }[];
}

const QuickActions = ({ actions }: QuickActionProps) => {
  const defaultActions = [
    {
      title: "New Transaction",
      description: "Record a new financial transaction",
      icon: <DollarSign className="h-5 w-5" />,
      onClick: () => console.log("New transaction clicked"),
    },
    {
      title: "Add Product",
      description: "Add a new product to inventory",
      icon: <Package className="h-5 w-5" />,
      onClick: () => console.log("Add product clicked"),
    },
    {
      title: "Create Invoice",
      description: "Generate a new customer invoice",
      icon: <FileText className="h-5 w-5" />,
      onClick: () => console.log("Create invoice clicked"),
    },
    {
      title: "Process Order",
      description: "Process a new customer order",
      icon: <ShoppingCart className="h-5 w-5" />,
      onClick: () => console.log("Process order clicked"),
    },
    {
      title: "Generate Report",
      description: "Create a financial or inventory report",
      icon: <BarChart className="h-5 w-5" />,
      onClick: () => console.log("Generate report clicked"),
    },
    {
      title: "Add More",
      description: "Configure quick actions",
      icon: <PlusCircle className="h-5 w-5" />,
      onClick: () => console.log("Add more clicked"),
    },
  ];

  const displayActions = actions || defaultActions;

  return (
    <Card className="w-full h-[400px] bg-white">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Frequently used actions and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {displayActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 p-4 hover:bg-slate-50"
              onClick={action.onClick}
            >
              <div className="rounded-full bg-slate-100 p-2">{action.icon}</div>
              <div className="text-center">
                <p className="font-medium text-sm">{action.title}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {action.description}
                </p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
