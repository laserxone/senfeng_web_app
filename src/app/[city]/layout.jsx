import CommonLayout from "@/components/CommonLayout";

export default async function DashboardLayout({ children, params }) {
  const { city } = await params;

  return <CommonLayout office={city}>{children}</CommonLayout>;
}
