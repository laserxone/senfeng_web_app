import { useState } from "react";
import { Button } from "../ui/button";
import Spinner from "../ui/spinner";
import axios from "@/lib/axios";
import useUserDetail from "@/hooks/use-user-detail";
import { useToast } from "@/hooks/use-toast";

export default function DeleteInvoice({ item, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const { userID, isAdmin } = useUserDetail();
  const {toast} = useToast();

  async function handleDeleteInvoice() {
    const data = { inv_id: item.id, fields: item.fields };
    setLoading(true);

    try {
      const res = await axios.post(`/${userID}/pos/deleteinvoice`, data);
      toast({ title: "Invoice deleted successfully" });
    } finally {
      setLoading(false);
        onRefresh()
    }
  }
  if (!item) return null;
  if(!isAdmin) return null
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
