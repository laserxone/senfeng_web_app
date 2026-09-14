import { useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "@/lib/axios";
import useUserDetail from "@/hooks/use-user-detail";
import { toast } from "sonner";
import { SearchItem } from "@/lib/types";
import { Trash2 } from "lucide-react";
import ConfirmationDialog from "@/components/shared/dialogs/alert-dialog";

export default function DeleteInvoice({
  item,
  onRefresh,
}: {
  item: SearchItem | null;
  onRefresh: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { userID, isAdmin } = useUserDetail();

  async function handleDeleteInvoice() {
    if (!item) return;
    const data = { inv_id: item.id, fields: item.fields };
    setLoading(true);

    try {
      const res = await axios.post(`/${userID}/pos/deleteinvoice`, data);
      toast.success("Invoice deleted successfully");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
      await onRefresh();
    }
  }
  if (!item) return null;
  if (!isAdmin) return null;
  return (
    <>
      <Button
        className="h-12 justify-start gap-2 rounded-lg border border-rose-200 bg-card px-2.5 text-left text-foreground shadow-none transition-colors duration-150 hover:border-rose-400 hover:bg-rose-500/[0.045] hover:shadow-sm disabled:opacity-55 dark:border-rose-900 dark:hover:border-rose-700"
        disabled={loading}
        variant="destructive"
        onClick={() => setConfirmOpen(true)}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          <Trash2 className="size-3.5" strokeWidth={2.2} />
        </span>
        <span className="min-w-0 truncate text-xs font-semibold tracking-tight">
          Delete Invoice
        </span>
      </Button>

      <ConfirmationDialog
        open={confirmOpen}
        loading={loading}
        title="Delete this invoice?"
        description="This permanently removes the invoice and linked payment records. Its reserved stock will be restored to inventory."
        onPressCancel={() => setConfirmOpen(false)}
        onPressYes={handleDeleteInvoice}
      />
    </>
  );
}
