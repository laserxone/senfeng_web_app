"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { StockProps } from "@/lib/types"

type InventoryProp = Partial<StockProps>

export function InventorySearch({
  value,
  onReturn,
  data,
}: {
  value: number | null
  onReturn: (val: InventoryProp) => void
  data: InventoryProp[]
}) {
  const [open, setOpen] = React.useState(false)

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
          ? data.find((item) => item.id === value)?.name
          : "Select item..."}
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
                  value={item.name}
                  onSelect={() => {
                    onReturn(item)
                    setOpen(false)
                  }}
                >
                  {item.name}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === item.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
