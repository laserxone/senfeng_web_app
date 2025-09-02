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
import { cn } from "@/lib/utils";

export default function StockSearch({
    value,
    onReturn,
    placeholder = "Select item...",
    className = "",
    onReturnData = () => { },
    passingData
}) {
    const [open, setOpen] = React.useState(false);

    const data = passingData.map((item) => ({ ...item, value: item.id, label: item.name }))


    return (
        <div className={className}>
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

                        <CommandInput placeholder="Search item..." className="h-9" />
                        <CommandList>
                            <CommandEmpty>No stock found.</CommandEmpty>
                            <CommandGroup>
                                {data.map((item) => (
                                    <CommandItem
                                        key={item.value}
                                        value={item.label}
                                        onSelect={() => {
                                            onReturn(Number(item.value));
                                            onReturnData(item);
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
        </div>
    );
}
