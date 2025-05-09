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

export function UserSearch({
  value,
  onReturn,
  placeholder = "Select user...",
  lead = false,
}) {
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    async function fetchData() {
      axios.get(`/user`).then((response) => {
        if (response.data.length > 0) {
          if (lead) {
            const finalData = response.data
              .filter((item) => {
                if (item.id === 28 || item.id === 12 || item.id === 15)
                  return item;
              })
              .map((item) => {
                return { value: item.id, label: item?.name || item.email };
              });
            setData(finalData);
          } else {
            const finalData = response.data.map((item) => {
              return { value: item.id, label: item?.name || item.email };
            });
            setData(finalData);
          }
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
            ? data.find((item) => item.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="py-2 px-0">
        <Command>
          <CommandInput placeholder="Search user..." className="h-9" />
          <CommandList>
            <CommandEmpty>No user found.</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
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
