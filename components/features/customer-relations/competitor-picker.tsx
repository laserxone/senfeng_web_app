"use client";

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

export const OTHER_COMPETITOR = "__other_competitor__";

export function CompetitorPicker({
  competitors,
  value,
  onChange,
}: {
  competitors: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = value === OTHER_COMPETITOR ? "Other…" : value;

  function select(value: string) {
    onChange(value);
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="h-9 w-full justify-between rounded-lg font-normal"
        onClick={() => setOpen(true)}
      >
        <span className={label ? "truncate" : "text-muted-foreground"}>
          {label || "Select competitor"}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-[360px]">
          <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
            <DialogTitle className="text-sm font-semibold">
              Select Competitor
            </DialogTitle>
          </DialogHeader>
          <Command>
            <CommandInput placeholder="Search competitors..." />
            <CommandList>
              <CommandEmpty>No competitor found.</CommandEmpty>
              <CommandGroup>
                {competitors.map((item) => (
                  <CommandItem
                    key={item}
                    value={item}
                    onSelect={() => select(item)}
                  >
                    {item}
                    {value === item && <Check className="ml-auto size-4" />}
                  </CommandItem>
                ))}
                <CommandItem
                  value="Other"
                  onSelect={() => select(OTHER_COMPETITOR)}
                >
                  Other…
                  {value === OTHER_COMPETITOR && (
                    <Check className="ml-auto size-4" />
                  )}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
