"use client";

import { Heading } from "@/components/ui/heading";
import axios from "@/lib/axios";
import { UserContext } from "@/store/context/UserContext";
import { useContext, useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/config/firebase";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RequiredStar } from "@/components/RequiredStar";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import moment from "moment";

export default function Page() {
  const { state: UserState } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const hasFetched = useRef(false);
  const [search, setSearch] = useState("");
  const [comment, setComment] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [visible, setVisible] = useState(false);
  const [approveLoadingId, setApproveLoadingId] = useState(null);
  const [rejectionLoading, setRejectionLoading] = useState(false);
  const [machineApproveLoadingId, setMachineApproveLoadingId] = useState(null);

  const userId = UserState.value.data?.id;

  useEffect(() => {
    if (userId && !hasFetched.current) {
      hasFetched.current = true;
      fetchData();
    }
  }, [userId]);

  async function fetchData() {
    setLoading(true);
    try {
      const response = await axios.get("/old-commissions");
      console.log(response.data);
      setData(response.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = async (paymentId, machineId) => {
    try {
      await axios.put(`/payment-verification/${paymentId}`, {
        status: "approved",
        payment_lock: true,
      });

      // update the UI
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

  const handleApproveAll = async (machineId) => {
    setMachineApproveLoadingId(machineId);

    try {
      const pendingPayments = [];

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
      toast({ title: "All Payments updated" });
    } catch (err) {
      toast({ title: "Bulk approval failed", variant: "destructive" });
    } finally {
      setMachineApproveLoadingId(null);
    }
  };
  const handleReject = async (paymentId) => {
    setRejectionLoading(true);
    try {
      await axios.put(`/payment-verification/${paymentId}`, {
        status: "rejected",
        comment: comment,
      });

      // Optimistically update UI
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

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-start justify-between">
        <Heading title="Old Commissions" description="Clear old commissions" />
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
        <Accordion type="multiple" className="w-full space-y-4">
          {filteredData.map((customer) => (
            <AccordionItem
              key={customer.customer_id}
              value={customer.customer_id.toString()}
              className="border rounded-lg shadow-sm"
            >
              <AccordionTrigger className="text-left px-4 py-3 font-semibold text-lg">
                <div className="w-full flex flex-col sm:flex-row sm:justify-between">
                  <div>
                    <p>{customer?.customer_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Owner: {customer?.customer_owner}
                    </p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mt-2 sm:mt-0">
                      Number:{" "}
                      {Array.isArray(customer?.customer_number)
                        ? customer?.customer_number?.join(", ")
                        : customer?.customer_number}
                    </div>
                    <p className="text-sm text-muted-foreground">Manager: {customer?.customer_owner_name}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-muted px-4 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customer.machines.map((machine) => (
                    <Card key={machine.sale_id} className="shadow-md">
                      <CardContent className="p-4 space-y-1">
                        <p className="font-medium text-primary">
                          Serial No: {machine.serial_no}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Power: {machine.power || "N/A"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Source: {machine.source || "N/A"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Contract:{" "}
                          {machine.contract_date
                            ? moment(new Date(machine.contract_date)).format(
                                "YYY-MM-DD"
                              )
                            : "N/A"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Order No(s):{" "}
                          {machine.order_no_arr?.join(", ") || "N/A"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Sell By: {machine?.sold_by_name || "N/A"}
                        </p>
                         <p className="text-sm text-muted-foreground">
                          Price: {machine?.price || "N/A"}
                        </p>
                        {machine?.speed_money && (
                          <p className="text-sm text-muted-foreground">
                            Amount: {machine?.speed_money_amount}, Note:{" "}
                            {machine?.speed_money_note}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
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

const RenderImage = ({ img }) => {
  const [localImage, setLocalImage] = useState(null);
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
  if (!img || error || !localImage) return <p>No signature</p>;

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
