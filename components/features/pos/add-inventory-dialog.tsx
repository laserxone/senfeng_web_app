"use client";

import { Button } from "@/components/ui/button";
import { RequiredStar } from "@/components/shared/common/RequiredStar";
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
import { Textarea } from "@/components/ui/textarea";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { PackagePlus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type InventoryDraft = {
  name: string;
  serial_no: string;
  model: string;
  power: string;
  unit: string;
  chinese_name: string;
  price: string;
  buying: string;
  remarks: string;
};

const emptyItem = (): InventoryDraft => ({
  name: "",
  serial_no: "",
  model: "",
  power: "",
  unit: "",
  chinese_name: "",
  price: "",
  buying: "",
  remarks: "",
});

export function AddInventoryDialog({
  onSaved,
}: {
  onSaved: () => Promise<void>;
}) {
  const { isAdmin, userID } = useUserDetail();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InventoryDraft[]>([emptyItem()]);
  const [pending, setPending] = useState(false);

  if (!isAdmin) return null;

  const updateItem = (
    index: number,
    field: keyof InventoryDraft,
    value: string,
  ) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const close = (nextOpen: boolean) => {
    if (pending) return;
    setOpen(nextOpen);
    if (!nextOpen) setItems([emptyItem()]);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      items.some(
        (item) =>
          !item.name.trim() ||
          !item.serial_no.trim() ||
          item.price === "" ||
          item.buying === "",
      )
    ) {
      toast.error(
        "Name, serial number, price, and buying price are required for every item.",
      );
      return;
    }

    setPending(true);
    try {
      await axios.post(`/${userID}/pos/inventory`, { items });
      toast.success(
        `${items.length} inventory item${items.length === 1 ? "" : "s"} added.`,
      );
      await onSaved();
      setOpen(false);
      setItems([emptyItem()]);
    } catch (error) {
      console.error(error);
      toast.error("Unable to add inventory items.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Button
        className="group h-12 justify-start gap-2 rounded-lg border border-border bg-card px-2.5 text-left text-foreground shadow-none transition-colors duration-150 hover:border-primary/35 hover:bg-primary/[0.04] hover:shadow-sm"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
          <PackagePlus className="size-3.5" strokeWidth={2.2} />
        </span>
        <span className="min-w-0 truncate text-xs font-semibold tracking-tight">
          Add New Item in Inventory
        </span>
      </Button>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-3xl">
          <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                <PackagePlus className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold">
                  Add inventory items
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  New items start with zero quantity and can be received through
                  Inward.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(100dvh-132px)]">
            <form
              onSubmit={submit}
              className="space-y-3 p-3.5 [&_input]:h-9 [&_input]:rounded-lg [&_textarea]:rounded-lg [&_label]:text-[11px] [&_label]:font-semibold [&_label]:uppercase [&_label]:tracking-wide [&_label]:text-muted-foreground"
            >
              {items.map((item, index) => (
                <section
                  key={index}
                  className="space-y-3 rounded-xl border border-border bg-muted/20 p-3"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                      Item #{index + 1}
                    </Label>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={items.length === 1 || pending}
                      onClick={() =>
                        setItems((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        "name",
                        "serial_no",
                        "model",
                        "power",
                        "unit",
                        "chinese_name",
                        "price",
                        "buying",
                      ] as const
                    ).map((field) => (
                      <Label
                        key={field}
                        className={
                          field === "unit" || field === "chinese_name"
                            ? "col-span-2"
                            : ""
                        }
                      >
                        {field.replace("_", " ")}
                        {(field === "name" ||
                          field === "serial_no" ||
                          field === "price" ||
                          field === "buying") && <RequiredStar />}
                        <Input
                          value={item[field]}
                          type={
                            field === "price" || field === "buying"
                              ? "number"
                              : "text"
                          }
                          min={
                            field === "price" || field === "buying"
                              ? "0"
                              : undefined
                          }
                          step={
                            field === "price" || field === "buying"
                              ? "0.01"
                              : undefined
                          }
                          required={
                            field === "name" ||
                            field === "serial_no" ||
                            field === "price" ||
                            field === "buying"
                          }
                          disabled={pending}
                          onChange={(event) =>
                            updateItem(index, field, event.target.value)
                          }
                        />
                      </Label>
                    ))}
                    <Label className="col-span-2">
                      Remarks
                      <Textarea
                        className="min-h-20 resize-y"
                        value={item.remarks}
                        disabled={pending}
                        onChange={(event) =>
                          updateItem(index, "remarks", event.target.value)
                        }
                      />
                    </Label>
                  </div>
                </section>
              ))}
              <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg"
                  disabled={pending}
                  onClick={() =>
                    setItems((current) => [...current, emptyItem()])
                  }
                >
                  <Plus className="h-4 w-4" /> Add more item
                </Button>
                <Button
                  type="submit"
                  className="h-9 rounded-lg"
                  disabled={pending}
                >
                  {pending && <Spinner />} Add {items.length} item
                  {items.length === 1 ? "" : "s"}
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
