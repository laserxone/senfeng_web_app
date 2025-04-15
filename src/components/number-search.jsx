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
import { BASE_URL, CountriesList } from "@/constants/data";
import { cn } from "@/lib/utils";
import axios from "@/lib/axios";

export function NumberSearch  ({ value, onReturn }) {
  const [open, setOpen] = React.useState(false);
  const [numbers, setNumbers] = React.useState(CountriesList);

  

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? numbers.find((some)=>some.num === value).num : "Select country..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="py-2 px-0">
        <Command>
          <CommandInput placeholder="Search country..." className="h-9" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {numbers.map((item) => (
                <CommandItem
                  key={item.name}
                  value={item.num + item.name}
                  onSelect={() => {
                    onReturn(item.num); // return full object
                    setOpen(false);
                  }}
                >
                  {item.name} {item.num}
                  <Check
                    className={cn(
                      "ml-auto",
                      value?.num === item.num ? "opacity-100" : "opacity-0"
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
