"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Heading from "@/components/ui/heading";
import Spinner from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserSearch } from "@/components/shared/search/user-search";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { MyCustomer } from "@/lib/types";
import { ArrowRightLeft, CheckCircle2, MapPin, UserRound, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";


export default function Page() {
  const [fromUserId, setFromUserId] = useState<number | null>(null);
  const [toUserId, setToUserId] = useState<number | null>(null);
  const { userID } = useUserDetail();
  const [customers, setCustomers] = useState<MyCustomer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (!userID || !fromUserId) return;
    setCustomers([]);
    fetchCustomersByUser(fromUserId);
  }, [fromUserId, userID]);

  const fetchCustomersByUser = async (userId: number) => {
    setLoading(true);

    try {
      const response = await axios.get(`/${userID}/transfer?id=${userId}`);
      setCustomers(response.data);
    } finally {
      setLoading(false);
    }
  };

  const allSelected = useMemo(
    () => customers.length > 0 && selectedCustomers.length === customers.length,
    [customers, selectedCustomers],
  );

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map((c) => c.id));
    }
  };

  const toggleCustomer = (id: number) => {
    setSelectedCustomers((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleTransfer = async () => {
    if (!fromUserId || !toUserId || selectedCustomers.length === 0) return;

    const payload = {
      from_user_id: fromUserId,
      to_user_id: toUserId,
      ids: selectedCustomers,
    };

    setTransferLoading(true);

    try {
      await axios.post(`/${userID}/transfer`, payload);
      await fetchCustomersByUser(fromUserId);
      setSelectedCustomers([]);
      toast.success("Transferred successfully");
    } finally {
      setTransferLoading(false);
    }
  };

  return (

    <div className="flex flex-1 flex-col gap-4 pb-4">
      <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
              <ArrowRightLeft className="h-3.5 w-3.5 text-blue-600" />
              Ownership reassignment
            </div>
            <Heading
              title="Customer Transfers"
              description="Reassign customers between owners in just a few clicks"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border bg-muted/15 px-3 py-2">
              <p className="text-[11px] font-medium uppercase text-muted-foreground">
                Customers
              </p>
              <p className="mt-1 text-lg font-bold">{customers.length}</p>
            </div>
            <div className="rounded-xl border bg-muted/15 px-3 py-2">
              <p className="text-[11px] font-medium uppercase text-muted-foreground">
                Selected
              </p>
              <p className="mt-1 text-lg font-bold text-blue-700">
                {selectedCustomers.length}
              </p>
            </div>
            <div className="col-span-2 rounded-xl border bg-muted/15 px-3 py-2 sm:col-span-1">
              <p className="text-[11px] font-medium uppercase text-muted-foreground">
                Status
              </p>
              <p className="mt-1 truncate text-sm font-semibold">
                {fromUserId ? "Ready to select" : "Choose source"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
        <CardHeader className="border-b bg-muted/15 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <ArrowRightLeft className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold">Transfer Setup</h2>
              <p className="text-sm text-muted-foreground">
                Select source owner, destination owner, then choose customers below.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto] lg:items-end">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                Transfer from
              </div>
              <UserSearch
                value={fromUserId}
                onReturn={(val) => setFromUserId(val)}
                placeholder="Select employee"
              />
            </div>

            <div className="hidden h-10 w-10 place-items-center rounded-full border bg-muted/20 text-muted-foreground lg:grid">
              <ArrowRightLeft className="h-4 w-4" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                Transfer to
              </div>
              <UserSearch
                value={toUserId}
                onReturn={(value) => setToUserId(Number(value))}
                placeholder="Select employee"
              />
            </div>

            <Button
              size="lg"
              onClick={handleTransfer}
              disabled={
                !toUserId ||
                transferLoading ||
                !fromUserId ||
                selectedCustomers.length === 0
              }
              className="w-full lg:w-auto"
            >
              {transferLoading ? "Transferring..." : "Transfer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {fromUserId && (
        <Card className="w-full gap-0 overflow-hidden rounded-2xl border-border/70 shadow-sm">
          <CardHeader className="m-0 border-b bg-muted/15 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <UsersRound className="h-4 w-4 text-blue-700" />
                  <h2 className="text-lg font-semibold">Customers</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Select customers you want to transfer
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full">
                  {customers.length} total
                </Badge>
                <Badge className="rounded-full">
                  {selectedCustomers.length} selected
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  disabled={customers.length === 0}
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative w-full p-0">

            <div
              className="relative hidden min-h-[calc(100dvh-270px)] flex-1 md:flex"
            >
              <div className="custom-scrollbar absolute bottom-0 left-0 right-0 top-0 flex overflow-auto">

                <Table className="relative min-w-[760px]">
                  <TableHeader>
                    <TableRow className="sticky top-0 z-30 bg-background">
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Current Ownership</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-10 text-center text-muted-foreground"
                        >
                          <div className="flex items-center justify-center">
                            <Spinner />
                            <span className="ml-2 text-muted-foreground">
                              Loading customers...
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map((customer) => (
                        <TableRow
                          key={customer.id}
                          className={`transition-colors duration-150 ${selectedCustomers.includes(customer.id)
                            ? "bg-primary/10"
                            : "hover:bg-muted/30"
                            }`}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedCustomers.includes(customer.id)}
                              onCheckedChange={() => toggleCustomer(customer.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {customer.name}
                          </TableCell>
                          <TableCell className="font-medium">
                            {customer.owner}
                          </TableCell>
                          <TableCell>{customer.location}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {customer.ownership_name}
                          </TableCell>
                        </TableRow>
                      ))
                    )}

                    {!loading && customers.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-10 text-center text-muted-foreground"
                        >
                          No customers found for this ownership
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {loading ? (
                <div className="flex items-center justify-center rounded-2xl border bg-muted/15 py-10 text-sm text-muted-foreground">
                  <Spinner />
                  <span className="ml-2">Loading customers...</span>
                </div>
              ) : customers.length > 0 ? (
                customers.map((customer) => {
                  const selected = selectedCustomers.includes(customer.id);

                  return (
                    <div
                      key={customer.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleCustomer(customer.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleCustomer(customer.id);
                        }
                      }}
                      className={`w-full rounded-2xl border p-3 text-left transition ${selected
                        ? "border-primary bg-primary/10"
                        : "bg-background hover:bg-muted/30"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{customer.name}</p>
                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {customer.owner || "No owner"}
                          </p>
                        </div>
                        <Checkbox checked={selected} />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full border bg-muted/20 px-2 py-1">
                          <MapPin className="h-3 w-3" />
                          {customer.location || "No city"}
                        </span>
                        <span className="rounded-full border bg-muted/20 px-2 py-1">
                          {customer.ownership_name || "No ownership"}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed bg-muted/15 py-10 text-center text-sm text-muted-foreground">
                  No customers found for this ownership
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
