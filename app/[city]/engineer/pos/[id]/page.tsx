"use client";
import { useParams } from "next/navigation";
import PaymentDetail from "@/components/pos/payment-detail";

export default function Page() {
  const params = useParams();
  return <PaymentDetail params={params} />;
}
