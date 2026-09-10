"use client";

import Heading from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMachineApproval } from "@/hooks/use-machine-approval";
import useUserDetail from "@/hooks/use-user-detail";
import { ArrowLeft, ChevronRight, ClipboardCheck, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { useMemo, useState } from "react";

export default function PendingMachineApprovals() {
  const { base_route, isAdmin } = useUserDetail();
  const router = useRouter();
  const { pending: machines } = useMachineApproval();
  const [search, setSearch] = useState("");
  const filteredMachines = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return machines;

    return machines.filter((machine) =>
      getSearchValue(machine).toLowerCase().includes(term),
    );
  }, [machines, search]);

  if (!isAdmin) return null;

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex gap-4 items-center flex-wrap">
          <Link
            href={`/${base_route}/applications`}
            className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-b from-white to-slate-50 text-slate-700 shadow-sm transition-all duration-300 hover:-translate-x-1 hover:border-slate-300 hover:text-slate-950 hover:shadow-lg"
          >
            <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          </Link>
          <Heading
            panel
            title="Pending machine approvals"
            description="Machines awaiting your review"
          />
        </div>
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
          {machines.length} pending
        </span>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search any machine approval detail..."
          className="h-10 rounded-xl pl-9"
        />
      </div>

      {filteredMachines.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
          <ClipboardCheck className="mx-auto mb-3 size-9 text-muted-foreground" />
          <h2 className="font-semibold">
            {search
              ? "No matching machine approvals"
              : "No pending machine approvals"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {search
              ? "Try a different search term."
              : "New machine submissions will appear here."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filteredMachines.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  router.push(
                    `/${base_route}/member/${item.customer_id}/machine/${item.id}`,
                  )
                }
                className="w-full rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors active:bg-muted/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {item.customer_name ||
                        item.customer_owner ||
                        "Unknown customer"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Customer #{item.customer_id} · #{item.id}
                    </p>
                  </div>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {item.type || "Machine"}
                  </span>
                </div>

                <div className="mt-3 border-t pt-3 text-xs">
                  <MachineDetails item={item} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-xs">
                  <div className="min-w-0">
                    <p className="text-muted-foreground">Sales person</p>
                    <p className="truncate font-medium">
                      {item.sell_by_name || "N/A"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground">Manager</p>
                    <p className="truncate font-medium">
                      {item.ownership_name || "N/A"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-sm md:block">
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Machine / parts details</TableHead>
                  <TableHead>Sales person</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead className="w-10" aria-label="Open" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMachines.map((item) => (
                  <TableRow
                    key={item.id}
                    role="link"
                    tabIndex={0}
                    onClick={() =>
                      router.push(
                        `/${base_route}/member/${item.customer_id}/machine/${item.id}`,
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(
                          `/${base_route}/member/${item.customer_id}/machine/${item.id}`,
                        );
                      }
                    }}
                    className="group cursor-pointer"
                  >
                    <TableCell>
                      <p className="font-medium">
                        {item.customer_name ||
                          item.customer_owner ||
                          "Unknown customer"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Customer #{item.customer_id}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {item.type || "Machine"}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-lg whitespace-normal">
                      <MachineDetails item={item} />
                    </TableCell>
                    <TableCell>{item.sell_by_name || "N/A"}</TableCell>
                    <TableCell>{item.ownership_name || "N/A"}</TableCell>
                    <TableCell>
                      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

function MachineDetails({
  item,
}: {
  item: {
    type: string;
    serial_no: string | null;
    power: string | null;
    source: string | null;
    parts_information: Record<string, unknown>[] | null;
  };
}) {
  if (item.type === "Parts") {
    return (
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {(item.parts_information ?? []).flatMap((part, index) =>
          Object.entries(part).map(([key, value]) => (
            <span key={`${index}-${key}`} className="text-muted-foreground">
              <span className="capitalize">{key.replaceAll("_", " ")}:</span>{" "}
              <span className="font-medium text-foreground">
                {formatPartValue(value)}
              </span>
            </span>
          )),
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-3 text-xs">
      <Detail label="Serial no." value={item.serial_no} />
      <Detail label="Power" value={item.power} />
      <Detail label="Source" value={item.source} />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <span className="text-muted-foreground">
      {label}:{" "}
      <span className="font-medium text-foreground">{value || "N/A"}</span>
    </span>
  );
}

function formatPartValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "N/A";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function getSearchValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(getSearchValue).join(" ");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => `${key} ${getSearchValue(entry)}`)
      .join(" ");
  }
  return String(value);
}
