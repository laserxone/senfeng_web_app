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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

export function CustomerSearchWithData({ value, onReturn }: { value: MyCustomer | null, onReturn: (val: MyCustomer) => void }) {
  const [open, setOpen] = React.useState(false);
  const [customers, setCustomers] = React.useState<MyCustomer[]>([]);
  const { userID, designation, office } = useUserDetail();
  const [city, setCity] = React.useState("lahore");
   const [search, setSearch] = React.useState("");
    const [page, setPage] = React.useState(1);
  
    const PAGE_SIZE = 20;
  
    React.useEffect(() => {
      setPage(1);
    }, [city, customers]);
  
  React.useEffect(() => {
    async function fetchData() {
      const response: { data: MyCustomer[] } = await axios.get(`/${userID}/mycustomer`);
      if (response.data.length > 0) {
        const apiData = response.data
          .filter((item) => {
            const hasValidName = item.name && item.name.trim() !== "";
            const hasValidOwner = item.owner && item.owner.trim() !== "";
            return hasValidName || hasValidOwner;
          })
          .map((item) => {
            const hasValidName = item.name && item.name.trim() !== "";

            // normalize numbers: always an array
            const numbers = Array.isArray(item.number)
              ? item.number
              : item.number
                ? [item.number]
                : [];

            return {
              ...item,
              label: hasValidName
                ? item?.name?.trim() + " " + numbers.join(" ")
                : `${item.owner?.trim() || ""} ${item.location?.trim() || ""
                  }`.trim() +
                " " +
                numbers.join(" "),
            };
          })
          .filter((item) => !!item.label)
          .sort((a, b) => a.label.localeCompare(b.label));

        const finalData = apiData.map((item) => {
          const numbers = Array.isArray(item.number)
            ? item.number
            : item.number
              ? [item.number]
              : [];
          return {
            ...item,
            search: [
              item.name,
              item.owner,
              item.location,
              ...numbers
            ]
              .filter(Boolean)
              .join(" ")
              .trim(),
          };
        });

        setCustomers(finalData);
      }
    }
    if (userID) fetchData();
  }, [userID]);

  React.useEffect(() => {
    if (office) {
      if (designation === 'Sales') {
        setCity("")
      } else {
        setCity(office);
      }

    }
  }, [office, designation]);

  const debouncedSearch = useDebounce(search, 500);

  const filteredCustomers = React.useMemo(() => {
    if (!debouncedSearch)
      return customers.filter((item) => item?.office?.includes(city));
    return customers
      .filter((item) => item?.office?.includes(city))
      .filter((item) =>
        item?.search?.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
  }, [customers, debouncedSearch, city]);

   const totalPages = Math.ceil(filteredCustomers.length / PAGE_SIZE);

  const paginatedData = filteredCustomers.slice(
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
        {value ? value?.label : "Select customer..."}
        <ChevronsUpDown className="opacity-50" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
         <div className="flex justify-between px-2 py-1 border-b">
            {designation !== "Sales" && (
              <div className="flex items-center gap-2 px-2 py-1 ">
                <Label className="text-sm">Lahore</Label>
                <Switch
                  checked={city === "karachi"}
                  onCheckedChange={(checked) =>
                    setCity(checked ? "karachi" : "lahore")
                  }
                />
                <Label className="text-sm">Karachi</Label>
              </div>
            )}
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
              <InputGroupInput id="inline-start-input" placeholder="Search customer..." value={search}
                onChange={(e) => setSearch(e.target.value)} className="text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50" />
              <InputGroupAddon align="inline-start">
                <SearchIcon className="size-4 shrink-0 opacity-50" />
              </InputGroupAddon>
            </InputGroup>
          </div>
          <CommandList>
            <CommandEmpty>No customer found.</CommandEmpty>
            <CommandGroup>
              {paginatedData.map((item, index) => (
                <CommandItem
                  key={index}
                  value={item.search}
                  onSelect={() => {
                    onReturn(item);
                    setOpen(false);
                  }}
                >
                  <span>{item.label}</span>
                  <Check
                    className={cn(
                      "ml-auto",
                      value?.id === item.id ? "opacity-100" : "opacity-0"
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
