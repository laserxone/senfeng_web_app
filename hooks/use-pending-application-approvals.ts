import axios from "@/lib/axios";
import { db } from "@/config/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import useUserDetail from "./use-user-detail";

export type PendingApplicationApprovals = {
  loan: number;
  backup: number;
  gift: number;
  total: number;
};

const emptyCounts: PendingApplicationApprovals = {
  loan: 0,
  backup: 0,
  gift: 0,
  total: 0,
};

export function usePendingApplicationApprovals() {
  const { userID } = useUserDetail();
  const [pendingApprovals, setPendingApprovals] =
    useState<PendingApplicationApprovals>(emptyCounts);

  const fetchPendingApprovals = useCallback(async () => {
    if (!userID) return;
    try {
      const response = await axios.get(`/${userID}/pending-approvals`);
      setPendingApprovals(response.data);
    } catch (error) {
      console.error("Unable to fetch pending application approvals", error);
    }
  }, [userID]);

  useEffect(() => {
    if (!userID) {
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "pending-approvals", String(userID)),
      fetchPendingApprovals,
    );

    return () => unsubscribe();
  }, [userID, fetchPendingApprovals]);

  return {
    pendingApprovals,
    fetchPendingApprovals,
  };
}
