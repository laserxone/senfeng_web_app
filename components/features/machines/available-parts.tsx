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
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { cn } from "@/lib/utils";

export type AvailablePart = {
  id: number;
  name: string;
  machine_serial: string | null;
  machine_power: string | null;
  machine_model: string | null;
  order_id: number;
  location: string | null;
  order_title: string | null;
  available_qty: number;
};

export function AvailableParts({
  value,
  onReturn,
}: {
  value: number | null;
  onReturn: (part: AvailablePart) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState<AvailablePart[]>([]);
  const { userID } = useUserDetail();

  React.useEffect(() => {
    if (!userID) return;

    axios
      .get(`/${userID}/available-parts`)
      .then((response: { data: AvailablePart[] }) => setData(response.data));
  }, [userID]);

  const selected = data.find((part) => part.id === value);

  return (
    <>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        onClick={(event) => {
          event.preventDefault();
          setOpen((current) => !current);
        }}
      >
        {selected
          ? `${selected.name} - ${selected.machine_model ?? ""} - ${selected.machine_power ?? ""}`
          : "Select part..."}
        <ChevronsUpDown className="opacity-50" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Search parts..." className="h-9" />
          <CommandList>
            <CommandEmpty>No part found.</CommandEmpty>
            <CommandGroup>
              {data.map((part) => (
                <CommandItem
                  key={part.id}
                  value={`${part.name} ${part.machine_model ?? ""} ${part.machine_power ?? ""}`}
                  onSelect={() => {
                    onReturn(part);
                    setOpen(false);
                  }}
                >
                  <span>
                    {part.name} - {part.machine_model ?? "—"} -{" "}
                    {part.machine_power ?? "—"}
                  </span>
                  <Check
                    className={cn(
                      "ml-auto",
                      value === part.id ? "opacity-100" : "opacity-0",
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
