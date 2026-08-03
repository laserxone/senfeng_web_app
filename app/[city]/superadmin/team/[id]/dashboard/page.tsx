import AfterSalesDashboardNew from "@/components/features/aftersales/AfterSalesDashboardNew"
import CRMDashboard from "@/components/features/dashboards/crm-dashboard"
import CRMDashboardPage from "@/components/page-compositions/dashboards/crm-dashboard"
import DealerDashboard from "@/components/page-compositions/dashboards/dealer-dashboard"
import EngineerDashboard from "@/components/page-compositions/dashboards/engineer-deashboard"
import ManagerDashboard from "@/components/page-compositions/dashboards/manager-dashboard"
import SalesDashboardPage from "@/components/page-compositions/dashboards/sales-dashboard"
import SMMDashboard from "@/components/page-compositions/dashboards/smm-dashboard"
import StoreManagerDashboard from "@/components/page-compositions/dashboards/store-dashboard"

type PageProps = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    designation?: string
    admin: string
  }>
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params
  const { designation, admin } = await searchParams

  if (!id || !designation) {
    return <div>Dashboard information is missing</div>
  }

  return (
    <>
      {designation === "Sales" && <SalesDashboardPage id={id as string} />}
      {designation === "Manager" && <ManagerDashboard id={id as string} />}
      {designation === "Engineer" && <EngineerDashboard id={id as string} />}
      {designation === "Store Manager" && (
        <StoreManagerDashboard id={id as string} />
      )}
      {designation === "Social Media Manager" && (
        <SMMDashboard id={id as string} />
      )}
      {designation === "Customer Relationship Manager" &&
        (admin === "true" ? (
          <CRMDashboard userID={id as string} />
        ) : (
          <CRMDashboardPage id={id as string} />
        ))}
      {designation === "Customer Relationship Manager (After Sales)" && (
        <AfterSalesDashboardNew userID={id as string} />
      )}
      {designation === "Dealer" && <DealerDashboard id={id as string} />}
    </>
  )
}
