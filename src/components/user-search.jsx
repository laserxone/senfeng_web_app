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
import axios from "@/lib/axios";
import { cn } from "@/lib/utils";
import { UserContext } from "@/store/context/UserContext";

export function UserSearch({
  value,
  onReturn,
  placeholder = "Select user...",
  lead = false,
  className = "",
  remove = false,
  onReturnName = () => {},
  onReturnData = () => {},
}) {
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState([]);
  const { state: UserState } = React.useContext(UserContext);

  React.useEffect(() => {
    async function fetchData() {
      axios.get(`/${UserState.value.data?.id}/user?withoutleave=true`).then((response) => {
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
              setData(
                finalData.filter(
                  (item) => item.value !== UserState.value.data?.id
                )
              );
            } else {
              setData(finalData);
            }
          } else {
            const finalData = response.data.map((item) => {
              return { value: item.id, label: item?.name || item.email };
            });
             if (remove) {
              setData(
                finalData.filter(
                  (item) => item.value !== UserState.value.data?.id
                )
              );
            } else {
              setData(finalData);
            }
          }
        }
      });
    }
    fetchData();
  }, []);

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
            <CommandInput placeholder="Search user..." className="h-9" />
            <CommandList>
              <CommandEmpty>No user found.</CommandEmpty>
              <CommandGroup>
                {data.map((item) => (
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
