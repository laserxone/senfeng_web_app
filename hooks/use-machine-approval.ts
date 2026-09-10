import axios from "@/lib/axios";
import { useEffect, useState } from "react";
import useUserDetail from "./use-user-detail";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";

export type PendingMachineApproval = {
  id: number;
  customer_id: number;
  type: "Machine" | "Parts" | string;
  serial_no: string | null;
  power: string | null;
  source: string | null;
  parts_information: Record<string, unknown>[] | null;
  member: boolean;
  customer_name: string | null;
  customer_owner: string | null;
  sell_by_name: string | null;
  ownership_name: string | null;
};

export function useMachineApproval() {
  const [pending, setPending] = useState<PendingMachineApproval[]>([]);

  const { userID } = useUserDetail();

  const fetchData = async () => {
    const response = await axios.get(`/${userID}/machine/approval`);
    setPending(response.data ?? []);
  };

  useEffect(() => {
    if (!userID) return;
    fetchData();

    const unsub = onSnapshot(doc(db, "machine", "approval"), () => {
      fetchData();
    });

    return () => unsub();
  }, [userID]);

  return { pending, setPending, fetchData };
}
