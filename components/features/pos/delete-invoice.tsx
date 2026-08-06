import { useState } from "react";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import axios from "@/lib/axios";
import useUserDetail from "@/hooks/use-user-detail";
import { toast } from "sonner";

export default function DeleteInvoice({ item, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const { userID, isAdmin } = useUserDetail();

  async function handleDeleteInvoice() {
    const data = { inv_id: item.id, fields: item.fields };
    setLoading(true);

    try {
      const res = await axios.post(`/${userID}/pos/deleteinvoice`, data);
      toast.success("Invoice deleted successfully");
    } finally {
      setLoading(false);
      onRefresh();
    }
  }
  if (!item) return null;
  if (!isAdmin) return null;
  return (
    <Button
      className="h-[100px] w-[100px] text-wrap"
      disabled={loading}
      variant="destructive"
      onClick={() => handleDeleteInvoice()}
    >
      {loading && <Spinner />} Delete
    </Button>
  );
}
