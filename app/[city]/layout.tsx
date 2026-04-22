import FloatingChat from "@/components/chat/floating-chat";
import CommonLayout from "@/components/CommonLayout";
import EdgePanel from "@/components/edge-panel";
import FinePopup from "@/components/fine-popup";
import FloatingInformation from "@/components/floating-information";
import FloatingTodo from "@/components/floating-todo";
import PageContainer from "@/components/page-container";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function DashboardLayout({ children, params }: {
  children: ReactNode,
  params: Promise<{ city: string }>
}) {
  const { city } = await params;

  if (!city.includes("lahore") && !city.includes("karachi")) {
    redirect("/");
  }


  return (
    <CommonLayout office={city}>
      <PageContainer>
        {children}
      </PageContainer>
      {/* <FinePopup />
      <EdgePanel width={384} className={"pt-4"}>
        <div className="flex gap-2 w-full justify-evenly">
          <FloatingInformation />
          <FloatingTodo />
          <FloatingChat />
        </div>
      </EdgePanel> */}
    </CommonLayout>
  );
}
