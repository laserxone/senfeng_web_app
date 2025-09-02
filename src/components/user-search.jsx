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
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

export function UserSearch({
  value,
  onReturn,
  placeholder = "Select user...",
  lead = false,
  className = "",
  remove = false,
  onReturnName = () => { },
  onReturnData = () => { },
}) {
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState([]);
  const [city, setCity] = React.useState("lahore");
  const { userID, designation, office } = useUserDetail();

  React.useEffect(() => {
    async function fetchData() {
      axios.get(`/${userID}/user?withoutleave=true`).then((response) => {
        if (response.data.length > 0) {
          if (lead) {
            const finalData = response.data
              .filter((item) => {
                if (
                  item.designation === "Customer Relationship Manager" ||
                  item.designation === "Owner" ||
                  item.designation === "Social Media Manager"
                )
                  return item;
              })
              .map((item) => {
                return {
                  value: item.id,
                  label: item?.name || item.email,
                  data: item,
                };
              });
            if (remove) {
              setData(finalData.filter((item) => item.value !== userID));
            } else {
              setData(finalData);
            }
          } else {
            const finalData = response.data.map((item) => {
              return {
                value: item.id,
                label: item?.name || item.email,
                data: item,
              };
            });
            if (remove) {
              setData(finalData.filter((item) => item.value !== userID));
            } else {
              setData(finalData);
            }
          }
        }
      });
    }
    if (userID)
      fetchData();
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

  const filteredData = data.filter((item) => item?.data?.office === city);

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
              ? filteredData.find((item) => item.value === value)?.label
              : placeholder}
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
            <CommandInput placeholder="Search user..." className="h-9" />
            <CommandList>
              <CommandEmpty>No user found.</CommandEmpty>
              <CommandGroup>
                {filteredData.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.label}
                    onSelect={() => {
                      onReturn(Number(item.value));
                      onReturnName(item.label);
                      if (lead) {
                        onReturnData(item.data);
                      }
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
