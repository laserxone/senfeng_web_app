"use client";
import StoreManagerDashboard from "@/components/page-compositions/dashboards/store-dashboard";
import useUserDetail from "@/hooks/use-user-detail";

export default function Page() {
  const { userID } = useUserDetail()
  return <StoreManagerDashboard id={userID} />
}