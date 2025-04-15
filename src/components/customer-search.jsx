"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BASE_URL } from "@/constants/data";
import { cn } from "@/lib/utils";
import axios from "@/lib/axios";

export function CustomerSearch({ value, onReturn }) {
  const [open, setOpen] = React.useState(false);
  const [customers, setCustomers] = React.useState([]);
 

  React.useEffect(() => {
    async function fetchData() {
      axios.get(`/customer?withoutsale=true`).then((response) => {
        if (response.data.length > 0) {
          const apiData = response.data.sort((a, b) =>
            a?.name.localeCompare(b?.name || "")
          );
          const finalData = apiData.map((item) => {
            return { value: item.id, label: item.name || item.owner };
          });
          setCustomers(finalData);
        }
      });
    }
    fetchData();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? customers.find((item) => item.value === value)?.label
            : "Select customer..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="py-2 px-0">
        <Command>
          <CommandInput  placeholder="Search customer..." className="h-9" />
          <CommandList >
            <CommandEmpty>No customer found.</CommandEmpty>
            <CommandGroup>
              {customers.map((item) => (
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
      </PopoverContent>
    </Popover>
  );
}
