import CommonLayout from "@/components/CommonLayout";

export default async function DashboardLayout({ children }) {
  return (
   <CommonLayout>
    {children}
   </CommonLayout>
  );
}
