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
import { StockProps } from "@/lib/types";
import { cn } from "@/lib/utils";

type InventoryProp = Partial<StockProps>;

export function InventorySearch({
  value,
  onReturn,
  data,
  showQty = false,
}: {
  value: number | null;
  onReturn: (val: InventoryProp) => void;
  data: InventoryProp[];
  showQty?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const selectedItem = data.find((item) => item.id === value);
  const itemName = (item: InventoryProp) => item.name ?? "Unnamed item";
  const itemSearchValue = (item: InventoryProp) =>
    `${itemName(item)}${showQty ? ` available ${item.qty ?? 0}` : ""}`;


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
        {selectedItem ? (
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate">{itemName(selectedItem)}</span>
            {showQty && (
              <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                Available: {selectedItem.qty ?? 0}
              </span>
            )}
          </span>
        ) : (
          "Select item..."
        )}

        <ChevronsUpDown className="opacity-50" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Search item..." className="h-9" />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {data.map((item, index) => (
                <CommandItem
                  key={index}
                  value={itemSearchValue(item)}
                  onSelect={() => {
                    onReturn(item);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 flex-1 truncate">{itemName(item)}</span>
                  {showQty && (
                    <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      Available: {item.qty ?? 0}
                    </span>
                  )}
                  <Check
                    className={cn(
                      "ml-2 shrink-0",
                      value === item.id ? "opacity-100" : "opacity-0",
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
