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
import AppCalendar from "@/components/appCalendar";
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
    <div className="flex flex-col gap-2 flex-1 p-4 w-full">
      <Label>No. of Installments</Label>
      <Select onValueChange={setValue} value={value}>
        <SelectTrigger>
          <SelectValue placeholder="Select installments" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {[...Array(20)].map((_, index) => {
              return (
                <SelectItem key={index} value={(index + 1).toString()}>
                  {index + 1}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>

      {total.map((item, index) => (
        <div
          key={index}
          className="flex flex-row gap-4 items-start p-2 border-b"
        >
          {/* Date */}
          <div className="flex flex-col gap-1">
            <Label>Deposit date</Label>
            <AppCalendar
              date={item.date}
              onChange={(val) => handleUpdateData(val, index, "date")}
            />
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1">
            <Label>Amount</Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={item?.amount || ""}
              onChange={(e) => {
                if (!isNaN(Number(e.target.value))) {
                  handleUpdateData(Number(e.target.value), index, "amount");
                }
              }}
            />
          </div>

          {/* Image */}
          <div className="flex flex-col gap-1">
            <Label>Image</Label>
            <Dropzone
              value={item.img}
              onDrop={(file) => {
                handleUpdateData(file, index, "img");
              }}
              title={"Click to upload"}
              subheading={"or drag and drop"}
              description={"PNG or JPG"}
              drag={"Drop the files here..."}
            />
          </div>
        </div>
      ))}

    </div>
  );
};

export default ChequeCredit