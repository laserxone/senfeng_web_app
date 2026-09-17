"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AppTable from "@/components/shared/tables/app-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { ArrowUpDown, Box, Boxes, Eye, Hash, MapPin } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";

type Machine = {
  id: number;
  order_id: number | null;
  order_title: string | null;
  name: string | null;
  machine_model: string | null;
  machine_source: string | null;
  machine_power: string | null;
  machine_serial: string | null;
  location: string | null;
};

type MachineGroup = {
  key: string;
  name: string;
  model: string;
  power: string;
  source: string;
  location: string;
  searchText: string;
  machines: Machine[];
};

const readable = (value: string | null | undefined, fallback = "—") =>
  value?.trim() || fallback;

export default function MachinesAvailablePage() {
  const { userID } = useUserDetail();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [warehouse, setWarehouse] = useState("all");
  const [selected, setSelected] = useState<MachineGroup | null>(null);

  useEffect(() => {
    if (!userID) return;
    setLoading(true);
    axios
      .get(`/${userID}/available-machines?location=${warehouse}`)
      .then((response) => setMachines(response.data || []))
      .finally(() => setLoading(false));
  }, [userID, warehouse]);

  const groups = useMemo<MachineGroup[]>(() => {
    const grouped = new Map<string, MachineGroup>();
    for (const machine of machines) {
      const name = readable(
        machine.name,
        readable(machine.machine_source, "Machine"),
      );
      const model = readable(machine.machine_model);
      const power = readable(machine.machine_power);
      const source = readable(machine.machine_source);
      const location = readable(machine.location);
      const key = [model, power].join("|").toLowerCase();
      const current = grouped.get(key);
      if (current) {
        current.machines.push(machine);
        const locations = new Set([
          ...current.machines.map((item) => readable(item.location)),
        ]);
        current.location = [...locations].join(", ");
        current.searchText = [
          current.name,
          current.model,
          current.power,
          current.source,
          current.location,
          ...current.machines.map((item) => item.machine_serial || ""),
        ].join(" ");
      } else
        grouped.set(key, {
          key,
          name,
          model,
          power,
          source,
          location,
          searchText: [
            name,
            model,
            power,
            source,
            location,
            machine.machine_serial || "",
          ].join(" "),
          machines: [machine],
        });
    }
    return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [machines]);

  const columns = useMemo<ColumnDef<MachineGroup>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column} label="Machine" />
        ),
      },
      {
        accessorKey: "model",
        header: ({ column }) => (
          <SortableHeader column={column} label="Model" />
        ),
      },
      {
        accessorKey: "power",
        header: ({ column }) => (
          <SortableHeader column={column} label="Power" />
        ),
      },
      {
        accessorKey: "source",
        header: ({ column }) => (
          <SortableHeader column={column} label="Source" />
        ),
      },
      {
        id: "units",
        header: ({ column }) => (
          <SortableHeader column={column} label="Units" />
        ),
        accessorFn: (group) => group.machines.length,
        cell: ({ row }) => (
          <span className="font-semibold text-primary">
            {row.original.machines.length}
          </span>
        ),
      },
      {
        accessorKey: "location",
        header: ({ column }) => (
          <SortableHeader column={column} label="Location" />
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg"
            onClick={() => setSelected(row.original)}
          >
            <Eye className="size-3.5" />
            View details
          </Button>
        ),
      },
    ],
    [],
  );

  const locationLabel =
    warehouse === "all"
      ? "All warehouses"
      : `${warehouse.charAt(0).toUpperCase()}${warehouse.slice(1)} warehouse`;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 py-2">
      <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Boxes className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Machines Available
              </h1>
              <p className="text-sm text-muted-foreground">
                Live inventory from unbooked machines in {locationLabel}.
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="w-fit gap-1.5 px-3 py-1.5 font-medium"
          >
            <MapPin className="size-3.5" />
            {locationLabel}
          </Badge>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Stat
            icon={Box}
            label="Machine types"
            value={groups.length}
            description="Models currently available"
          />
          <Stat
            icon={Boxes}
            label="Units available"
            value={machines.length}
            description="Ready for booking"
          />
        </div>
      </section>

      <section className="min-h-0 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-3">
          <div>
            <h2 className="font-semibold">Available inventory</h2>
            <p className="text-sm text-muted-foreground">
              Grouped by machine model and power.
            </p>
          </div>
        </div>
        <AppTable
          columns={columns}
          data={groups}
          loading={loading}
          totalCustomerText="Machine groups:"
          height="min-h-[420px]"
        >
          <div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
            <Select value={warehouse} onValueChange={setWarehouse}>
              <SelectTrigger className="h-9 w-36 rounded-lg">
                <SelectValue placeholder="Warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All warehouses</SelectItem>
                <SelectItem value="lahore">Lahore</SelectItem>
                <SelectItem value="karachi">Karachi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </AppTable>
      </section>

      <MachineDetailsDialog
        group={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}

function SortableHeader({
  column,
  label,
}: {
  column: {
    getIsSorted: () => false | "asc" | "desc";
    toggleSorting: (descending: boolean) => void;
  };
  label: string;
}) {
  return (
    <Button
      variant="ghost"
      className="-ml-2 h-7 px-2 text-[11px] font-bold tracking-wide uppercase hover:bg-transparent"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown className="ml-1.5 size-3" />
    </Button>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof Box;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3.5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4.5" />
      </span>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-xl font-bold leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function MachineDetailsDialog({
  group,
  onOpenChange,
}: {
  group: MachineGroup | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(group)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-[620px]">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <Boxes className="size-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate text-sm font-semibold">
                {group?.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {group?.model} · {group?.power} · {group?.machines.length || 0}{" "}
                available units
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          <div className="space-y-2 p-3.5">
            {group?.machines.map((machine, index) => (
              <div
                key={machine.id}
                className="grid grid-cols-[auto_1fr] gap-x-3 rounded-xl border p-3 text-sm sm:grid-cols-[auto_1fr_auto]"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-muted font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium">
                    Order No.:{" "}
                    {readable(machine.machine_serial, "Not recorded")}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Model: {readable(machine.machine_model)} · Power:{" "}
                    {readable(machine.machine_power)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Shipment:{" "}
                    {readable(machine.order_title, "Untitled shipment")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
