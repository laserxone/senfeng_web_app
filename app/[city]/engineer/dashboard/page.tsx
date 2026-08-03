"use client"
import EngineerDashboard from "@/components/page-compositions/dashboards/engineer-deashboard"
import useUserDetail from "@/hooks/use-user-detail"

export default function Page() {
  const { userID } = useUserDetail()
  return <EngineerDashboard id={userID} />
}
