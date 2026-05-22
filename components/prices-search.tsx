"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { PricesProps, PricesSearchProps } from "@/lib/types";
import { cn } from "@/lib/utils";


export function PricesSearch({ value, onReturn }: { value: PricesSearchProps | null, onReturn: (val: PricesSearchProps) => void }) {
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState<PricesSearchProps[]>([]);
  const { userID, designation, office } = useUserDetail();
  const [city, setCity] = React.useState("lahore");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  const PAGE_SIZE = 20;

  React.useEffect(() => {
    async function fetchData() {
      axios.get(`/${userID}/prices`).then((response) => {
        if (response.data.length > 0) {

          const finalData = response.data.map((item: PricesProps) => {
            return {
              value: item.id,
              label: [item?.model, item.power].join(" "),
              data: item,
            };
          });
          setData(finalData)

        }
      });
    }
    if (userID) fetchData();
  }, [userID]);




  return (
    <>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        onClick={(e) => {
          e.preventDefault()
          setOpen(!open)
        }}
      >
        {value
          ? data.find((item) => item.value === value.value)?.label
          : "Select machine"}
        <ChevronsUpDown className="opacity-50" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>

          <CommandInput placeholder="Search machine..." className="h-9" />
          <CommandList>
            <CommandEmpty>No user found.</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => {
                    onReturn?.(item);
                    setOpen(false);
                  }}
                >
                  {item.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value?.value === item.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
