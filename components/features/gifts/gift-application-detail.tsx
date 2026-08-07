import { MyImgZooming } from "@/components/shared/media/img-zooming";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, ImagePlus, User } from "lucide-react";
import { GiftApplication } from "./gift-types";
import { giftStatusColors } from "./gift-status-color";

export default function GiftApplicationDetails({
  application,
}: {
  application: GiftApplication;
}) {
  return (
    <div className="space-y-4 px-2 pb-4">
      <Badge className={`capitalize ${giftStatusColors[application.status]}`}>
        {application.status.replace("_", " ")}
      </Badge>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4 text-pink-600" />
            Applicant & Customer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Applicant" value={application.user_name} />
          <Row
            label="Customer"
            value={
              application.customer_name ||
              application.customer_owner ||
              "Not specified"
            }
          />
          <Row
            label="Hierarchy"
            value={application.hierarchy_name || "Not specified"}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="size-4 text-pink-600" />
            Gift Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Reason" value={application.reason} />
          <div>
            <p className="text-muted-foreground">Selected inventory items</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {application.inventory_details.map((item) => (
                <Badge key={item.id} variant="secondary">
                  {item.name} × {item.qty}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      {application.image ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ImagePlus className="size-4 text-pink-600" />
              Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MyImgZooming img={application.image} />
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Approval Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {application.approval_steps?.map((step) => (
            <div key={step.id} className="rounded-lg border p-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{step.approver_name}</span>
                <Badge variant="outline" className="capitalize">
                  {step.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {step.approver_designation}
              </p>
              {step.comments ? (
                <p className="mt-2 italic text-muted-foreground">
                  “{step.comments}”
                </p>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
