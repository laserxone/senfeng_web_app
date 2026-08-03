"use client"
import ManagerDashboard from "@/components/page-compositions/dashboards/manager-dashboard"
import useUserDetail from "@/hooks/use-user-detail"

export default function Page() {
  const { userID } = useUserDetail()
  return <ManagerDashboard id={userID} />
}
