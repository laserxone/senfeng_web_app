import PageContainer from "@/components/core/layout/page-container"
import CommonLayout from "@/components/core/layout/common-layout"
import FinePopup from "@/components/shared/notifications/fine-popup"
import { redirect } from "next/navigation"
import { ReactNode } from "react"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ city: string }>
}) {
  const { city } = await params

  if (!city.includes("lahore") && !city.includes("karachi")) {
    redirect("/")
  }

  return (
    <CommonLayout office={city}>
      <PageContainer>{children}</PageContainer>
      <FinePopup />
    </CommonLayout>
  )
}
