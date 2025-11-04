import FloatingChat from "@/components/chat/floating-chat";
import CommonLayout from "@/components/CommonLayout";
import EdgePanel from "@/components/edge-panel";
import FinePopup from "@/components/fine-popup";
import FloatingInformation from "@/components/floating-information";
import FloatingTodo from "@/components/floating-todo";
import FloatingWidgets from "@/components/floating-widget";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children, params }) {
  const { city } = await params;

  if (!city.includes("lahore") && !city.includes("karachi")) {
    redirect("/");
  }


  return (
    <CommonLayout office={city}>
      {children}
       <FinePopup/>
        <EdgePanel width={384} className={"pt-4"}>
        <div className="flex gap-2 w-full justify-evenly">
          <FloatingInformation />
          <FloatingTodo />
          <FloatingChat />
        </div>
      </EdgePanel>
    </CommonLayout>
  );
}
