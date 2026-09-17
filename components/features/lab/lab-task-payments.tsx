"use client";

import AppCalendar from "@/components/features/calendar/app-calendar";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { LabTaskPayment } from "@/lib/types";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { CheckCircle2, CreditCard, Plus, XCircle } from "lucide-react";
import moment from "moment";
import { useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type PaymentForm = {
  amount: string;
  mode: string;
  note: string;
  received_by: string;
  transaction_date: Date | undefined;
  clearance_date: Date | undefined;
  remarks: string;
  cheque_id: string;
};

const initialForm: PaymentForm = {
  amount: "",
  mode: "",
  note: "",
  received_by: "",
  transaction_date: new Date(),
  clearance_date: undefined,
  remarks: "",
  cheque_id: "",
};

export default function LabTaskPayments({
  labTaskId,
  charges,
  approvedTotal,
  remainingBalance,
}: {
  labTaskId: number;
  charges: string;
  approvedTotal?: number | string;
  remainingBalance?: number | string;
}) {
  const { userID } = useUserDetail();
  const [payments, setPayments] = useState<LabTaskPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function refresh() {
    if (!userID || !labTaskId) return;
    setLoading(true);
    try {
      const response = await axios.get(`/${userID}/lab/${labTaskId}/payments`);
      setPayments(response.data);
    } catch {
      toast.error("Unable to load lab payments");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, [userID, labTaskId]);

  const calculatedApproved = useMemo(
    () =>
      payments
        .filter((item) => item.status === "approved")
        .reduce((total, item) => total + Number(item.amount || 0), 0),
    [payments],
  );
  const totalCharges = Number(charges || 0);
  const received =
    approvedTotal === undefined
      ? calculatedApproved
      : Number(approvedTotal || 0);
  const balance =
    remainingBalance === undefined
      ? Math.max(totalCharges - received, 0)
      : Number(remainingBalance || 0);

  return (
    <section className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Lab payments
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Payment history and verification status
          </p>
        </div>
        <Button
          size="sm"
          className="h-8 rounded-lg"
          onClick={() => setOpen(true)}
        >
          <Plus className="mr-1.5 size-3.5" /> Add payment
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Metric label="Charges" value={totalCharges} />
        <Metric label="Approved" value={received} tone="text-emerald-600" />
        <Metric label="Balance" value={balance} tone="text-amber-600" />
      </div>
      <div className="mt-3 space-y-2">
        {loading && (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        )}
        {!loading && !payments.length && (
          <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
            No payments recorded.
          </p>
        )}
        {payments.map((payment) => (
          <PaymentRow
            key={payment.id}
            payment={payment}
            labTaskId={labTaskId}
            onChanged={refresh}
          />
        ))}
      </div>
      <LabPaymentDialog
        open={open}
        onOpenChange={setOpen}
        labTaskId={labTaskId}
        onSaved={async () => {
          await refresh();
          setOpen(false);
        }}
      />
    </section>
  );
}

function PaymentRow({
  payment,
  labTaskId,
  onChanged,
}: {
  payment: LabTaskPayment;
  labTaskId: number;
  onChanged: () => Promise<void>;
}) {
  const { userID, isAdmin } = useUserDetail();
  const [updating, setUpdating] = useState(false);
  async function verify(status: "approved" | "rejected") {
    setUpdating(true);
    try {
      await axios.put(`/${userID}/lab/${labTaskId}/payments/${payment.id}`, {
        status,
        payment_lock: status === "approved",
      });
      toast.success(`Payment ${status}`);
      await onChanged();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to update payment");
    } finally {
      setUpdating(false);
    }
  }
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">
            Rs. {Number(payment.amount).toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {payment.mode} · TID: {payment.note}
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            payment.status === "approved"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : payment.status === "rejected"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
          }
        >
          {payment.status}
        </Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {payment.received_by} ·{" "}
        {moment(payment.transaction_date).format("DD MMM YYYY")}
        {payment.cheque_id ? ` · Cheque: ${payment.cheque_id}` : ""}
      </p>
      {payment.remarks && <p className="mt-1 text-xs">{payment.remarks}</p>}
      {isAdmin && payment.status === "pending" && (
        <div className="mt-3 flex gap-2">
          <Button
            disabled={updating}
            size="sm"
            className="h-7 rounded-md text-xs"
            onClick={() => verify("approved")}
          >
            <CheckCircle2 className="mr-1 size-3.5" /> Approve
          </Button>
          <Button
            disabled={updating}
            size="sm"
            variant="outline"
            className="h-7 rounded-md text-xs text-destructive"
            onClick={() => verify("rejected")}
          >
            <XCircle className="mr-1 size-3.5" /> Reject
          </Button>
        </div>
      )}
    </div>
  );
}

function LabPaymentDialog({
  open,
  onOpenChange,
  labTaskId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labTaskId: number;
  onSaved: () => Promise<void>;
}) {
  const { userID } = useUserDetail();
  const { state: officeState } = useContext(OfficeContext)!;
  const [form, setForm] = useState<PaymentForm>(initialForm);
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setImage("");
    }
  }, [open]);
  function set<K extends keyof PaymentForm>(key: K, value: PaymentForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function selectMode(mode: string) {
    set("mode", mode);
    if (mode === "Cash") set("note", moment().format("YYYYMMDDHHmmss"));
  }
  function readImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result || ""));
    reader.readAsDataURL(file);
  }
  async function save() {
    if (
      !form.amount ||
      !form.mode ||
      !form.note ||
      !form.received_by ||
      !form.transaction_date
    ) {
      toast.error(
        "Amount, mode, TID, received by, and transaction date are required.",
      );
      return;
    }
    if (form.mode === "Cheque" && !form.cheque_id) {
      toast.error("Cheque ID is required for cheque payments.");
      return;
    }
    setSaving(true);
    try {
      let imagePath: string | null = null;
      if (image) {
        const office = officeState.value.data || "lahore";
        imagePath = `${office}/lab/${labTaskId}/payments/${moment().valueOf()}.png`;
        await UploadImage(image, imagePath);
      }
      await axios.post(`/${userID}/lab/${labTaskId}/payments`, {
        ...form,
        amount: Number(form.amount),
        transaction_date: form.transaction_date.toISOString(),
        clearance_date: form.clearance_date?.toISOString() ?? null,
        image: imagePath,
        status: "pending",
        payment_lock: false,
      });
      toast.success("Lab payment added");
      await onSaved();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to add payment");
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-md">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <CreditCard className="size-4" />
            </span>
            <div>
              <DialogTitle className="text-sm font-semibold">
                Add Lab Payment
              </DialogTitle>
              <DialogDescription className="text-xs">
                Record payment and supporting details.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          <div className="space-y-3 p-3.5">
            <LabField label="Amount">
              <Input
                type="number"
                min="0"
                className="h-9 rounded-lg"
                value={form.amount}
                onChange={(event) => set("amount", event.target.value)}
              />
            </LabField>
            <LabField label="Payment mode">
              <select
                className="h-9 w-full rounded-lg border bg-background px-3 text-sm"
                value={form.mode}
                onChange={(event) => selectMode(event.target.value)}
              >
                <option value="">Select mode</option>
                {["Cheque", "Cash", "Deposit", "Online", "Pay Order"].map(
                  (item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ),
                )}
              </select>
            </LabField>
            <LabField label="TID">
              <Input
                className="h-9 rounded-lg"
                value={form.note}
                onChange={(event) => set("note", event.target.value)}
              />
            </LabField>
            {form.mode === "Cheque" && (
              <LabField label="Cheque ID">
                <Input
                  className="h-9 rounded-lg"
                  value={form.cheque_id}
                  onChange={(event) => set("cheque_id", event.target.value)}
                />
              </LabField>
            )}
            <LabField label="Received by">
              <Input
                className="h-9 rounded-lg"
                value={form.received_by}
                onChange={(event) => set("received_by", event.target.value)}
              />
            </LabField>
            <LabField label="Transaction date">
              <AppCalendar
                date={form.transaction_date}
                onChange={(value) => set("transaction_date", value)}
              />
            </LabField>
            <LabField label="Clearance date">
              <AppCalendar
                date={form.clearance_date}
                onChange={(value) => set("clearance_date", value)}
              />
            </LabField>
            <LabField label="Receipt image">
              <Input
                type="file"
                accept="image/*"
                className="h-9 rounded-lg"
                onChange={readImage}
              />
            </LabField>
            <LabField label="Remarks">
              <Textarea
                value={form.remarks}
                onChange={(event) => set("remarks", event.target.value)}
              />
            </LabField>
            <Button
              className="h-9 w-full rounded-lg"
              disabled={saving}
              onClick={save}
            >
              {saving && <Spinner />} Save Payment
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Metric({
  label,
  value,
  tone = "",
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-2.5">
      <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className={`mt-1 text-sm font-semibold ${tone}`}>
        Rs. {value.toLocaleString()}
      </p>
    </div>
  );
}
function LabField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </Label>
      {children}
    </div>
  );
}
