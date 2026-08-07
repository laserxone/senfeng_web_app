"use client";

import { CustomerSearch } from "@/components/features/customers/components/customer-search";
import { RequiredStar } from "@/components/shared/common/RequiredStar";
import { InventorySearch } from "@/components/shared/search/inventory-select";
import Dropzone from "@/components/shared/uploads/dropzone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import Spinner from "@/components/ui/spinner";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { UploadImage } from "@/lib/uploadFunction";
import {
  ChevronRight,
  Gift,
  ImagePlus,
  Package,
  Plus,
  Settings,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Hierarchy } from "./gift-types";

type Stock = { id: number; name: string; qty: number | undefined };
type RequestedItem = { id: number; qty: number };

export default function AddNewGiftApplication({
  onCreated,
}: {
  onCreated: () => Promise<void>;
}) {
  const { userID } = useUserDetail();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [customerId, setCustomerId] = useState<number | string | null>(null);
  const [inventory, setInventory] = useState<Stock[]>([]);
  const [requestedItems, setRequestedItems] = useState<RequestedItem[]>([]);
  const [hierarchies, setHierarchies] = useState<Hierarchy[]>([]);
  const [hierarchyId, setHierarchyId] = useState("");
  const [reason, setReason] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const selectedHierarchy = hierarchies.find(
    (item) => item.id === Number(hierarchyId),
  );
  const hasApprovers = Boolean(selectedHierarchy?.approvers?.length);
  useEffect(() => {
    if (!open || !userID) return;
    Promise.all([
      axios.get(`/${userID}/hierarchies`),
      axios.get(`/${userID}/pos`),
    ]).then(([hierarchyResponse, stockResponse]) => {
      const gifts = (hierarchyResponse.data || []).filter(
        (item: Hierarchy) => item.hierarchy_type === "gift",
      );
      setHierarchies(gifts);
      setHierarchyId(gifts[0] ? String(gifts[0].id) : "");
      setInventory(stockResponse.data?.stock || []);
    });
  }, [open, userID]);
  function close(next: boolean) {
    setOpen(next);
    if (!next) {
      setCustomerId(null);
      setRequestedItems([]);
      setReason("");
      setImage(null);
      setError("");
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!userID) return;
    if (
      !customerId ||
      !requestedItems.length ||
      !reason.trim() ||
      !hierarchyId ||
      !hasApprovers
    ) {
      setError(
        hasApprovers
          ? "Customer, at least one inventory item, reason, and gift hierarchy are required."
          : "The selected gift hierarchy must have at least one approver.",
      );
      return;
    }
    setPending(true);
    try {
      let imagePath: string | null = null;
      if (image) {
        imagePath = `gift-applications/${userID}/${Date.now()}-${image.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        await UploadImage(
          URL.createObjectURL(image),
          imagePath,
          image.type || "application/octet-stream",
        );
      }
      await axios.post(`/${userID}/gift-applications`, {
        user_id: userID,
        customer_id: customerId,
        inventory_items: requestedItems,
        reason: reason.trim(),
        image: imagePath,
        hierarchy_id: Number(hierarchyId),
      });
      await onCreated();
      close(false);
      toast.success("Gift application submitted successfully");
    } catch (requestError: any) {
      toast.error(
        requestError?.response?.data?.message ||
          "Failed to submit gift application.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Gift className="size-4" />
        Add New Application
      </Button>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-2xl">
          <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-pink-500/15 bg-pink-500/10 text-pink-600">
                <Gift className="size-4" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold text-foreground">
                  New Gift Application
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Submit the gift request for approval.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(100dvh-132px)]">
            <form onSubmit={submit} className="space-y-4 p-3.5">
              <FieldSet className="space-y-4 rounded-lg border p-4">
                <FieldLegend className="flex items-center gap-2 px-2 text-base font-semibold">
                  <Settings className="size-4 text-pink-600" />
                  Approval Workflow
                </FieldLegend>
                <Field>
                  <FieldLabel className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Approval hierarchy <RequiredStar />
                  </FieldLabel>
                  <Input
                    className="h-9 rounded-lg"
                    disabled
                    value={selectedHierarchy?.name || "No gift hierarchy found"}
                  />
                </Field>
                {selectedHierarchy?.approvers?.length ? (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      This application will go through:
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedHierarchy.approvers.map((approver, index) => (
                        <div key={approver.id} className="flex items-center">
                          <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1">
                            <span className="flex size-5 items-center justify-center rounded-full bg-pink-100 text-xs font-medium text-pink-700">
                              {index + 1}
                            </span>
                            <span className="text-sm">
                              {approver.user_name}
                            </span>
                          </div>
                          {index < selectedHierarchy.approvers!.length - 1 ? (
                            <ChevronRight className="mx-1 size-4 text-muted-foreground" />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {selectedHierarchy && !hasApprovers ? (
                  <p className="text-xs text-destructive">
                    This gift hierarchy has no approvers. Add an approver before
                    submitting an application.
                  </p>
                ) : null}
              </FieldSet>
              <FieldSet className="space-y-4 rounded-lg border p-4">
                <FieldLegend className="flex items-center gap-2 px-2 text-base font-semibold">
                  <Package className="size-4 text-pink-600" />
                  Gift Details
                </FieldLegend>
                <Field>
                  <FieldLabel className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Customer <RequiredStar />
                  </FieldLabel>
                  <CustomerSearch
                    value={customerId}
                    onReturn={(value) => setCustomerId(value)}
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Inventory items <RequiredStar />
                  </FieldLabel>
                  <InventorySearch
                    value={null}
                    data={inventory.filter(
                      (item) =>
                        Number(item.qty) > 0 &&
                        !requestedItems.some(
                          (requested) => requested.id === item.id,
                        ),
                    )}
                    onReturn={(item) =>
                      item.id &&
                      setRequestedItems((items) => [
                        ...items,
                        { id: Number(item.id), qty: 1 },
                      ])
                    }
                  />
                  <div className="mt-2 space-y-2">
                    {requestedItems.map((requested) => {
                      const item = inventory.find(
                        (value) => value.id === requested.id,
                      );
                      const available = Number(item?.qty || 0);
                      return (
                        <div
                          key={requested.id}
                          className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2"
                        >
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {item?.name || requested.id}
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              Available: {available}
                            </span>
                          </span>
                          <Input
                            className="h-8 w-20 rounded-lg"
                            type="number"
                            min={1}
                            max={available}
                            value={requested.qty}
                            onChange={(event) => {
                              const next = Math.min(
                                Math.max(1, Number(event.target.value) || 1),
                                available,
                              );
                              setRequestedItems((items) =>
                                items.map((value) =>
                                  value.id === requested.id
                                    ? { ...value, qty: next }
                                    : value,
                                ),
                              );
                            }}
                          />
                          <button
                            type="button"
                            className="rounded-md p-1 text-muted-foreground hover:bg-background hover:text-destructive"
                            onClick={() =>
                              setRequestedItems((items) =>
                                items.filter(
                                  (value) => value.id !== requested.id,
                                ),
                              )
                            }
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </Field>
                <Field>
                  <FieldLabel className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Reason <RequiredStar />
                  </FieldLabel>
                  <Textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="rounded-lg"
                    rows={4}
                  />
                </Field>
              </FieldSet>
              <FieldSet className="space-y-4 rounded-lg border p-4">
                <FieldLegend className="flex items-center gap-2 px-2 text-base font-semibold">
                  <ImagePlus className="size-4 text-pink-600" />
                  Gift Image
                </FieldLegend>
                <Field>
                  <FieldLabel className="text-[11px] font-semibold uppercase text-muted-foreground">
                    Image
                  </FieldLabel>
                  <Dropzone
                    value={image}
                    onDropFile={(file) => setImage(file as File | null)}
                  />
                </Field>
              </FieldSet>
              {error ? <FieldError errors={[{ message: error }]} /> : null}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg"
                  onClick={() => close(false)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={pending || !hasApprovers}
                  className="h-9 rounded-lg"
                >
                  {pending ? (
                    <Spinner className="size-4" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  Submit Gift Application
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
