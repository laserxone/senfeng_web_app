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
import { PakCities } from "@/constants/data";
import { cn } from "@/lib/utils";

export function CitiesSearch({ value, onReturn }: { value: string, onReturn: (val: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [data] = React.useState(
    PakCities.map((item) => {
      return { value: item.name, label: item.name };
    })
  );

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
          ? data.find((item) => item.value === value)?.label
          : "Select city..."}
        <ChevronsUpDown className="opacity-50" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>


        <Command>
          <CommandInput placeholder="Search city..." className="h-9" />
          <CommandList>
            <CommandEmpty>No city found.</CommandEmpty>
            <CommandGroup>
              {data.map((item, index) => (
                <CommandItem
                  key={index}
                  value={item.label}
                  onSelect={() => {
                    onReturn(item.value);
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
