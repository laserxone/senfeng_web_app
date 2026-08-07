import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, Gift, Trash2, User } from "lucide-react";
import { GiftApplication } from "./gift-types";
import { giftStatusColors } from "./gift-status-color";

export default function GiftApplicationCard({
  application,
  onViewDetails,
  onDelete,
  showUser,
  showDelete,
}: {
  application: GiftApplication;
  onViewDetails: () => void;
  onDelete?: () => void;
  showUser?: boolean;
  showDelete?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <div
        className={
          application.status === "approved"
            ? "h-1 bg-emerald-500"
            : application.status === "rejected"
              ? "h-1 bg-red-500"
              : application.status === "in_progress"
                ? "h-1 bg-blue-500"
                : "h-1 bg-amber-500"
        }
      />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Gift request</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {application.reason}
            </CardDescription>
          </div>
          <Badge
            className={`capitalize ${giftStatusColors[application.status]}`}
          >
            {application.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showUser ? (
          <p className="flex items-center gap-2 text-sm">
            <User className="size-4 text-muted-foreground" />
            {application.user_name}
          </p>
        ) : null}
        <div className="text-sm">
          <p className="text-xs text-muted-foreground">Inventory items</p>
          <p className="font-medium">
            {application.inventory_details
              .map((item) => `${item.name} × ${item.qty}`)
              .join(", ") || "No items found"}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Applied {new Date(application.created_at).toLocaleDateString()}
        </p>
        {application.is_my_turn ? (
          <Badge className="bg-blue-100 text-blue-700">Your Turn</Badge>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onViewDetails}
        >
          <Eye className="mr-2 size-4" />
          View Details
        </Button>
        {showDelete ? (
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={onDelete}
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
