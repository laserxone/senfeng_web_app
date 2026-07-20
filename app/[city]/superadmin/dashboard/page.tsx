"use client";
import CRMDashboard from "@/components/features/dashboards/crm-dashboard";
import SuperadminDashboard from "@/components/features/dashboards/superadmin-dashboard";
import useUserDetail from "@/hooks/use-user-detail";

export default function Page() {
  const { designation } = useUserDetail()

  if (designation === 'Customer Relationship Manager')
    return <CRMDashboard />
  else return <SuperadminDashboard />
}