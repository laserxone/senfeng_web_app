"use client";

import { Check, ChevronsUpDown, SearchIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/use-debounce";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { cn } from "@/lib/utils";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import Spinner from "@/components/ui/spinner";


type BackupInventoryType = {
  id: number
  name: string
  serial_no: string
  power: string
  size: string

}

type DataTypes = BackupInventoryType & {
  label: string
  value: number
}

export function BackupInventory({
  value,
  onReturn,
}: { value: number | null, onReturn: (val: number) => void, }) {
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState<DataTypes[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const { userID } = useUserDetail();

  React.useEffect(() => {
    let active = true;

    async function fetchData() {
      setLoading(true);
      setData([]);

      try {
        const response = await axios.get(`/${userID}/backup-inventory`)
        const data: BackupInventoryType[] = response.data;

        const apiData = data
          .map((item, index) => {

            return {
              ...item,
              label: `${index + 1}- ${item.serial_no ?? ""} ${item.power ?? ""} ${item.size ?? ""}`,
              value: item.id,
            };
          })



        if (active) setData(apiData);
      } catch (error) {
        if (active) setData([]);
      } finally {
        if (active) setLoading(false);
      }

    }
    if (userID) {
      fetchData();
    } else {
      setData([]);
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [userID]);



  const debouncedSearch = useDebounce(search, 500)

  const filteredData = data.filter((item) => {


    const matchesSearch =
      item?.label?.toLowerCase().includes(debouncedSearch.toLowerCase())

    return matchesSearch;
  });

  return (
    <>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        disabled={loading}
        onClick={(e) => {
          e.preventDefault()
          setOpen(!open)
        }}
      >
        {value
          ? filteredData.find((item) => item.value === value)?.label
          : "Select item..."}
        {loading ? <Spinner className="ml-2 size-4" /> : <ChevronsUpDown className="opacity-50" />}
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <div className="p-1 pb-0">
            <InputGroup className="h-8! rounded-lg! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:pl-2!">
              <InputGroupInput id="inline-start-input" placeholder="Search item..." value={search}
                onChange={(e) => setSearch(e.target.value)} className="text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50" />
              <InputGroupAddon align="inline-start">
                <SearchIcon className="size-4 shrink-0 opacity-50" />
              </InputGroupAddon>
            </InputGroup>
          </div>
          <CommandList>
            <CommandEmpty>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner className="size-4" />
                  Loading items...
                </span>
              ) : (
                "No item found."
              )}
            </CommandEmpty>
            <CommandGroup className="flex-1">
              {filteredData.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => {
                    onReturn(Number(item.value));
                    setOpen(false);
                  }}
                >
                  {item.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === item.value ? "opacity-100" : "opacity-0"
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
