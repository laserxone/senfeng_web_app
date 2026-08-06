"use client";

import { ChevronsUpDown } from "lucide-react";
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
import { CountriesList } from "@/constants/data";

type CountriesType = {
  flag: string;
  name: string;
  code: string;
  num: string;
};

export function NumberSearch({
  value,
  onReturn,
}: {
  value: string;
  onReturn: (val: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [numbers, setNumbers] = React.useState<CountriesType[]>([]);
  React.useEffect(() => {
    if (CountriesList) {
      setNumbers(CountriesList);
    }
  }, [CountriesList]);

  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        {numbers.length > 0 && value
          ? (numbers.find((some) => some.num === value)?.num ??
            "Select country...")
          : "Select country..."}
        <ChevronsUpDown className="opacity-50" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
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
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}
