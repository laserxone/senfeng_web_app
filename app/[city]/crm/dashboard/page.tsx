"use client"
import CRMDashboardPage from "@/components/page-compositions/dashboards/crm-dashboard"
import useUserDetail from "@/hooks/use-user-detail"

export default function Page() {
  const { userID } = useUserDetail()
  return <CRMDashboardPage id={userID} />
}
