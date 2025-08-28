import FloatingChat from "@/components/chat/floating-chat";
import CommonLayout from "@/components/CommonLayout";
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
      <FloatingWidgets>
        <div className="flex flex-col gap-2">
          <FloatingInformation />
          <FloatingTodo />
          <FloatingChat />
        </div>
      </FloatingWidgets>
    </CommonLayout>
  );
}
