"use client"
import SMMDashboard from "@/components/page-compositions/dashboards/smm-dashboard"
import useUserDetail from "@/hooks/use-user-detail"

export default function Page() {
  const { userID } = useUserDetail()
  return <SMMDashboard id={userID} />
}
