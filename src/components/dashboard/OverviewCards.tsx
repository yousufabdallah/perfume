import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpRight,
  ArrowDownRight,
  Package,
  DollarSign,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

interface OverviewCardProps {
  title: string;
  value: string;
  description: string;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
}

const OverviewCard = ({
  title = "Metric",
  value = "$0",
  description = "No change",
  trend = "neutral",
  icon = <TrendingUp className="h-4 w-4" />,
}: OverviewCardProps) => {
  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground flex items-center mt-1">
          {trend === "up" && (
            <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
          )}
          {trend === "down" && (
            <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
          )}
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

interface OverviewCardsProps {
  cards?: OverviewCardProps[];
}

const OverviewCards = ({ cards = [] }: OverviewCardsProps) => {
  // Default cards if none provided
  const defaultCards: OverviewCardProps[] = [
    {
      title: "Total Revenue",
      value: "$45,231.89",
      description: "+20.1% from last month",
      trend: "up",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: "Inventory Value",
      value: "$12,234.59",
      description: "+2.5% from last week",
      trend: "up",
      icon: <Package className="h-4 w-4" />,
    },
    {
      title: "Pending Orders",
      value: "12",
      description: "-3 from yesterday",
      trend: "down",
      icon: <ShoppingCart className="h-4 w-4" />,
    },
    {
      title: "Low Stock Items",
      value: "8",
      description: "+2 since last check",
      trend: "up",
      icon: <Package className="h-4 w-4" />,
    },
  ];

  const displayCards = cards.length > 0 ? cards : defaultCards;

  return (
    <div className="w-full bg-gray-50 p-4 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayCards.map((card, index) => (
          <OverviewCard
            key={index}
            title={card.title}
            value={card.value}
            description={card.description}
            trend={card.trend}
            icon={card.icon}
          />
        ))}
      </div>
    </div>
  );
};

export default OverviewCards;
