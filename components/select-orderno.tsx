


"use client";

import { Check, ChevronLeft, ChevronRight, ChevronsUpDown, SearchIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/use-debounce";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { MyCustomer } from "@/lib/types";
import { cn } from "@/lib/utils";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

type OrderNoTypes = {
    id : number
    machine_serial : string
    search : string
    label : string
}

export function SelectOrderNo({ value, onReturn, onReturnData }: { value: string | null, onReturn?: (val: string) => void, onReturnData ?: (val : OrderNoTypes) => void }) {
    const [open, setOpen] = React.useState(false);
    const [data, setData] = React.useState<OrderNoTypes[]>([])
    const [search, setSearch] = React.useState("");
    const [page, setPage] = React.useState(1);
    const { userID } = useUserDetail()

    const PAGE_SIZE = 20;

    React.useEffect(() => {
        setPage(1);
    }, [data]);

    React.useEffect(() => {
        async function fetchData() {
            try {

                const response = await axios.get(`/${userID}/delivery/orderno`);
                setData(response.data.map((item : OrderNoTypes)=>({...item, search : item.machine_serial, label : item.machine_serial})))
            } finally {

            }
        }
        if (userID) fetchData();
    }, [userID]);

    const debouncedSearch = useDebounce(search, 500);

    const filteredData = React.useMemo(() => {
        if (!debouncedSearch)
            return data
        return data
            .filter((item) =>
                item?.machine_serial?.toLowerCase().includes(debouncedSearch.toLowerCase())
            );
    }, [data, debouncedSearch]);

    const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

    const paginatedData = filteredData.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );

    return (
        <>
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between overflow-hidden"
                onClick={(e) => {
                    e.preventDefault()
                    setOpen(!open)
                }}
            >
                {value ? filteredData.find((item) => item?.machine_serial === value)?.label : "Select Order No..."}
                <ChevronsUpDown className="opacity-50" />
            </Button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <Command>
                    <div className="flex justify-between px-2 py-1 border-b">
                      
                        <div className="flex items-center justify-between gap-2">

                            <Button
                                size="icon"
                                variant="outline"
                                disabled={page === 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                <ChevronLeft />
                            </Button>

                            <span className="text-xs text-muted-foreground">
                                {page} / {totalPages || 1}
                            </span>

                            <Button
                                size="icon"
                                variant="outline"
                                disabled={page === totalPages || totalPages === 0}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            >
                                <ChevronRight />
                            </Button>
                        </div>
                    </div>

                    <div className="p-1 pb-0">
                        <InputGroup className="h-8! rounded-lg! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:pl-2!">
                            <InputGroupInput id="inline-start-input" placeholder="Select Order No..." value={search}
                                onChange={(e) => setSearch(e.target.value)} className="text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50" />
                            <InputGroupAddon align="inline-start">
                                <SearchIcon className="size-4 shrink-0 opacity-50" />
                            </InputGroupAddon>
                        </InputGroup>
                    </div>
                    <CommandList>
                        <CommandEmpty>No Order NOs found.</CommandEmpty>
                        <CommandGroup>
                            {paginatedData.map((item, index) => (
                                <CommandItem
                                    key={index}
                                    value={item.search}
                                    onSelect={() => {
                                        onReturn?.(item.machine_serial)
                                        onReturnData?.(item)
                                        setOpen(false);
                                    }}
                                >
                                    <span>{item.label}</span>
                                    <Check
                                        className={cn(
                                            "ml-auto",
                                            value === item.machine_serial ? "opacity-100" : "opacity-0"
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
