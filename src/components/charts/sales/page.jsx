import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useUserDetail from "@/hooks/use-user-detail";
import moment from "moment";
import Link from "next/link";

export function Sale({ data }) {
  const { base_route } = useUserDetail();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {data.map((item, ind) => (
            <div
              key={ind}
              className="flex flex-row items-center justify-between gap-4"
            >
              <div className="flex  items-center">
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
                  <Link
                    target="blank"
                    href={
                      item?.customer_id
                        ? `/${base_route}/member/${item?.customer_id}`
                        : "#"
                    }
                  >
                    <p className="text-sm text-muted-foreground">
                      {item?.customer_name || item?.customer_owner}
                    </p>
                  </Link>
                </div>
              </div>
              <div className="flex  flex-col items-start">
                <div className="font-medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "PKR",
                  }).format(item.price || 0)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {moment(item.contract_date).format("YYYY-MM-DD")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
