import { Button } from "@/components/ui/button";
import { useState } from "react";
import { RequiredStar } from "@/components/shared/common/RequiredStar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpenCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { MyCustomer, OrderItem } from "@/lib/types";
import { CustomerSearchWithData } from "@/components/features/customers/components/customer-search-with-data";

const BookOrderDialog = ({
  visible,
  onClose,
  onRefresh,
  id,
  item,
}: {
  visible: boolean
  onClose: () => void
  onRefresh: () => Promise<void>
  id?: number
  item: OrderItem | null
}) => {
  const [customer, setCustomer] = useState<MyCustomer | null>(null)
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail()

  const handleSubmit = async () => {
    if (!customer?.id) return
    setLoading(true);
    try {

      const response = await axios
        .post(
          `/${userID}/machine?inventory=${id}`,
          {
            customer_id: customer?.id,
            type: "Machine",
            serial_no: item?.machine_model,
            power: item?.machine_power,
            source: item?.machine_source,
            sell_by: customer?.ownership,
            order_no_arr: [item?.machine_serial],
            commission: true,
          }
        )
      await onRefresh();
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  function handleClose() {
    onClose();
    setCustomer(null)
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-xl">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary"><BookOpenCheck className="h-4 w-4" /></span><div className="min-w-0"><DialogTitle className="text-sm font-semibold text-foreground">Book Machine for Customer</DialogTitle><DialogDescription className="text-xs text-muted-foreground">Select the customer who will receive this machine booking.</DialogDescription></div></div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          <div className="space-y-3 p-3.5 pb-4">
            <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
              <div>
                <Label>
                  Customer <RequiredStar />
                </Label>
                <CustomerSearchWithData value={customer} onReturn={setCustomer} />
              </div>

            </div>
          </div>
        

        <div className="mx-3.5 mb-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button disabled={loading || !customer} onClick={handleSubmit}>
            {loading && <Spinner />}Book Order
          </Button>
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BookOrderDialog;
