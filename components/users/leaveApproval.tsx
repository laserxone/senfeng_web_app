import useUserDetail from "@/hooks/use-user-detail";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import axios from "@/lib/axios";
import { useState } from "react";
import Spinner from "../ui/spinner";
import { UserAttendanceRecord } from "@/lib/types";

export default function LeaveApproval({ data, visible, onClose, onRefresh } : {data : UserAttendanceRecord | null, visible : boolean, onClose : ()=> void, onRefresh ?: (val : string)=> void}) {
  const { userID } = useUserDetail();
  const [loading, setLoading] = useState(false);

  async function UpdateStatus(status : string) {
    if (!data?.leave_id) return;
    setLoading(true);
    try {
      await axios.put(`/${userID}/leave/${data?.leave_id}`, {
        status,
      });
      onRefresh?.(status);
      onClose();
    } finally {
      setLoading(false);
    }
  }
  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Leave Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <Spinner />
          ) : (
            <div className="space-y-4 flex flex-col">
              <Button onClick={() => UpdateStatus("Approved")}>Approve</Button>
              <Button onClick={() => UpdateStatus("Rejected")}>Reject</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
