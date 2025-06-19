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

export function AvailableMachines({
  value,
  onReturn,
  placeholder = "Select machine...",

  onReturnItem = () => {},
}) {
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    async function fetchData() {
      axios.get(`/available-machines`).then((response) => {
        if (response.data.length > 0) {
          const apiData = response.data;

          // Step 1: Create labeled items
          let finalData = apiData.map((item) => ({
            ...item,
            baseLabel: `${item.machine_model} ${item.machine_power}W ${item.machine_source}`,
            value: item.id,
          }));

          // Step 2: Sort by label
          finalData = finalData.sort((a, b) =>
            a.baseLabel.localeCompare(b.baseLabel)
          );

          // Step 3: Count unique labels and assign color indexes
          const labelColorMap = new Map();
          const colorClasses = [
            "bg-red-100 text-red-800",
            "bg-blue-100 text-blue-800",
            "bg-green-100 text-green-800",
            "bg-yellow-100 text-yellow-800",
            "bg-purple-100 text-purple-800",
            "bg-pink-100 text-pink-800",
            "bg-indigo-100 text-indigo-800",
            "bg-teal-100 text-teal-800",
            "bg-orange-100 text-orange-800",
            "bg-gray-100 text-gray-800",
          ];

          let colorIndex = 0;

          finalData = finalData.map((item, index) => {
            const labelKey = item.baseLabel;
            if (!labelColorMap.has(labelKey)) {
              labelColorMap.set(
                labelKey,
                colorClasses[colorIndex % colorClasses.length]
              );
              colorIndex++;
            }

            const colorFlag = labelColorMap.get(labelKey);

            return {
              ...item,
              label: `${index + 1}-${item.baseLabel}`,
              colorFlag,
            };
          });

          setData(finalData);
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
          <CommandInput placeholder="Search machine..." className="h-9" />
          <CommandList>
            <CommandEmpty>No machine found.</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  className={item.colorFlag}
                  key={item.value}
                  value={item.label}
                  onSelect={() => {
                    onReturn(Number(item.value));
                    onReturnItem(item);
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
