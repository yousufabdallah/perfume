import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Avatar } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import {
  CalendarClock,
  DollarSign,
  Package,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

type ActivityType = "accounting" | "inventory";

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  user: {
    name: string;
    avatar: string;
  };
  icon?: React.ReactNode;
  status?: string;
}

interface RecentActivityProps {
  activities?: ActivityItem[];
}

export default function RecentActivity({
  activities = defaultActivities,
}: RecentActivityProps) {
  return (
    <Card className="w-full h-[400px] bg-white">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions across the system</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="accounting">Accounting</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ActivityList activities={activities} />
          </TabsContent>

          <TabsContent value="accounting">
            <ActivityList
              activities={activities.filter((a) => a.type === "accounting")}
            />
          </TabsContent>

          <TabsContent value="inventory">
            <ActivityList
              activities={activities.filter((a) => a.type === "inventory")}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ActivityList({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No recent activities
      </div>
    );
  }

  return (
    <ScrollArea className="h-[280px] pr-4">
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex-shrink-0">
              {activity.icon || getDefaultIcon(activity.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium truncate">{activity.title}</p>
                <span className="text-xs text-muted-foreground">
                  {activity.timestamp}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mt-1">
                {activity.description}
              </p>

              <div className="flex items-center mt-2 gap-2">
                <Avatar className="h-6 w-6">
                  <img src={activity.user.avatar} alt={activity.user.name} />
                </Avatar>
                <span className="text-xs">{activity.user.name}</span>

                {activity.status && (
                  <Badge variant="outline" className="ml-auto">
                    {activity.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function getDefaultIcon(type: ActivityType) {
  if (type === "accounting") {
    return (
      <div className="p-2 rounded-full bg-blue-100">
        <DollarSign className="h-4 w-4 text-blue-600" />
      </div>
    );
  }
  return (
    <div className="p-2 rounded-full bg-amber-100">
      <Package className="h-4 w-4 text-amber-600" />
    </div>
  );
}

const defaultActivities: ActivityItem[] = [
  {
    id: "1",
    type: "accounting",
    title: "New transaction recorded",
    description: "Invoice #1234 paid by Client XYZ",
    timestamp: "10 min ago",
    user: {
      name: "Jane Cooper",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jane",
    },
    icon: (
      <div className="p-2 rounded-full bg-green-100">
        <ArrowUpRight className="h-4 w-4 text-green-600" />
      </div>
    ),
    status: "Completed",
  },
  {
    id: "2",
    type: "inventory",
    title: "Stock updated",
    description: "Added 25 units of Product ABC",
    timestamp: "1 hour ago",
    user: {
      name: "Robert Fox",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=robert",
    },
    status: "Processed",
  },
  {
    id: "3",
    type: "accounting",
    title: "Expense recorded",
    description: "Office supplies purchase - $250",
    timestamp: "3 hours ago",
    user: {
      name: "Esther Howard",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=esther",
    },
    icon: (
      <div className="p-2 rounded-full bg-red-100">
        <ArrowDownLeft className="h-4 w-4 text-red-600" />
      </div>
    ),
  },
  {
    id: "4",
    type: "inventory",
    title: "New order created",
    description: "Order #5678 for Client ABC",
    timestamp: "5 hours ago",
    user: {
      name: "Cameron Williamson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=cameron",
    },
    icon: (
      <div className="p-2 rounded-full bg-purple-100">
        <ShoppingCart className="h-4 w-4 text-purple-600" />
      </div>
    ),
    status: "Pending",
  },
  {
    id: "5",
    type: "accounting",
    title: "Financial report generated",
    description: "Q2 Income Statement exported",
    timestamp: "1 day ago",
    user: {
      name: "Leslie Alexander",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=leslie",
    },
    icon: (
      <div className="p-2 rounded-full bg-blue-100">
        <CalendarClock className="h-4 w-4 text-blue-600" />
      </div>
    ),
  },
  {
    id: "6",
    type: "inventory",
    title: "Low stock alert",
    description: "Product XYZ is below threshold (5 units)",
    timestamp: "2 days ago",
    user: {
      name: "Jenny Wilson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jenny",
    },
    status: "Warning",
  },
];
