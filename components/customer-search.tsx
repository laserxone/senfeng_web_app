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
import { MyCustomer } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

type LocalMyCustomer = MyCustomer & { value: number | string }

export function CustomerSearch({ value, onReturn }: { value: number | string | null | undefined, onReturn: (val: number | string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [customers, setCustomers] = React.useState<LocalMyCustomer[]>([]);
  const { userID, designation, office } = useUserDetail();
  const [city, setCity] = React.useState("lahore");


  React.useEffect(() => {
    async function fetchData() {
      const response = await axios.get<LocalMyCustomer[]>(
        `/${userID}/mycustomer`
      );

      const data = response.data;

      if (data.length > 0) {
        const apiData = data
          .filter((item) => {
            const hasValidName = item.name && item.name.trim() !== "";
            const hasValidOwner = item.owner && item.owner.trim() !== "";
            return hasValidName || hasValidOwner;
          })
          .map((item) => {
            const hasValidName = item?.name && item?.name?.trim() !== "";
            return {
              ...item,
              label: hasValidName
                ? item?.name?.trim()
                : `${item.owner?.trim() || ""} ${item.location?.trim() || ""
                  }`.trim(),
            };
          })
          .filter((item) => !!item.label)
          .sort((a, b) => (a.label || "").localeCompare(b.label || ""));

        const finalData = apiData.map((item) => {
          return { ...item, value: item.id, label: item.label };
        });
        setCustomers(finalData);
      }

    }
    if (userID) fetchData();
  }, [userID]);

  React.useEffect(() => {
    if (office) {
      if (designation === 'Sales') {
        setCity("")
      } else {
        setCity(office);
      }

    }
  }, [office, designation]);

  const filteredData = customers.filter((item) => item?.office?.includes(city));

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
          ? filteredData.find((item) => item?.value === value)?.label
          : "Select customer..."}
        <ChevronsUpDown className="opacity-50" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          {designation !== "Sales" && (
            <div className="flex items-center justify-center gap-2 px-2 py-1 border-b">
              <Label className="text-sm">Lahore</Label>
              <Switch
                checked={city === "karachi"}
                onCheckedChange={(checked) =>
                  setCity(checked ? "karachi" : "lahore")
                }
              />
              <Label className="text-sm">Karachi</Label>
            </div>
          )}
          <CommandInput placeholder="Search customer..." className="h-9" />
          <CommandList>
            <CommandEmpty>No customer found.</CommandEmpty>
            <CommandGroup>
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
