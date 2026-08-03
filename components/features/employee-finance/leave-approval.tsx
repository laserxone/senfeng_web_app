import useUserDetail from "@/hooks/use-user-detail"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import axios from "@/lib/axios"
import { useState } from "react"
import Spinner from "@/components/ui/spinner"
import { UserAttendanceRecord } from "@/lib/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CalendarCheck } from "lucide-react"

export default function LeaveApproval({
  data,
  visible,
  onClose,
  onRefresh,
}: {
  data: UserAttendanceRecord | null
  visible: boolean
  onClose: () => void
  onRefresh?: (val: string) => void
}) {
  const { userID } = useUserDetail()
  const [loading, setLoading] = useState(false)

  async function UpdateStatus(status: string) {
    if (!data?.leave_id) return
    setLoading(true)
    try {
      await axios.put(`/${userID}/leave/${data?.leave_id}`, {
        status,
      })
      onRefresh?.(status)
      onClose()
    } finally {
      setLoading(false)
    }
  }
  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-md">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <CalendarCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold text-foreground">
                Update Leave Status
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Approve or reject the selected leave request.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          <div className="space-y-3 p-3.5 pb-4">
            {loading ? (
              <Spinner />
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  className="h-9 flex-1 rounded-lg"
                  onClick={() => UpdateStatus("Approved")}
                >
                  Approve
                </Button>
                <Button
                  className="h-9 flex-1 rounded-lg"
                  variant="destructive"
                  onClick={() => UpdateStatus("Rejected")}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
