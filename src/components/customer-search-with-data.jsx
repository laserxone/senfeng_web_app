"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debounce";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

export function CustomerSearchWithData({ value, onReturn }) {
  const [open, setOpen] = React.useState(false);
  const [customers, setCustomers] = React.useState([]);
  const { userID, designation, office } = useUserDetail();
  const [search, setSearch] = React.useState("");
  const [city, setCity] = React.useState("lahore");

  React.useEffect(() => {
    async function fetchData() {
      const response = await axios.get(`/${userID}/mycustomer`);
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
                ? item.name.trim() + " " + numbers.join(" ")
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
              ...numbers, // safe now
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
      return customers.filter((item) => item?.office === city);
    return customers
      .filter((item) => item?.office === city)
      .filter((item) =>
        item.search.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
  }, [customers, debouncedSearch, city]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between overflow-hidden"
        >
          {value ? value?.label : "Select customer..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="py-2 px-0">
        <Command>
          {designation !== "Sales" && (
            <div className="flex items-center justify-center gap-2 px-2 py-1 border-b">
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
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer..."
            className="h-9 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <CommandList>
            <CommandEmpty>No customer found.</CommandEmpty>
            <CommandGroup>
              {filteredCustomers.map((item, index) => (
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
      </PopoverContent>
    </Popover>
  );
}
