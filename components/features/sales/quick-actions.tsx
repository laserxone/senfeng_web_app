import AddTaskDialog from "@/components/features/tasks/dialogs/add-task-dialog";
import AddCustomerDialog from "@/components/features/customers/components/add-customer";
import {
  ClipboardList,
  FileText,
  MapPinPlus,
  MessageSquareText,
  Receipt,
  UserPlus,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import useUserDetail from "@/hooks/use-user-detail";
import { useState } from "react";
import AddFeedbackDialog from "@/components/features/customer-relations/add-feedback";
import AddVisit from "@/components/features/customer-relations/add-visit";
import { QuotationForm } from "@/components/features/quotations/quotation-form";
import AddReimbursementDialog from "@/components/features/reimbursements/add-reimbursement";

const items = [
  {
    name: "Add Customer",
    icon: UserPlus,
    trigger: "customer",
    accent: "from-emerald-50 to-teal-50 text-emerald-700 border-emerald-100",
  },
  {
    name: "Add Quotation",

    icon: FileText,
    trigger: "quotation",
    accent: "from-blue-50 to-sky-50 text-blue-700 border-blue-100",
  },
  {
    name: "Add Task",

    icon: ClipboardList,
    trigger: "task",
    accent: "from-amber-50 to-orange-50 text-amber-700 border-amber-100",
  },
  {
    name: "Add Claim",

    icon: Receipt,
    trigger: "reimbursement",
    accent: "from-rose-50 to-red-50 text-rose-700 border-rose-100",
  },
  {
    name: "Add Visit",

    icon: MapPinPlus,
    trigger: "visit",
    accent: "from-indigo-50 to-violet-50 text-indigo-700 border-indigo-100",
  },
  {
    name: "Add Feedback",

    icon: MessageSquareText,
    trigger: "feedback",
    accent: "from-cyan-50 to-teal-50 text-cyan-700 border-cyan-100",
  },
];

type Props = {
  onRefreshCustomer: () => Promise<void>;
  onRefreshFeedback: () => Promise<void>;
  onRefreshQuotation: () => Promise<void>;
  onRefreshReimbursement: () => Promise<void>;
  onRefreshTask: () => Promise<void>;
  onRefreshVisit: () => Promise<void>;
};

export default function SalesQuickActions({
  onRefreshCustomer,
  onRefreshFeedback,
  onRefreshQuotation,
  onRefreshReimbursement,
  onRefreshTask,
  onRefreshVisit,
}: Props) {
  const [open, setOpen] = useState("");
  const { route_branch, userID, designation, isAdmin } = useUserDetail();
  function handleClose() {
    setOpen("");
  }
  return (
    <>
      <Card className="h-full w-full overflow-hidden border border-slate-200/80 p-0 shadow-sm ring-1 ring-black/5 xl:h-[300px]">
        <CardContent className="flex h-full flex-col gap-3 p-4">
          <div className="border-b border-slate-200/80 pb-3">
            <p className="text-sm font-semibold sm:text-base">Quick Actions</p>
            <p className="text-xs text-muted-foreground">
              Create daily sales activity faster
            </p>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((item) => {
              const Icon = item.icon;
              const tile = (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    if (item.trigger !== "task") {
                      setOpen(item.trigger);
                    }
                  }}
                  className={`group flex min-h-0 flex-col items-center justify-center gap-2 rounded-lg border bg-gradient-to-br p-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ${item.accent} hover:cursor-pointer`}
                >
                  <Icon className="size-6" />

                  <span className="space-y-0.5">
                    <span className="block text-sm leading-tight text-foreground">
                      {item.name}
                    </span>
                  </span>
                </button>
              );

              if (item.trigger === "task") {
                return (
                  <AddTaskDialog
                    key={item.name}
                    user_id={userID}
                    onRefresh={onRefreshTask}
                  >
                    {tile}
                  </AddTaskDialog>
                );
              }

              return tile;
            })}
          </div>
        </CardContent>
      </Card>

      <AddCustomerDialog
        user_id={userID}
        office={route_branch}
        ownership={
          isAdmin ||
          designation === "Customer Relationship Manager" ||
          designation === "Customer Relationship Manager (After Sales)"
        }
        user_designation={designation}
        visible={open === "customer"}
        onClose={handleClose}
        onRefresh={onRefreshCustomer}
      />

      <AddFeedbackDialog
        onClose={handleClose}
        open={open === "feedback"}
        user_id={userID}
        onRefresh={onRefreshFeedback}
      />

      <AddVisit
        onClose={handleClose}
        open={open === "visit"}
        id={userID}
        onRefresh={onRefreshVisit}
      />

      <AddReimbursementDialog
        open={open === "reimbursement"}
        onClose={handleClose}
        id={userID}
        onRefresh={onRefreshReimbursement}
      />

      <QuotationForm
        open={open === "quotation"}
        onClose={handleClose}
        onRefresh={onRefreshQuotation}
      />
    </>
  );
}
