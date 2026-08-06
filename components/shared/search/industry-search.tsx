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
import { cn } from "@/lib/utils";

export function IndustrySearch({
  value,
  onReturn,
}: {
  value: string | undefined;
  onReturn: (val: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState<{ value: string; label: string }[]>(
    [],
  );
  const { userID } = useUserDetail();

  React.useEffect(() => {
    if (userID) {
      axios.get(`/${userID}/settings`).then((response) => {
        const list = response.data.industry_list.map((item: string) => {
          return { value: item, label: item };
        });
        setData([...list]);
      });
    }
  }, [userID]);

  return (
    <>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        onClick={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
      >
        {value
          ? data.find((item) => item.value === value)?.label
          : "Select industry..."}
        <ChevronsUpDown className="opacity-50" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Search industry..." className="h-9" />
          <CommandList>
            <CommandEmpty>No industry found.</CommandEmpty>
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
                      value === item.value ? "opacity-100" : "opacity-0",
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
