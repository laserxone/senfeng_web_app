"use client";
import AfterSalesDashboardNew from "@/components/features/aftersales/AfterSalesDashboardNew";
import useUserDetail from "@/hooks/use-user-detail";

export default function Page() {
  const { userID } = useUserDetail();
  return <AfterSalesDashboardNew userID={userID} />;
}
