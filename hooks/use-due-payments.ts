import axios from "@/lib/axios";
import { useEffect, useState } from "react";
import useUserDetail from "./use-user-detail";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";

export function useDuePayments() {
  const [pending, setPending] = useState(0);

  const { userID } = useUserDetail();

  const fetchData = async () => {
    const response = await axios.get(`/${userID}/payment-requests`);
    const filterData = response.data.filter((item : any)=> item.request_type)
    setPending(filterData?.length || 0);
  };

  useEffect(() => {
    if (!userID) return;
    fetchData();

    const unsub = onSnapshot(doc(db, "payment-requests", "requests"), () => {
      fetchData();
    });

    return () => unsub();
  }, [userID]);

  return { pending, setPending, fetchData };
}
