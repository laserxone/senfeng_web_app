"use client";
import SalesDashboardPage from "@/components/page-compositions/dashboards/sales-dashboard";
import useUserDetail from "@/hooks/use-user-detail";

export default function Page() {
  const { userID } = useUserDetail()
  return <SalesDashboardPage id={userID} />
}