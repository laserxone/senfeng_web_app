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

export function MachineSearch({ value, onReturn }) {
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    async function fetchData() {
      axios.get(`/pos?availablemachine=true`).then((response) => {
        const apiData = response.data.map((item) => {
          return {
            ...item,
            label: item.machine_serial,
            search: `${item.id}-${item.machine_model} ${item.machine_power} ${item.machine_source}`,
          };
        });
        setData(apiData);
      });
    }
    fetchData();
    return () => {
      setData([]);
    };
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
          {value ? value?.search : "Select machine..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="py-2 px-0">
        <Command>
          <CommandInput placeholder="Search machine..." className="h-9" />
          <CommandList>
            <CommandEmpty>No machines found.</CommandEmpty>
            <CommandGroup>
              {data.map((item, index) => (
                <CommandItem
                  key={item.id}
                  value={item.search}
                  onSelect={() => {
                    onReturn(item);
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
