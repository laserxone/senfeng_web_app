"use client";

import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import moment from "moment";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import Heading  from "./ui/heading";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import Spinner from "./ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { CommissionOwnerProps } from "@/lib/types";

const CommissionRecord = ({ data, fetchData } : {data : CommissionOwnerProps[], fetchData : ()=> Promise<void>}) => {
  const [visibleDisapprove, setVisibleDisapprove] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CommissionOwnerProps | null>(null);
  const [disapproveMsg, setDisapproveMsg] = useState("");
  const [disapproveLoading, setDisapproveLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const { userID, base_route } = useUserDetail();

  useEffect(() => {
    const totalCommission = data.reduce(
      (sum, item) => sum + Number(item.commission_amount),
      0
    );
    setTotal(totalCommission);
  }, [data]);

  const RenderEachRow = ({ item, onRefresh, onDisapprove } : {item : CommissionOwnerProps, onRefresh : ()=> Promise<void>, onDisapprove : ()=>void}) => {
    const [loading, setLoading] = useState(false);

    const [selectedPercentage, setSelectedPercentage] = useState<string | null>(null);
    const [showManual, setShowManual] = useState(false);
    const [manualNumber, setManualNumber] = useState<string | number>("");

    async function handleUpdate(
      id : number,
      is_approved : boolean | null,
      approval_date : Date | null,
      commission_amount : number | string | null
    ) {
      if (!id) return;
      setLoading(true);
      try {
        await axios.put(`/${userID}/commission/${id}`, {
          is_approved: is_approved,
          approval_date: approval_date,
          commission_amount: commission_amount,
        });
        await onRefresh();
        setShowManual(false);
        setManualNumber("");
        setSelectedPercentage(null);
      } catch (error) {
        console.error("Update failed:", error);
      } finally {
        setLoading(false);
      }
    }

    return (
      <TableRow>
        <TableCell>
          {item.request_date
            ? moment(item.request_date).format("YYYY-MM-DD")
            : ""}
        </TableCell>
        <TableCell>{item.user_name}</TableCell>
        <TableCell>
          <Link
            target="blank"
            href={`/${base_route}/member/${item.customer_id}/${
              item.sale_id
            }`}
            className="hover:underline"
          >
            {item.customer_name}
          </Link>
        </TableCell>
        <TableCell>
          <Link
            target="blank"
            href={`/${base_route}/member/${item.customer_id}/${
              item.sale_id
            }`}
            className="hover:underline"
          >
            {item.customer_owner}
          </Link>
        </TableCell>
        <TableCell>{item.machine_name}</TableCell>
        <TableCell>{item.total_amount}</TableCell>
        <TableCell>
          <div className="min-h-[40px] flex items-center gap-2">
            {item.is_approved ? (
              item.commission_amount
            ) : (
              <Select
                onValueChange={(val) => {
                  if (val === "manual") {
                    setShowManual(true);
                  } else {
                    setSelectedPercentage(val);
                  }
                }}
                value={selectedPercentage || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select %" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 9 }, (_, i) => {
                    const val = (i + 1).toString();
                    return (
                      <SelectItem key={val} value={val}>
                        {val}%
                      </SelectItem>
                    );
                  })}
                  <SelectItem value={"manual"}>Manual</SelectItem>
                </SelectContent>
              </Select>
            )}
            {showManual && (
              <Input
                value={manualNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  const regex = /^\d*\.?\d*$/;

                  if (regex.test(value)) {
                    const numericValue = Number(value);
                    setManualNumber(numericValue);
                  }
                }}
              />
            )}
          </div>
        </TableCell>
        <TableCell>{item.note}</TableCell>

        <TableCell>
          {loading ? (
            <Spinner />
          ) : item.commission_issued === true ? (
            <span className="text-green-600">Issued</span>
          ) : item.is_approved === null ? (
            <div className="flex gap-2 items-center">
              <Button
                disabled={showManual ? !manualNumber : !selectedPercentage}
                onClick={() =>
                  handleUpdate(
                    item.id,
                    true,
                    new Date(),
                    showManual
                      ? manualNumber
                      : (item.total_amount * Number(selectedPercentage || 0)) / 100
                  )
                }
              >
                Approve
              </Button>

              <Button onClick={onDisapprove}>Disapprove</Button>
            </div>
          ) : item.is_approved === false ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div>
                    <span className="text-red-600">Disapproved</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-red-600 mr-2">
                  <p className="text-white">{item.owner_note}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="flex gap-2 items-center">
              <span className="text-green-600">Approved</span>
              <Button onClick={() => handleUpdate(item.id, null, null, null)}>
                Undo
              </Button>
            </div>
          )}
        </TableCell>
      </TableRow>
    );
  };

  async function handleDisapprove() {
    if (!selectedItem?.id) return;
    setDisapproveLoading(true);
    try {
      await axios
        .put(`/${userID}/commission/${selectedItem?.id}`, {
          is_approved: false,
          owner_note: disapproveMsg,
        })
        .then(async () => {
          await axios.put(`/${userID}/machine/${selectedItem.sale_id}`, {
            payment_lock: false,
          });
        });
      await fetchData();
      setVisibleDisapprove(false);
      setDisapproveMsg("");
    } finally {
      setDisapproveLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading title="Commission" description="Approve employee commission" />
      </div>

      <div className="space-y-4">
        {data.length === 0 ? (
          <p>No data available.</p>
        ) : (
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <RenderEachRow
                    key={item.id}
                    item={item}
                    onRefresh={fetchData}
                    onDisapprove={() => {
                      setSelectedItem(item);
                      setVisibleDisapprove(true);
                    }}
                  />
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end mt-4">
              <div className="bg-green-600 text-white px-6 py-2 rounded-lg shadow font-semibold text-sm">
                ✅ Total Approved: {total}
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={visibleDisapprove}
        onOpenChange={(val) => {
          setVisibleDisapprove(val);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Commission</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            <Label>Rejection Message</Label>
            <Input
              placeholder="Enter message"
              value={disapproveMsg}
              onChange={(e) => setDisapproveMsg(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              disabled={disapproveLoading || !disapproveMsg}
              onClick={handleDisapprove}
            >
              {disapproveLoading && <Spinner />} Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommissionRecord;
