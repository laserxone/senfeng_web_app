import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContext, useState } from "react";
import ChequeCredit from "./cheque-credit";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OfficeContext } from "@/store/context/OfficeContext";
import moment from "moment";
import { UploadImage } from "@/lib/uploadFunction";
import axios from "@/lib/axios";
import useUserDetail from "@/hooks/use-user-detail";
import Spinner from "@/components/ui/spinner";
import { ChequeProp } from "@/lib/types";
import { TriggerFirebaseForChequeAlerts } from "@/lib/triggerFirebase";
import { AlertCircle, CreditCard, ShieldCheck } from "lucide-react";


export default function AddCheque({
  visible,
  onClose,
  saleID,
  customer_id,
  onRefresh,
} : {
  visible:boolean
  onClose : (val : boolean)=> void
  saleID : number | string
  customer_id ?: number
  onRefresh : ()=> Promise<void>
}) {
  const [total, setTotal] = useState<ChequeProp[]>([]);
  const [value, setValue] = useState<string>();
  const [errors, setErrors] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { state: OfficeState } = useContext(OfficeContext)!
  const { userID } = useUserDetail();

  async function handleSubmit() {
    setErrors(null);
    const newErrors = [];

    total.forEach((item, index) => {
      if (!item.date) newErrors.push(`Row ${index + 1}: Date is missing`);
      if (!item.amount) newErrors.push(`Row ${index + 1}: Amount is missing`);
      if (!item.img) newErrors.push(`Row ${index + 1}: Image is missing`);
    });

    if (newErrors.length > 0) {
      setErrors("ALL FIELDS REQUIRED");
      return;
    }

    setLoading(true);

    try {
      await Promise.all(
        total.map(async (item, idx) => {
          const name = `${
            OfficeState.value.data
          }/customer/${customer_id}/machine/${saleID}/installments/${moment()
            .valueOf()
            .toString()}_${idx}.png`;
          await UploadImage(item.img, name);
          return axios.post(`/${userID}/installments`, {
            date: item.date,
            image: name,
            amount: item.amount,
            sale_id: saleID,
          });
        })
      );
      onRefresh();
      TriggerFirebaseForChequeAlerts()
    } catch (error) {
      console.log(error);
      setErrors("Something went wrong while saving installments.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground md:max-w-3xl lg:max-w-6xl">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold text-foreground">
                  Credit Cheque
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Add installment dates, amounts, and cheque images.
                </DialogDescription>
              </div>
            </div>
            <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Upload required
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          <div className="space-y-3 p-3.5">
            <ChequeCredit
              setTotal={setTotal}
              setValue={setValue}
              total={total}
              value={value}
            />

            {errors && (
              <Label className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 shadow-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errors}
              </Label>
            )}
            <Button disabled={loading} onClick={handleSubmit} className="h-9 w-full rounded-lg">
              {loading && <Spinner />} Submit
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
