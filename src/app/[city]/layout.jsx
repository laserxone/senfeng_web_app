import FloatingChat from "@/components/chat/floating-chat";
import CommonLayout from "@/components/CommonLayout";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children, params }) {
  const { city } = await params;

  if (!city.includes("lahore") && !city.includes("karachi")) {
    redirect("/");
  }

  return (
    <CommonLayout office={city}>
      {children}
      <FloatingChat />
    </CommonLayout>
  );
}
