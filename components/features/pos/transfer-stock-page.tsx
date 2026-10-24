"use client";

import NotificationBadge from "@/components/shared/notifications/NotificationBadge";
import { InventorySearch } from "@/components/shared/search/inventory-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { StockProps } from "@/lib/types";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Office = { id: number; code: string; name: string };
type Transfer = {
  id: number;
  inventory_id: number;
  qty: string | number;
  created_at: string;
  merged_at?: string | null;
  merged?: boolean;
  approved?: boolean;
  approved_by?: number | null;
  rejected?: boolean;
  rejected_by?: number | null;
  request_note?: string | null;
  admin_note?: string | null;
  reviewed_at?: string | null;
  source_office?: string;
  target_office?: string;
  destination_name?: string | null;
  name: string;
  serial_no: string | null;
  model?: string | null;
  power?: string | null;
  unit?: string | null;
  chinese_name?: string | null;
  price?: string | number | null;
  buying?: string | number | null;
  remarks?: string | null;
};
type Overview = {
  pending: Transfer[];
  sent: Transfer[];
  received: Transfer[];
  offices: Office[];
};

const showDate = (value: string) => new Date(value).toLocaleString();

export default function TransferStockPage() {
  const { userID, base_route, designation } = useUserDetail();
  const isOwner = designation === "Owner";
  const [stock, setStock] = useState<StockProps[]>([]);
  const [overview, setOverview] = useState<Overview>({
    pending: [],
    sent: [],
    received: [],
    offices: [],
  });
  const [tab, setTab] = useState("send");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    transfer: Transfer;
    action: "approve" | "reject";
  } | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [linkedTransferId, setLinkedTransferId] = useState<number | null>(null);
  const [sourceItemId, setSourceItemId] = useState<number | null>(null);
  const [targetOfficeId, setTargetOfficeId] = useState("");
  const [qty, setQty] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [selectedTransferId, setSelectedTransferId] = useState<number | null>(
    null,
  );
  const [receiveMode, setReceiveMode] = useState<"existing" | "new">(
    "existing",
  );
  const [destinationItemId, setDestinationItemId] = useState<number | null>(
    null,
  );

  const refresh = useCallback(async () => {
    if (!userID) return;
    setLoading(true);
    setError("");
    try {
      const [posResponse, transferResponse] = await Promise.all([
        axios.get(`/${userID}/pos`),
        axios.get<Overview>(`/${userID}/pos/transfer?view=overview`),
      ]);
      setStock(posResponse.data.stock ?? []);
      setOverview(transferResponse.data);
      setSelectedTransferId((current) =>
        transferResponse.data.pending.some((item) => item.id === current)
          ? current
          : null,
      );
      if (transferResponse.data.pending.length === 0) {
        setTab((current) => (current === "receive" ? "send" : current));
      }
    } catch {
      setError("Unable to load stock transfers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userID]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkedTab = params.get("tab");
    if (linkedTab === "history" || linkedTab === "receive") setTab(linkedTab);
    const transferId = Number(params.get("transfer"));
    if (Number.isSafeInteger(transferId) && transferId > 0) {
      setLinkedTransferId(transferId);
      if (linkedTab === "receive") setSelectedTransferId(transferId);
    }
  }, []);

  useEffect(() => {
    if (loading || !linkedTransferId || tab !== "history") return;
    document
      .getElementById(`stock-transfer-${linkedTransferId}`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }, [loading, linkedTransferId, tab]);

  const selectedStock = stock.find((item) => item.id === sourceItemId);
  const selectedTransfer = overview.pending.find(
    (item) => item.id === selectedTransferId,
  );

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const quantity = Number(qty);
    if (
      !selectedStock ||
      !targetOfficeId ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0 ||
      quantity > Number(selectedStock.qty ?? 0)
    ) {
      toast.error(
        "Select an item, destination office, and available quantity.",
      );
      return;
    }
    setSending(true);
    try {
      await axios.post(`/${userID}/pos/transfer`, {
        inventory_id: selectedStock.id,
        target_office_id: Number(targetOfficeId),
        qty: quantity,
        request_note: requestNote.trim() || null,
      });
      toast.success(
        "Stock deducted and transfer sent to the owner for approval.",
      );
      setSourceItemId(null);
      setTargetOfficeId("");
      setQty("");
      setRequestNote("");
      await refresh();
    } catch {
      // The shared Axios client displays the server response.
    } finally {
      setSending(false);
    }
  };

  const review = async () => {
    if (!reviewTarget) return;
    setReviewing(true);
    try {
      await axios.put(`/${userID}/pos/transfer`, {
        transfer_id: reviewTarget.transfer.id,
        action: reviewTarget.action,
        admin_note: adminNote.trim() || null,
      });
      toast.success(
        reviewTarget.action === "approve"
          ? "Transfer approved. The receiving office has been notified."
          : "Transfer rejected. The quantity was returned to source inventory.",
      );
      setReviewTarget(null);
      setAdminNote("");
      await refresh();
    } catch {
      // The shared Axios client displays the server response.
    } finally {
      setReviewing(false);
    }
  };

  const receive = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTransfer) return;
    if (receiveMode === "existing" && !destinationItemId) {
      toast.error("Select an inventory item to receive this stock into.");
      return;
    }
    setReceiving(true);
    try {
      await axios.patch(`/${userID}/pos/transfer`, {
        transfer_id: selectedTransfer.id,
        ...(receiveMode === "existing"
          ? { destination_inventory_id: destinationItemId }
          : { create_new: true }),
      });
      toast.success("Stock received into this office's inventory.");
      setSelectedTransferId(null);
      setDestinationItemId(null);
      await refresh();
    } catch {
      // The shared Axios client displays the server response.
    } finally {
      setReceiving(false);
    }
  };

  return (
    <div className="w-full space-y-5 p-4 pb-10 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Link
            href={`/${base_route}/pos`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Back to POS
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ArrowLeftRight className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-semibold">Transfer stock</h1>
              <p className="text-sm text-muted-foreground">
                Send stock between offices and receive incoming items.
              </p>
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || sending || receiving}
          onClick={() => void refresh()}
        >
          {loading ? <Spinner /> : <RefreshCw className="size-4" />} Refresh
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex min-h-52 items-center justify-center gap-2 rounded-xl border bg-card text-sm text-muted-foreground">
          <Spinner /> Loading stock transfers...
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="h-auto flex-wrap gap-1">
            <TabsTrigger value="send">Send stock</TabsTrigger>
            <TabsTrigger
              value="receive"
              disabled={overview.pending.length === 0}
            >
              Receive stock{" "}
              <NotificationBadge count={overview.pending.length} />
            </TabsTrigger>
            <TabsTrigger value="history">
              Transfer history
              {isOwner && (
                <NotificationBadge
                  count={
                    overview.sent.filter(
                      (item) => !item.approved && !item.rejected,
                    ).length
                  }
                />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send">
            <form
              onSubmit={send}
              className="max-w-2xl space-y-4 rounded-xl border bg-card p-4 shadow-sm"
            >
              <div>
                <h2 className="text-sm font-semibold">
                  Send to another office
                </h2>
                <p className="text-xs text-muted-foreground">
                  Stock is deducted when requested. Approval makes it visible to
                  the receiving office; rejection returns the quantity.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Inventory item</Label>
                <InventorySearch
                  value={sourceItemId}
                  disabled={sending}
                  onReturn={(item) => {
                    setSourceItemId(item.id ?? null);
                    setQty("");
                  }}
                  data={stock.filter((item) => Number(item.qty ?? 0) > 0)}
                  showQty
                />
                {selectedStock && (
                  <p className="text-xs text-muted-foreground">
                    Available: {selectedStock.qty} {selectedStock.unit ?? ""} ·
                    Serial: {selectedStock.serial_no ?? "—"}
                  </p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="transfer-qty"
                    className="text-xs font-semibold"
                  >
                    Quantity
                  </Label>
                  <Input
                    id="transfer-qty"
                    type="number"
                    min="1"
                    step="1"
                    max={
                      selectedStock ? Number(selectedStock.qty ?? 0) : undefined
                    }
                    value={qty}
                    onChange={(event) => setQty(event.target.value)}
                    disabled={sending}
                    required
                    className="h-9 rounded-lg"
                  />
                  {selectedStock && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => setQty(String(selectedStock.qty ?? ""))}
                      disabled={sending}
                    >
                      Use full available quantity
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="transfer-office"
                    className="text-xs font-semibold"
                  >
                    Receiving office
                  </Label>
                  <select
                    id="transfer-office"
                    value={targetOfficeId}
                    onChange={(event) => setTargetOfficeId(event.target.value)}
                    disabled={sending}
                    required
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select office</option>
                    {overview.offices.map((office) => (
                      <option key={office.id} value={office.id}>
                        {office.name || office.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="transfer-request-note"
                  className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  Reason for transfer (optional)
                </Label>
                <Textarea
                  id="transfer-request-note"
                  value={requestNote}
                  onChange={(event) => setRequestNote(event.target.value)}
                  maxLength={2000}
                  disabled={sending}
                  placeholder="Why is this stock being transferred?"
                  className="min-h-20 rounded-lg text-sm"
                />
              </div>
              <Button
                type="submit"
                disabled={sending || !sourceItemId || !targetOfficeId || !qty}
                className="h-9 rounded-lg"
              >
                {sending ? <Spinner /> : <ArrowRight className="size-4" />}
                {sending ? "Requesting transfer..." : "Request transfer"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="receive" className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Waiting to be received</h2>
              {overview.pending.map((transfer) => (
                <button
                  key={transfer.id}
                  type="button"
                  disabled={receiving}
                  onClick={() => {
                    setSelectedTransferId(transfer.id);
                    setReceiveMode("existing");
                    setDestinationItemId(null);
                  }}
                  className={`flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-left hover:border-primary/40 ${selectedTransferId === transfer.id ? "border-primary bg-primary/5" : "bg-card"}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {transfer.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      From {transfer.source_office} · Serial{" "}
                      {transfer.serial_no || "—"} ·{" "}
                      {showDate(transfer.created_at)}
                    </span>
                  </span>
                  <span className="text-sm font-semibold">
                    {Number(transfer.qty).toFixed(0)} {transfer.unit ?? ""}
                  </span>
                </button>
              ))}
            </div>

            {selectedTransfer && (
              <form
                onSubmit={receive}
                className="max-w-2xl space-y-4 rounded-xl border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <PackageCheck className="mt-0.5 size-4 text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold">
                      Receive {selectedTransfer.qty}{" "}
                      {selectedTransfer.unit ?? ""} of {selectedTransfer.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Choose where this stock belongs in your office inventory.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={receiveMode === "existing" ? "default" : "outline"}
                    disabled={receiving}
                    onClick={() => setReceiveMode("existing")}
                  >
                    Add to existing item
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={receiveMode === "new" ? "default" : "outline"}
                    disabled={receiving}
                    onClick={() => setReceiveMode("new")}
                  >
                    Create new item
                  </Button>
                </div>
                {(selectedTransfer.request_note ||
                  selectedTransfer.admin_note) && (
                  <div className="space-y-1 rounded-lg border bg-muted/20 p-3 text-xs">
                    {selectedTransfer.request_note && (
                      <p>
                        <span className="font-semibold">Transfer reason:</span>{" "}
                        {selectedTransfer.request_note}
                      </p>
                    )}
                    {selectedTransfer.admin_note && (
                      <p>
                        <span className="font-semibold">Owner note:</span>{" "}
                        {selectedTransfer.admin_note}
                      </p>
                    )}
                  </div>
                )}
                {receiveMode === "existing" ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Destination inventory item
                    </Label>
                    <InventorySearch
                      value={destinationItemId}
                      disabled={receiving}
                      onReturn={(item) => setDestinationItemId(item.id ?? null)}
                      data={stock}
                      showQty
                    />
                    {destinationItemId && (
                      <p className="text-xs text-muted-foreground">
                        Confirm that this is the same product before receiving.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">
                      The new inventory row will copy these details from the
                      sending office. Quantity will be {selectedTransfer.qty}.
                    </p>
                    <dl className="grid gap-2 text-sm sm:grid-cols-2">
                      {(
                        [
                          ["Name", selectedTransfer.name],
                          ["Serial no.", selectedTransfer.serial_no],
                          ["Model", selectedTransfer.model],
                          ["Power", selectedTransfer.power],
                          ["Unit", selectedTransfer.unit],
                          ["Chinese name", selectedTransfer.chinese_name],
                          ["Price", selectedTransfer.price],
                          ["Buying price", selectedTransfer.buying],
                          ["Remarks", selectedTransfer.remarks],
                        ] as const
                      ).map(([label, value]) => (
                        <div key={label}>
                          <dt className="text-xs text-muted-foreground">
                            {label}
                          </dt>
                          <dd className="font-medium">{value ?? "—"}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={
                    receiving ||
                    (receiveMode === "existing" && !destinationItemId)
                  }
                  className="h-9 rounded-lg"
                >
                  {receiving ? (
                    <Spinner />
                  ) : (
                    <PackageCheck className="size-4" />
                  )}
                  {receiving ? "Receiving stock..." : "Receive into inventory"}
                </Button>
              </form>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <section className="overflow-hidden rounded-xl border bg-card">
              <div className="border-b p-4">
                <h2 className="text-sm font-semibold">
                  Transfers requested from this office
                </h2>
                <p className="text-xs text-muted-foreground">
                  Approval and receiving state for each transfer.
                </p>
              </div>
              {overview.sent.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  No stock has been transferred yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2">Item</th>
                        <th className="px-4 py-2">Qty</th>
                        <th className="px-4 py-2">To office</th>
                        <th className="px-4 py-2">Requested</th>
                        <th className="px-4 py-2">State</th>
                        {isOwner && <th className="px-4 py-2">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {overview.sent.map((transfer) => (
                        <tr
                          key={transfer.id}
                          id={`stock-transfer-${transfer.id}`}
                          className={
                            linkedTransferId === transfer.id
                              ? "bg-primary/5"
                              : undefined
                          }
                        >
                          <td className="px-4 py-3">
                            <span className="font-medium">{transfer.name}</span>
                            <span className="block text-xs text-muted-foreground">
                              {transfer.serial_no || "—"}
                            </span>
                            {transfer.request_note && (
                              <span className="block max-w-72 text-xs text-muted-foreground">
                                Reason: {transfer.request_note}
                              </span>
                            )}
                            {transfer.admin_note && (
                              <span className="block max-w-72 text-xs text-muted-foreground">
                                Owner note: {transfer.admin_note}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">{transfer.qty}</td>
                          <td className="px-4 py-3 capitalize">
                            {transfer.target_office}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {showDate(transfer.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${transfer.rejected ? "bg-destructive/10 text-destructive" : transfer.merged ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400"}`}
                            >
                              {transfer.rejected
                                ? "Rejected"
                                : !transfer.approved
                                  ? "Waiting for approval"
                                  : transfer.merged
                                    ? "Received"
                                    : "Waiting to receive"}
                            </span>
                            {transfer.reviewed_at && (
                              <span className="mt-1 block text-xs text-muted-foreground">
                                Reviewed {showDate(transfer.reviewed_at)}
                              </span>
                            )}
                          </td>
                          {isOwner && (
                            <td className="px-4 py-3">
                              {!transfer.approved && !transfer.rejected && (
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={reviewing}
                                    onClick={() => {
                                      setAdminNote("");
                                      setReviewTarget({
                                        transfer,
                                        action: "approve",
                                      });
                                    }}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={reviewing}
                                    onClick={() => {
                                      setAdminNote("");
                                      setReviewTarget({
                                        transfer,
                                        action: "reject",
                                      });
                                    }}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
            <section className="overflow-hidden rounded-xl border bg-card">
              <div className="border-b p-4">
                <h2 className="text-sm font-semibold">
                  Received by this office
                </h2>
                <p className="text-xs text-muted-foreground">
                  Transfers added to this office inventory.
                </p>
              </div>
              {overview.received.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  No stock transfers have been received yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2">Item</th>
                        <th className="px-4 py-2">Qty</th>
                        <th className="px-4 py-2">From office</th>
                        <th className="px-4 py-2">Received</th>
                        <th className="px-4 py-2">Inventory item</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {overview.received.map((transfer) => (
                        <tr key={transfer.id}>
                          <td className="px-4 py-3">
                            <span className="font-medium">{transfer.name}</span>
                            <span className="block text-xs text-muted-foreground">
                              {transfer.serial_no || "—"}
                            </span>
                            {transfer.request_note && (
                              <span className="block max-w-72 text-xs text-muted-foreground">
                                Reason: {transfer.request_note}
                              </span>
                            )}
                            {transfer.admin_note && (
                              <span className="block max-w-72 text-xs text-muted-foreground">
                                Owner note: {transfer.admin_note}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {transfer.qty} {transfer.unit ?? ""}
                          </td>
                          <td className="px-4 py-3 capitalize">
                            {transfer.source_office}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {transfer.merged_at
                              ? showDate(transfer.merged_at)
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {transfer.destination_name || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>
      )}
      <Dialog
        open={reviewTarget !== null}
        onOpenChange={(open) => {
          if (!open && !reviewing) {
            setReviewTarget(null);
            setAdminNote("");
          }
        }}
      >
        <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-[440px]">
          <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                <ShieldCheck className="size-4" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold">
                  {reviewTarget?.action === "reject"
                    ? "Reject transfer"
                    : "Approve transfer"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {reviewTarget?.action === "reject"
                    ? "Return the deducted quantity to the source office."
                    : "Make this transfer available to the receiving office."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(100dvh-132px)]">
            <form
              className="space-y-3 p-3.5"
              onSubmit={(event) => {
                event.preventDefault();
                void review();
              }}
            >
              <p className="text-sm font-medium">
                {reviewTarget?.transfer.qty} {reviewTarget?.transfer.name}
              </p>
              {reviewTarget?.transfer.request_note && (
                <p className="rounded-lg border bg-muted/20 p-2.5 text-xs">
                  <span className="font-semibold">Transfer reason:</span>{" "}
                  {reviewTarget.transfer.request_note}
                </p>
              )}
              <div className="space-y-1.5">
                <Label
                  htmlFor="transfer-admin-note"
                  className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  Owner note (optional)
                </Label>
                <Textarea
                  id="transfer-admin-note"
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  maxLength={2000}
                  disabled={reviewing}
                  placeholder="Add a note about this decision"
                  className="min-h-20 rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg"
                  disabled={reviewing}
                  onClick={() => setReviewTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-9 rounded-lg"
                  disabled={reviewing}
                >
                  {reviewing && <Spinner />}
                  {reviewing
                    ? reviewTarget?.action === "reject"
                      ? "Rejecting..."
                      : "Approving..."
                    : reviewTarget?.action === "reject"
                      ? "Reject transfer"
                      : "Approve transfer"}
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
