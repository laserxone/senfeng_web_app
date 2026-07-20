import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useUserDetail from "@/hooks/use-user-detail";
import formatCurrency from "@/lib/formatCurrency";
import { GetProfileImage } from "@/lib/getProfileImage";
import { AdminDashboardRecentSales } from "@/lib/types";
import moment from "moment";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Sale({ data } : {data : AdminDashboardRecentSales[]}) {
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
                  <RenderImage img={item.seller_dp} />

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
                  {formatCurrency(item.price)}
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

const RenderImage = ({ img }: { img: string }) => {

  const [localImage, setLocalImage] = useState<string | null>(null)

  useEffect(() => {
    async function fetchImage() {
      if (img?.includes("http")) {
        setLocalImage(img);
      } else {
        const imgResult = await GetProfileImage(img);
        setLocalImage(imgResult);
      }
    }

    if (img) {
      fetchImage();
    }
  }, [img]);

  if (!localImage) return null
  return (
    <AvatarImage src={localImage} alt="Avatar" />
  )
}
