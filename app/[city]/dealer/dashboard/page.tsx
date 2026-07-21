"use client";
import DealerDashboard from "@/components/page-compositions/dashboards/dealer-dashboard";
import useUserDetail from "@/hooks/use-user-detail";

export default function Page() {
  const { userID } = useUserDetail()
  return <DealerDashboard id={userID} />
}