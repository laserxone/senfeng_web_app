"use client";

import { RequiredStar } from "@/components/shared/common/RequiredStar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";

import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { Payment } from "@/lib/types";
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileText,
  Hash,
  Phone,
  Search,
  ShieldCheck,
  XCircle,
  Zap,
} from "lucide-react";
import moment from "moment";
import { useEffect, useRef, useState, type ElementType } from "react";
import { toast } from "sonner";
import { MyImgZooming } from "@/components/shared/media/img-zooming";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type Machine = {
  machine_id: number;
  serial_no: string;
  power: string;
  source: string;
  contract_date: string;
  payments: Payment[];
  order_no_arr: string[];
};

type CustomerMachinePayments = {
  customer_id: number;
  customer_name: string;
  customer_owner: string;
  customer_number: string[];
  machines: Machine[];
};

export default function PaymentVerification() {
  const { userID } = useUserDetail();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CustomerMachinePayments[]>([]);
  const hasFetched = useRef(false);
  const [search, setSearch] = useState("");
  const [comment, setComment] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [approveLoadingId, setApproveLoadingId] = useState<number | null>(null);
  const [rejectionLoading, setRejectionLoading] = useState(false);
  const [machineApproveLoadingId, setMachineApproveLoadingId] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (userID && !hasFetched.current) {
      hasFetched.current = true;
      fetchData();
    }
  }, [userID]);

  async function fetchData() {
    setLoading(true);
    try {
      const response = await axios.get(`/${userID}/payment-verification`);
      setData(response.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = async (paymentId: number, machineId: number) => {
    try {
      await axios.put(`/${userID}/payment-verification/${paymentId}`, {
        status: "approved",
      });

      setData((prevData) =>
        prevData.map((customer) => ({
          ...customer,
          machines: customer.machines.map((machine) => {
            if (machine.machine_id !== machineId) return machine;
            return {
              ...machine,
              payments: machine.payments.map((payment) =>
                payment.id === paymentId
                  ? { ...payment, status: "approved", payment_lock: true }
                  : payment,
              ),
            };
          }),
        })),
      );
    } catch (err) {
      console.error("Approve failed", err);
    } finally {
      setApproveLoadingId(null);
    }
  };

  const handleApproveAll = async (machineId: number) => {
    setMachineApproveLoadingId(machineId);

    try {
      const pendingPayments: number[] = [];

      data.forEach((customer) => {
        customer.machines.forEach((machine) => {
          if (machine.machine_id === machineId) {
            machine.payments.forEach((payment) => {
              if (payment.status !== "approved") {
                pendingPayments.push(payment.id);
              }
            });
          }
        });
      });

      await Promise.all(
        pendingPayments.map((paymentId) => handleApprove(paymentId, machineId)),
      );
      toast.success("All Payments updated");
    } catch (err) {
      toast.error("Bulk approval failed");
    } finally {
      setMachineApproveLoadingId(null);
    }
  };
  const handleReject = async (paymentId: number | null) => {
    if (!paymentId) return;
    setRejectionLoading(true);
    try {
      await axios.put(`/${userID}/payment-verification/${paymentId}`, {
        status: "rejected",
        comment: comment,
      });

      setData((prevData) =>
        prevData.map((customer) => ({
          ...customer,
          machines: customer.machines.map((machine) => ({
            ...machine,
            payments: machine.payments.map((payment) =>
              payment.id === paymentId
                ? { ...payment, status: "rejected", comment }
                : payment,
            ),
          })),
        })),
      );

      setVisible(false);
      setComment("");
    } catch (err) {
      console.error("Reject failed", err);
    } finally {
      setRejectionLoading(false);
    }
  };

  const filteredData = data.filter((item) =>
    `${item.customer_name} ${item.customer_owner}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const getUnverifiedPaymentCount = (data: CustomerMachinePayments[]) => {
    let count = 0;

    data.forEach((customer) => {
      customer.machines.forEach((machine) => {
        machine.payments.forEach((payment) => {
          if (payment.status !== "approved") {
            count++;
          }
        });
      });
    });

    return count;
  };

  const unverifiedCount = getUnverifiedPaymentCount(data);
  const machineCount = data.reduce(
    (sum, customer) => sum + customer.machines.length,
    0,
  );
  const paymentCount = data.reduce(
    (sum, customer) =>
      sum +
      customer.machines.reduce(
        (machineSum, machine) => machineSum + machine.payments.length,
        0,
      ),
    0,
  );

  return (
    <div className="flex flex-1 flex-col gap-5">
      <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className="p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  Payment Verification
                </h1>
                <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold tracking-wide text-muted-foreground uppercase sm:inline-flex">
                  Workspace
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Review payment receipts and pending approvals.
              </p>
            </div>
          </div>
        </div>

        <div className="grid border-t bg-muted/20 sm:grid-cols-2 sm:divide-x xl:grid-cols-4">
          <SummaryTile
            icon={ShieldCheck}
            label="Unverified"
            value={unverifiedCount}
            iconClassName="text-red-600 dark:text-red-400"
          />
          <SummaryTile
            icon={CreditCard}
            label="Total Payments"
            value={paymentCount}
            iconClassName="text-emerald-600 dark:text-emerald-400"
          />
          <SummaryTile
            icon={Zap}
            label="Machines"
            value={machineCount}
            iconClassName="text-amber-600 dark:text-amber-400"
          />
          <SummaryTile
            icon={ClipboardCheck}
            label="Customers"
            value={data.length}
            iconClassName="text-violet-600 dark:text-violet-400"
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-background p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 bg-muted/15 pl-9"
            placeholder="Search customer or owner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {loading ? (
        <div className="grid min-h-[280px] place-items-center rounded-2xl border bg-background">
          <Spinner />
        </div>
      ) : filteredData.length === 0 ? (
        <div className="grid min-h-[240px] place-items-center rounded-2xl border border-dashed bg-muted/15 p-8 text-center">
          <div>
            <CreditCard className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">No payments found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting the customer search.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredData.map((customer) => (
            <Collapsible key={`customer-${customer.customer_id} `}>
              <div className="w-[calc(100dvw-30px)] overflow-hidden rounded-2xl border bg-background shadow-sm sm:w-full">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="group flex h-auto w-full items-start justify-between gap-3 rounded-none px-4 py-4 text-left hover:bg-muted/20"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                        <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold break-words">
                          {customer.customer_name}
                        </p>
                        <p className="mt-1 text-sm break-words text-muted-foreground">
                          {customer.customer_owner}
                        </p>
                      </div>
                    </div>
                    <div className="hidden shrink-0 rounded-full border bg-muted/20 px-3 py-1 text-xs font-medium text-muted-foreground sm:block">
                      {customer.machines.length} machines
                    </div>
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="border-t bg-muted/10 p-4">
                  <div className="mb-4 flex items-start gap-2 rounded-xl border bg-background p-3 text-sm text-muted-foreground">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <p className="break-words">
                      <strong className="text-foreground">Number:</strong>{" "}
                      {customer.customer_number?.join(", ") || "N/A"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {customer.machines.map((machine) => (
                      <Collapsible key={`machine-${machine.machine_id}`}>
                        <div className="overflow-hidden rounded-2xl border bg-background">
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="group flex h-auto w-full items-center justify-between gap-3 rounded-none px-4 py-3 text-left hover:bg-muted/20"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                                  <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold break-words">
                                    Machine #{machine.serial_no}
                                  </p>
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {machine.payments.length} payments
                                  </p>
                                </div>
                              </div>
                              <span className="hidden rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
                                {machine.source || "N/A"}
                              </span>
                            </Button>
                          </CollapsibleTrigger>

                          <CollapsibleContent className="space-y-4 border-t p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <InfoTile
                                  icon={CalendarDays}
                                  label="Contract"
                                  value={
                                    machine.contract_date
                                      ? moment(
                                          new Date(machine.contract_date),
                                        ).format("YYYY-MM-DD")
                                      : "N/A"
                                  }
                                />
                                <InfoTile
                                  icon={Zap}
                                  label="Power"
                                  value={machine.power || "N/A"}
                                />
                                <InfoTile
                                  icon={FileText}
                                  label="Source"
                                  value={machine.source || "N/A"}
                                />
                                <InfoTile
                                  icon={Hash}
                                  label="Order No"
                                  value={
                                    machine.order_no_arr?.join(", ") || "N/A"
                                  }
                                />
                              </div>

                              <Button
                                disabled={
                                  machineApproveLoadingId === machine.machine_id
                                }
                                className="w-full gap-2 lg:w-auto"
                                onClick={() =>
                                  handleApproveAll(machine.machine_id)
                                }
                              >
                                {machineApproveLoadingId ===
                                machine.machine_id ? (
                                  <Spinner className="h-4 w-4" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                                Approve All Payments
                              </Button>
                            </div>

                            <div className="grid gap-3">
                              {machine.payments.map((payment) => (
                                <div
                                  key={`payment-${payment.id}`}
                                  className="rounded-2xl border bg-muted/15 p-4"
                                >
                                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0 flex-1 space-y-3">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <StatusPill
                                          status={payment.status || "pending"}
                                        />
                                        <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                          TID: {payment.note || "N/A"}
                                        </span>
                                      </div>

                                      <div className="grid gap-3 sm:grid-cols-2">
                                        <InfoTile
                                          icon={Banknote}
                                          label="Amount"
                                          value={String(
                                            payment.amount ?? "N/A",
                                          )}
                                        />
                                        <InfoTile
                                          icon={FileText}
                                          label="Reference"
                                          value={payment.note || "N/A"}
                                        />
                                      </div>

                                      {payment.status === "rejected" && (
                                        <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                                          <strong>Reason:</strong>{" "}
                                          {payment.comment || "N/A"}
                                        </div>
                                      )}

                                      {payment.image && (
                                        <div className="rounded-xl border bg-background p-3">
                                          <p className="mb-2 text-xs font-medium text-muted-foreground">
                                            Receipt proof
                                          </p>
                                          <MyImgZooming
                                            img={payment.image}
                                            className="h-[200px]"
                                          />
                                        </div>
                                      )}
                                    </div>

                                    {payment.status !== "approved" &&
                                      payment.status !== "rejected" && (
                                        <div className="flex w-full gap-2 lg:w-auto lg:flex-col">
                                          <Button
                                            size="sm"
                                            className="flex-1 gap-2 lg:flex-none"
                                            disabled={
                                              approveLoadingId === payment.id
                                            }
                                            onClick={() => {
                                              setApproveLoadingId(payment.id);
                                              handleApprove(
                                                payment.id,
                                                machine.machine_id,
                                              );
                                            }}
                                          >
                                            {approveLoadingId === payment.id ? (
                                              <Spinner className="h-4 w-4" />
                                            ) : (
                                              <CheckCircle2 className="h-4 w-4" />
                                            )}
                                            Approve
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            className="flex-1 gap-2 lg:flex-none"
                                            onClick={() => {
                                              setSelectedPayment(payment.id);
                                              setVisible(true);
                                            }}
                                          >
                                            <XCircle className="h-4 w-4" />
                                            Reject
                                          </Button>
                                        </div>
                                      )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      )}

      <Dialog open={visible} onOpenChange={setVisible}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="border-b bg-muted/20 px-5 py-5 text-left">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-700 ring-1 ring-red-100">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  Reject reason
                </DialogTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add the reason before rejecting this payment.
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 p-5">
            <div className="space-y-2">
              <Label>
                Enter reason for rejection <RequiredStar />
              </Label>
              <Input
                placeholder="Reason"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              disabled={!comment || rejectionLoading}
              onClick={() => handleReject(selectedPayment)}
            >
              {rejectionLoading && <Spinner className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  iconClassName,
}: {
  icon: ElementType;
  label: string;
  value: number;
  iconClassName: string;
}) {
  return (
    <div className="flex items-center gap-3 border-t px-4 py-3 first:border-t-0 sm:px-5 xl:border-t-0 sm:[&:nth-child(2)]:border-t-0">
      <Icon className={`size-4 shrink-0 ${iconClassName}`} />
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="truncate text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        <span className="text-sm font-bold">{value}</span>
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-sm font-semibold break-words">{value}</p>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles =
    status === "approved"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : status === "rejected"
        ? "border-red-100 bg-red-50 text-red-700"
        : "border-amber-100 bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      {status || "pending"}
    </span>
  );
}
