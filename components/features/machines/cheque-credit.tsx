import Dropzone from "@/components/shared/uploads/dropzone";
import { Dispatch, SetStateAction, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppCalendar from "@/components/features/calendar/app-calendar";
import { ChequeProp } from "@/lib/types";
import {
  Banknote,
  CalendarDays,
  ImageUp,
  ListChecks,
  ReceiptText,
} from "lucide-react";



const ChequeCredit = ({ total, value, setTotal, setValue }: { total: ChequeProp[], value: string | undefined, setTotal: Dispatch<SetStateAction<ChequeProp[]>>, setValue: Dispatch<SetStateAction<string | undefined>> }) => {
  useEffect(() => {
    if (Number(value) > 0) {
      setTotal(
        Array.from({ length: Number(value) }, () => ({
          date: undefined,
          amount: 0,
          img: "",
        }))
      );
    }
  }, [setTotal, value]);

  function handleUpdateData<K extends keyof ChequeProp>(
    val: ChequeProp[K],
    i: number,
    key: K
  ) {
    setTotal((prevState) => {
      const newState = [...prevState];
      newState[i][key] = val;
      return newState;
    });
  }

return (
    <div className="flex w-full flex-col gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ListChecks className="h-4 w-4 text-emerald-600" />
              Installment setup
            </div>
            <p className="text-xs font-medium text-slate-500">
              Select how many cheque entries you want to create.
            </p>
          </div>

          <div className="w-full md:max-w-xs">
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-normal text-slate-500">
              No. of Installments
            </Label>
            <Select onValueChange={setValue} value={value}>
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-slate-50/80 font-medium shadow-none">
                <SelectValue placeholder="Select installments" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {[...Array(20)].map((_, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {index + 1}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {total.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <ReceiptText className="h-5 w-5" />
          </div>
          <div className="mt-3 text-sm font-semibold text-slate-900">
            No installments selected
          </div>
          <p className="mt-1 max-w-sm text-xs font-medium text-slate-500">
            Choose the number of installments to prepare cheque details.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {total.map((item, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-3 py-3 sm:px-4">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <ReceiptText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-950">
                      Installment {index + 1}
                    </div>
                    <div className="text-xs font-medium text-slate-500">
                      Cheque detail
                    </div>
                  </div>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                  #{index + 1}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 p-3 sm:p-4 lg:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-normal text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Deposit date
                  </Label>
                  <AppCalendar
                    date={item.date}
                    onChange={(val) => handleUpdateData(val, index, "date")}
                    max={""}
                  />
                </div>

                <div className="flex min-w-0 flex-col gap-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-normal text-slate-500">
                    <Banknote className="h-3.5 w-3.5" />
                    Amount
                  </Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={item?.amount || ""}
                    className="h-11 w-full rounded-xl border-slate-200 bg-slate-50/80 shadow-none"
                    onChange={(e) => {
                      if (!isNaN(Number(e.target.value))) {
                        handleUpdateData(Number(e.target.value), index, "amount")
                      }
                    }}
                  />
                </div>

                <div className="flex min-w-0 flex-col gap-1.5 lg:col-span-2">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-normal text-slate-500">
                    <ImageUp className="h-3.5 w-3.5" />
                    Image
                  </Label>
                  <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 p-2">
                    <Dropzone
                      value={item.img}
                      onDrop={(file) => {
                        handleUpdateData(file, index, "img")
                      }}
                      title="Click to upload"
                      subheading="or drag and drop"
                      description="PNG or JPG"
                      drag="Drop the files here..."
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
};

export default ChequeCredit
