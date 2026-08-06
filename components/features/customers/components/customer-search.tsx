"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  SearchIcon,
} from "lucide-react";
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
  CommandSeparator,
} from "@/components/ui/command";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { MyCustomer } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useDebounce } from "@/hooks/use-debounce";

type LocalMyCustomer = MyCustomer & { value: number | string };

export function CustomerSearch({
  value,
  onReturn,
}: {
  value: number | string | null | undefined;
  onReturn: (val: number | string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [customers, setCustomers] = React.useState<LocalMyCustomer[]>([]);
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
      const response = await axios.get<LocalMyCustomer[]>(
        `/${userID}/mycustomer`,
      );

      const data = response.data;

      if (data.length > 0) {
        const apiData = data
          .filter((item) => {
            const hasValidName = item.name && item.name.trim() !== "";
            const hasValidOwner = item.owner && item.owner.trim() !== "";
            return hasValidName || hasValidOwner;
          })
          .map((item) => {
            const hasValidName = item?.name && item?.name?.trim() !== "";
            return {
              ...item,
              label: hasValidName
                ? item?.name?.trim()
                : `${item.owner?.trim() || ""} ${
                    item.location?.trim() || ""
                  }`.trim(),
            };
          })
          .filter((item) => !!item.label)
          .sort((a, b) => (a.label || "").localeCompare(b.label || ""));

        const finalData = apiData.map((item) => {
          return { ...item, value: item.id, label: item.label };
        });
        setCustomers(finalData);
      }
    }
    if (userID) fetchData();
  }, [userID]);

  React.useEffect(() => {
    if (office) {
      if (designation === "Sales") {
        setCity("");
      } else {
        setCity(office);
      }
    }
  }, [office, designation]);

  const debouncedSearch = useDebounce(search, 500);

  const filteredData = customers.filter((item) => {
    const matchesCity = item?.office?.includes(city);

    const matchesSearch =
      item?.label?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      item?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      item?.owner?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      item?.location?.toLowerCase().includes(debouncedSearch.toLowerCase());

    return matchesCity && matchesSearch;
  });

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  const paginatedData = filteredData.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between truncate"
        onClick={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
      >
        {value
          ? filteredData.find((item) => item?.value === value)?.label
          : "Select customer..."}
        <ChevronsUpDown className="opacity-50" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <div className="flex justify-between border-b px-2 py-1">
            {designation !== "Sales" && (
              <div className="flex items-center gap-2 px-2 py-1">
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
              <InputGroupInput
                id="inline-start-input"
                placeholder="Search customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
              />
              <InputGroupAddon align="inline-start">
                <SearchIcon className="size-4 shrink-0 opacity-50" />
              </InputGroupAddon>
            </InputGroup>
          </div>
          <CommandList>
            <CommandEmpty>No customer found.</CommandEmpty>
            <CommandGroup className="flex-1">
              {paginatedData.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => {
                    onReturn(Number(item.value));
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
