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
import axios from "@/lib/axios";
import { cn } from "@/lib/utils";
import { UserContext } from "@/store/context/UserContext";
export function CustomerSearch({ value, onReturn }) {
  const [open, setOpen] = React.useState(false);
  const [customers, setCustomers] = React.useState([]);
  const { state: UserState } = React.useContext(UserContext);

  React.useEffect(() => {
    async function fetchData() {
      axios
        .get(`/${UserState.value.data?.id}/mycustomer`)
        .then((response) => {
          if (response.data.length > 0) {
            const apiData = response.data
              .filter((item) => {
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
              return { value: item.id, label: item.label };
            });
            setCustomers(finalData);
          }
        });
    }
    if (UserState.value.data?.id) fetchData();
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
          {value
            ? customers.find((item) => item.value === value)?.label
            : "Select customer..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="py-2 px-0">
        <Command>
          <CommandInput placeholder="Search customer..." className="h-9" />
          <CommandList>
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
