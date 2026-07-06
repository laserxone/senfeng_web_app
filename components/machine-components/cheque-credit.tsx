import Dropzone from "@/components/dropzone";
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
import AppCalendar from "@/components/app-calendar";
import { ChequeProp } from "@/lib/types";



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
  }, [value]);

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
    <div className="flex w-full flex-col gap-4 p-1 sm:p-4 overflow-hidden">
      <div className="flex flex-col gap-2">
        <Label>No. of Installments</Label>
        <Select onValueChange={setValue} value={value}>
          <SelectTrigger className="w-full">
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

      <div className="flex flex-col gap-4">
        {total.map((item, index) => (
          <div
            key={index}
            className="rounded-lg border p-3 sm:p-4"
          >
            <div className="mb-3 text-sm font-medium text-muted-foreground">
              Installment {index + 1}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex min-w-0 flex-col gap-1">
                <Label>Deposit date</Label>
                <AppCalendar
                  date={item.date}
                  onChange={(val) => handleUpdateData(val, index, "date")}
                  max={""}
                />
              </div>

              <div className="flex min-w-0 flex-col gap-1">
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={item?.amount || ""}
                  className="w-full"
                  onChange={(e) => {
                    if (!isNaN(Number(e.target.value))) {
                      handleUpdateData(Number(e.target.value), index, "amount")
                    }
                  }}
                />
              </div>

              <div className="flex min-w-0 flex-col gap-1">
                <Label>Image</Label>
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
        ))}
      </div>
    </div>
  )
};

export default ChequeCredit