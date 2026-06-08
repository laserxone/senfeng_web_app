import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContext, useEffect, useState } from "react";
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
    } catch (error) {
      console.log(error);
      setErrors("Something went wrong while saving installments.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-max min-w-[40vw]">
        <DialogHeader>
          <DialogTitle>Credit Cheque</DialogTitle>
        </DialogHeader>

        <ScrollArea className="px-2 h-[80vh] ">
          <ChequeCredit
            setTotal={setTotal}
            setValue={setValue}
            total={total}
            value={value}
          />

          {errors && (
            <Label className="text-sm md:text-base font-medium text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2 inline-block shadow-sm">
              {errors}
            </Label>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button disabled={loading} onClick={handleSubmit}>
            {loading && <Spinner />} Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
