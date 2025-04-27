import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { UserContext } from "@/store/context/UserContext";
import moment from "moment";
import Link from "next/link";
import { useContext } from "react";

export function Sale({ data }) {

  const {state : UserState} = useContext(UserContext)

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
                        ? `/${UserState.value.data?.base_route}/member/detail?id=${item?.customer_id}`
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
                  {moment(item.created_at).format("YYYY-MM-DD")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
