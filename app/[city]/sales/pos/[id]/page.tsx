"use client";
import { useParams } from "next/navigation";
import PaymentDetail from "@/components/features/pos/payment-detail";

export default function Page() {
  const params = useParams();
  return <PaymentDetail params={params} />;
}
