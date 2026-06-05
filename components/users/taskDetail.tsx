

import { Button } from "@/components/ui/button";
import { useState } from "react";

import { Label } from "@/components/ui/label";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

import axios from "@/lib/axios";
import { TaskProps } from "@/lib/types";
import moment from "moment";
import { toast } from "sonner";
import Spinner from "../ui/spinner";


const TaskDetail = ({
  detail,
  visible,
  onClose,
  onMark,
  user_id,
} : {
  detail : TaskProps | null,
  visible : boolean,
  onClose : (val : boolean)=> void,
  onMark : ()=> Promise<void>
  user_id : number | string
}) => {
  if(!detail?.id) return null
  const [loading, setLoading] = useState(false);
  

  async function handleUpdateStatus(values : {id : number, status :string}) {
    setLoading(true);
    axios
      .put(`/${user_id}/task/${detail?.id}`, {
        id: values.id,
        status: values.status,
      })
      .then(() => {
        toast.success("Status updated" );
        onClose(false);
      })

      .finally(() => {
        setLoading(false);
        onMark();
      });
  }

  return (
    <Sheet open={visible} onOpenChange={onClose}>
      <SheetContent
      >
        <SheetHeader>
          <SheetTitle>Task Detail</SheetTitle>
          <SheetDescription>Check task details</SheetDescription>
        </SheetHeader>
       
          <div className="px-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-medium text-gray-600">Status</h3>
              <h3 className="text-sm font-medium text-gray-600">
                Assigned Date
              </h3>
              {/* <h3 className="text-sm font-medium text-gray-600">Assigned To</h3>
              <h3 className="text-sm font-medium text-gray-600">
                Assignee Email
              </h3> */}
              <h3 className="text-sm font-medium text-gray-600">
                Assigned Task
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              <Label htmlFor="status" className="text-sm text-gray-800">
                {detail?.status}
              </Label>
              <Label htmlFor="assign_date" className="text-sm text-gray-800">
                {detail?.created_at
                  ? moment(detail?.created_at).format("YYYY-MM-DD")
                  : ""}
              </Label>
              {/* <Label htmlFor="assigned_to" className="text-sm text-gray-800">
                {detail?.assigned_to_name}
              </Label>
              <Label htmlFor="assignee_email" className="text-sm text-gray-800">
                {detail?.assigned_to_email}
              </Label> */}
              <Label htmlFor="assigned_task" className="text-sm text-gray-800">
                {detail?.task_name}
              </Label>

              {detail?.problem && (
                <>
                  <Label htmlFor="problem" className="text-sm text-gray-800">
                    {detail?.problem}
                  </Label>
                  <Label htmlFor="solution" className="text-sm text-gray-800">
                    {detail?.solution}
                  </Label>
                </>
              )}
            </div>
          </div>
       

        <SheetFooter className={"mt-4"}>
          {detail?.status !== "Completed" && (
            <Button
              onClick={() => {
                handleUpdateStatus({
                  ...detail,
                  status: "Completed",
                });
              }}
            >
              {loading && <Spinner />}
              {"Mark as Completed"}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TaskDetail