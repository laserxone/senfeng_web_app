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
import { UserContext } from "@/store/context/UserContext";

export function CustomerSearchWithData({ value, onReturn }) {
  const [open, setOpen] = React.useState(false);
  const [customers, setCustomers] = React.useState([]);
  const {state : UserState} = React.useContext(UserContext)

  React.useEffect(() => {
    async function fetchData() {
      const response = await axios.get(`/${UserState.value.data?.id}/mycustomer`);
      if (response.data.length > 0) {
        const apiData = response.data
          .filter((item) => {
            // Check if there's at least a valid name or a valid owner
            const hasValidName = item.name && item.name.trim() !== "";
            const hasValidOwner = item.owner && item.owner.trim() !== "";
            return hasValidName || hasValidOwner;
          })
          .map((item) => {
            const hasValidName = item.name && item.name.trim() !== "";
            return {
              ...item,
              label: hasValidName
                ? item.name.trim()
                : `${item.owner?.trim() || ""} ${
                    item.location?.trim() || ""
                  }`.trim(),
            };
          })
          .filter((item) => !!item.label) 
          .sort((a, b) => a.label.localeCompare(b.label));

        const finalData = apiData.map((item) => {
          return { ...item, search: item.label };
        });

        setCustomers(finalData);
      }
    }
    if(UserState.value.data?.id)
    fetchData();
  }, [UserState]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? value?.search : "Select customer..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="py-2 px-0">
        <Command>
          <CommandInput placeholder="Search customer..." className="h-9" />
          <CommandList>
            <CommandEmpty>No customer found.</CommandEmpty>
            <CommandGroup>
              {customers.map((item, index) => (
                <CommandItem
                  key={index}
                  value={item.search}
                  onSelect={() => {
                    onReturn(item); // return full object
                    setOpen(false);
                  }}
                >
                  {item.search}
                  <Check
                    className={cn(
                      "ml-auto",
                      value?.id === item.id ? "opacity-100" : "opacity-0"
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
