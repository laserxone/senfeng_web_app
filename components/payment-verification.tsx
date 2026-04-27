"use client";

import { RequiredStar } from "@/components/RequiredStar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Heading from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import { storage } from "@/config/firebase";

import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { Payment } from "@/lib/types";
import { getDownloadURL, ref } from "firebase/storage";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { ChevronRight } from "lucide-react";


type Machine = {
  machine_id: number;
  serial_no: string;
  power: string;
  source: string;
  contract_date: string;
  payments: Payment[];
  order_no_arr: string[]
};

type CustomerMachinePayments = {
  customer_id: number;
  customer_name: string;
  customer_owner: string;
  customer_number: string[];
  machines: Machine[];
};

export default function PaymentVerification() {
  const { userID } = useUserDetail();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CustomerMachinePayments[]>([]);
  const hasFetched = useRef(false);
  const [search, setSearch] = useState("");
  const [comment, setComment] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [approveLoadingId, setApproveLoadingId] = useState<number | null>(null);
  const [rejectionLoading, setRejectionLoading] = useState(false);
  const [machineApproveLoadingId, setMachineApproveLoadingId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggleRow = (id: number) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    if (userID && !hasFetched.current) {
      hasFetched.current = true;
      fetchData();
    }
  }, [userID]);

  async function fetchData() {
    setLoading(true);
    try {
      const response = await axios.get(`/${userID}/payment-verification`);
      setData(response.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = async (paymentId: number, machineId: number) => {
    try {
      await axios.put(`/${userID}/payment-verification/${paymentId}`, {
        status: "approved",

      });


      setData((prevData) =>
        prevData.map((customer) => ({
          ...customer,
          machines: customer.machines.map((machine) => {
            if (machine.machine_id !== machineId) return machine;
            return {
              ...machine,
              payments: machine.payments.map((payment) =>
                payment.id === paymentId
                  ? { ...payment, status: "approved", payment_lock: true }
                  : payment
              ),
            };
          }),
        }))
      );
    } catch (err) {
      console.error("Approve failed", err);
    } finally {
      setApproveLoadingId(null);
    }
  };

  const handleApproveAll = async (machineId: number) => {
    setMachineApproveLoadingId(machineId);

    try {
      const pendingPayments: number[] = [];

      data.forEach((customer) => {
        customer.machines.forEach((machine) => {
          if (machine.machine_id === machineId) {
            machine.payments.forEach((payment) => {
              if (payment.status === "pending") {
                pendingPayments.push(payment.id);
              }
            });
          }
        });
      });

      await Promise.all(
        pendingPayments.map((paymentId) => handleApprove(paymentId, machineId))
      );
      toast.success("All Payments updated");
    } catch (err) {
      toast.error("Bulk approval failed");
    } finally {
      setMachineApproveLoadingId(null);
    }
  };
  const handleReject = async (paymentId: number | null) => {
    if (!paymentId) return
    setRejectionLoading(true);
    try {
      await axios.put(`/${userID}/payment-verification/${paymentId}`, {
        status: "rejected",
        comment: comment,
      });

      setData((prevData) =>
        prevData.map((customer) => ({
          ...customer,
          machines: customer.machines.map((machine) => ({
            ...machine,
            payments: machine.payments.map((payment) =>
              payment.id === paymentId
                ? { ...payment, status: "rejected", comment }
                : payment
            ),
          })),
        }))
      );

      setVisible(false);
      setComment("");
    } catch (err) {
      console.error("Reject failed", err);
    } finally {
      setRejectionLoading(false);
    }
  };

  const filteredData = data.filter((item) =>
    `${item.customer_name} ${item.customer_owner}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const getUnverifiedPaymentCount = (data: CustomerMachinePayments[]) => {
    let count = 0;

    data.forEach((customer) => {
      customer.machines.forEach((machine) => {
        machine.payments.forEach((payment) => {
          if (payment.status !== "approved") {
            count++;
          }
        });
      });
    });

    return count;
  };

  const unverifiedCount = getUnverifiedPaymentCount(data);

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-start justify-between">
        <Heading title="Payment Verification" description="Verify payments" />
        <p>
          <strong>Unverified Payments:</strong>
          <Label className="text-2xl">{unverifiedCount}</Label>
        </p>
      </div>

      <Input
        className="bg-white"
        placeholder="Search customer"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="flex flex-1 justify-center">
          <Spinner />
        </div>
      ) : (

        filteredData.map((customer) => (
          <Collapsible key={`customer-${customer.customer_id}`}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"

                className="group w-full justify-start transition-none hover:bg-card hover:text-accent-foreground "
              >
                <ChevronRight className="transition-transform group-data-[state=open]:rotate-90" />
                {customer.customer_name} ({customer.customer_owner})
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pl-4 rounded-md p-4 ml-5 ">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Number:</strong>{" "}
                {customer.customer_number?.join(", ")}
              </p>
              {customer.machines.map((machine) => (
                <Collapsible key={`machine-${machine.machine_id}`}>

                  <CollapsibleTrigger asChild
                    key={`machine-${machine.machine_id}`}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="group w-full justify-start transition-none hover:bg-card hover:text-accent-foreground"
                    >
                      <ChevronRight className="transition-transform group-data-[state=open]:rotate-90" />
                      Machine #{machine.serial_no}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 p-3 rounded-md shadow-inner">
                    <Button
                      disabled={
                        machineApproveLoadingId === machine.machine_id
                      }
                      className="my-2"
                      onClick={() => handleApproveAll(machine.machine_id)}
                    >
                      {machineApproveLoadingId === machine.machine_id ? (
                        <Spinner className="mr-2 h-4 w-4" />
                      ) : null}{" "}
                      Approve All Payments
                    </Button>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>
                        <strong>Contract:</strong>{" "}
                        {machine.contract_date
                          ? moment(new Date(machine.contract_date)).format(
                            "YYYY-MM-DD"
                          )
                          : ""}
                      </p>
                      <p>
                        <strong>Power:</strong> {machine.power}
                      </p>
                      <p>
                        <strong>Source:</strong> {machine.source}
                      </p>
                      <p>
                        <strong>Order No:</strong>{" "}
                        {machine.order_no_arr?.join(", ")}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {machine.payments.map((payment) => (
                        <div
                          key={`payment-${payment.id}`}
                          className="border rounded-md p-3 flex flex-col md:flex-row justify-between items-start md:items-center bg-muted/30 shadow-sm"
                        >
                          <div className="text-sm space-y-1">
                            <p>
                              <strong>Amount:</strong> {payment.amount}
                            </p>
                            <p>
                              <strong>TID:</strong> {payment.note}
                            </p>
                            <p>
                              <strong>Status:</strong>{" "}
                              <span
                                className={`font-medium ml-1 ${payment.status === "approved"
                                  ? "text-green-600"
                                  : payment.status === "rejected"
                                    ? "text-red-600"
                                    : "text-yellow-600"
                                  }`}
                              >
                                {payment.status}
                              </span>
                            </p>
                            {payment.status === "rejected" && (
                              <p>
                                <strong>Reason:</strong> {payment.comment}
                              </p>
                            )}
                            {payment.image && (
                              <div className="mt-2">
                                <RenderImage img={payment.image} />
                              </div>
                            )}
                          </div>

                          {payment.status !== "approved" &&
                            payment.status !== "rejected" && (
                              <div className="flex gap-2 mt-3 md:mt-0 md:ml-4">
                                <Button
                                  size="sm"
                                  disabled={approveLoadingId === payment.id}
                                  onClick={() => {
                                    setApproveLoadingId(payment.id);
                                    handleApprove(
                                      payment.id,
                                      machine.machine_id
                                    );
                                  }}
                                >
                                  {approveLoadingId === payment.id ? (
                                    <Spinner className="mr-2 h-4 w-4" />
                                  ) : null}
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedPayment(payment.id);
                                    setVisible(true);
                                  }}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>


                </Collapsible>
              ))}
            </CollapsibleContent>

          </Collapsible>
        ))
      )}

      <Dialog open={visible} onOpenChange={setVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject reason</DialogTitle>
            <div className="flex flex-1 flex-col gap-2">
              <h1>
                Enter reason for rejection <RequiredStar />
              </h1>
              <Input
                placeholder="Reason"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />

              <Button
                disabled={!comment || rejectionLoading}
                onClick={() => handleReject(selectedPayment)}
              >
                {rejectionLoading && <Spinner className="mr-2 h-4 w-4" />}
                Save
              </Button>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const RenderImage = ({ img }: { img: string }) => {
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!img) {
      setLocalImage(null);
      setError(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    if (img.includes("http")) {
      setLocalImage(img);
      setLoading(false);
    } else {
      getDownloadURL(ref(storage, img))
        .then((url) => {
          setLocalImage(url);
        })
        .catch(() => {
          setError(true);
          setLocalImage(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [img]);

  if (loading) return <Spinner />;
  if (!img || error || !localImage) return <p>No image</p>;

  return (
    <Zoom>
      <img
        alt="visit image"
        className="dark:invert"
        src={localImage}
        width="100"
      />
    </Zoom>
  );
};
