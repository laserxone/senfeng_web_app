import FloatingChat from "@/components/chat/floating-chat";
import CommonLayout from "@/components/CommonLayout";
import FloatingTodo from "@/components/floating-todo";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children, params }) {
  const { city } = await params;

  if (!city.includes("lahore") && !city.includes("karachi")) {
    redirect("/");
  }

  return (
    <CommonLayout office={city}>
      {children}
      <div className="flex flex-col gap-2 fixed bottom-6 right-6 z-50">
        <FloatingTodo />
        <FloatingChat />
      </div>
    </CommonLayout>
  );
}
