import { db } from "@/config/firebase";
import axios from "@/lib/axios";
import { doc, onSnapshot } from "firebase/firestore";
import moment from "moment";
import { useEffect, useState } from "react";
import useUserDetail from "./use-user-detail";

export type ChequeAlert = {
  id: number;
  link: string;
  title: string;
  date: string;
  amount: string | number;
  price?: string | number | null;
  serial_no: string;
  sale_id: number;
  customer_id: number;
  customer_name: string;
  customer_owner: string;
  seller_name: string;
  seller_dp: string;
};

export function useChequeAlerts() {
  const [info, setInfo] = useState<ChequeAlert[]>([]);
  const { userID } = useUserDetail();

  async function fetchData() {
    axios.get(`/${userID}/reminders`).then((response) => {
      setInfo(response.data);
    });
  }

  useEffect(() => {
    if (!userID) return;
    fetchData();

    const unsub = onSnapshot(doc(db, "cheque-alerts", "cheques"), () => {
      fetchData();
    });

    return () => unsub();
  }, [userID]);

  const today = moment().startOf("day");

  const grouped = {
    today: info.filter((t) => moment(t.date).isSame(today, "day")),
    passed: info.filter((t) => moment(t.date).isBefore(today, "day")),
    upcoming: info.filter((t) => moment(t.date).isAfter(today, "day")),
  };
  const count = info.length;

  return { info, grouped, count: count };
}
