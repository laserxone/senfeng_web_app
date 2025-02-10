import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export function Sale({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {data.map((item, ind) => (
            <div key={ind} className="flex flex-col sm:flex-row items-center justify-between sm:space-x-4">
              <div className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={item.seller_dp} alt="Avatar" />
                  <AvatarFallback>
                    {item.seller_name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {item.seller_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.seller_email}
                  </p>
                </div>
              </div>
              <div >
                <div className="font-medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "PKR",
                  }).format(item.price || 0)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString("en-GB")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

