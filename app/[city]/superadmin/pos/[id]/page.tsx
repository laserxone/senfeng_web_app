"use client";
import { useParams } from "next/navigation";
import PaymentDetail from "@/components/pos/payment-detail";
import "react-medium-image-zoom/dist/styles.css";

export default function Page() {
  const params = useParams();
  return <PaymentDetail params={params} />;
}
