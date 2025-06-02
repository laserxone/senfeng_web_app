"use client";

import { UserContext } from "@/store/context/UserContext";
import { useContext, useEffect, useState } from "react";
import { Heading } from "../ui/heading";
import axios from "@/lib/axios";
import { BASE_URL } from "@/constants/data";
import { Card, CardContent } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import Spinner from "../ui/spinner";
import { Button } from "../ui/button";
import Link from "next/link";
import moment from "moment";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "../ui/toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export default function Commission({ owner }) {
  return owner ? <OwnerView /> : <OtherView />;
}

const OwnerView = () => {
  const { state: UserState } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleDisapprove, setVisibleDisapprove] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [disapproveMsg, setDisapproveMsg] = useState("");
  const [disapproveLoading, setDisapproveLoading] = useState(false);

  useEffect(() => {
    if (UserState.value.data?.id) {
      fetchData();
    }
  }, [UserState]);

  async function fetchData() {
    return new Promise(async (resolve, reject) => {
      try {
        const route = `/commission`;
        const response = await axios.get(route);
        setData(response.data);
      } catch (error) {
      } finally {
        resolve(true);
        setLoading(false);
      }
    });
  }

  const RenderEachRow = ({ item, onRefresh, onDisapprove }) => {
    const [loading, setLoading] = useState(false);
    const { state: UserState } = useContext(UserContext);
    const [selectedPercentage, setSelectedPercentage] = useState(null);
    const [showManual, setShowManual] = useState(false);
    const [manualNumber, setManualNumber] = useState("");

    async function handleUpdate(
      id,
      is_approved,
      approval_date,
      commission_amount
    ) {
      if (!id) return;
      setLoading(true);
      try {
        await axios.put(`/commission/${id}`, {
          is_approved: is_approved,
          approval_date: approval_date,
          commission_amount: commission_amount,
        });
        await onRefresh();
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
            href={`/${UserState.value.data?.base_route}/member/${item.customer_id}/${item.sale_id}`}
            className="hover:underline"
          >
            {item.customer_name || item.customer_owner}
          </Link>
        </TableCell>
        <TableCell>{item.machine_name}</TableCell>
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
                type="number"
                value={manualNumber}
                onChange={(e) => {
                  if (!isNaN(e.target.value)) {
                    setManualNumber(Number(e.target.value));
                    setSelectedPercentage(Number(e.target.value));
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
          ) : item.is_approved === null ? (
            <div className="flex gap-2 items-center">
              <Button
                disabled={!selectedPercentage}
                onClick={() =>
                  handleUpdate(
                    item.id,
                    true,
                    new Date(),
                    (item.total_amount * selectedPercentage) / 100
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
        .put(`/commission/${id}`, {
          is_approved: false,
          owner_note: disapproveMsg,
        })
        .then(async () => {
          await axios.put(`/machine/${item.sale_id}`, {
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

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-4">
          {data.length === 0 ? (
            <p>No data available.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Machine</TableHead>
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
          )}
        </div>
      )}

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
            <Button disabled={disapproveLoading || !disapproveMsg} onClick={handleDisapprove}>
              {disapproveLoading && <Spinner />} Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const OtherView = () => {
  const { state: UserState } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (UserState.value.data?.id) {
      fetchData(UserState.value.data?.id);
    }
  }, [UserState]);

  async function fetchData(id) {
    return new Promise(async (resolve, reject) => {
      try {
        const route = `/user/${id}/commission`;
        const response = await axios.get(route);
        setData(response.data);
      } catch (error) {
      } finally {
        resolve(true);
        setLoading(false);
      }
    });
  }

  const RenderEachRow = ({ item, onRefresh }) => {
    const [loading, setLoading] = useState(false);
    const { state: UserState } = useContext(UserContext);
    const [note, setNote] = useState(item?.note || "");

    async function handleApplyCommission(id, amount, item) {
      if (item.customer.profile_completion < 100) {
        toast({
          title: "Incomplete data",
          description:
            "Data incomplete in customer record, kindly enter all data in this customer",
          variant: "destructive",
          action: (
            <ToastAction
              onClick={() => {
                window.open(
                  `/${UserState.value.data?.base_route}/member/${item.customer.id}`,
                  "_blank"
                );
              }}
              altText="Open customer"
            >
              Open customer
            </ToastAction>
          ),
        });
        return;
      }
      if (item.percentage_completion < 100) {
        toast({
          title: "Incomplete data",
          description:
            "Data incomplete in machine record, kindly enter all data in this machine",
          variant: "destructive",
          action: (
            <ToastAction
              onClick={() => {
                window.open(
                  `/${UserState.value.data?.base_route}/member/${item.customer.id}/${item.id}`,
                  "_blank"
                );
              }}
              altText="Open Machine"
            >
              Open Machine
            </ToastAction>
          ),
        });
        return;
      }
      if (!id) return;
      setLoading(true);

      let totalPrice = item.price;

      if (item.speed_money_amount && Number(item.speed_money_amount) > 0) {
        totalPrice = Number(item.price) - Number(item.speed_money_amount);
      }

      try {
        await axios
          .post(`/commission`, {
            sale_id: id,
            user_id: UserState.value.data?.id,
            is_requested: true,
            total_amount: totalPrice,
            note: note,
          })
          .then(async () => {
            await axios
              .put(`/machine/${id}`, {
                payment_lock: true,
              })
              .then(async () => {
                await onRefresh();
              });
          });
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }

    async function handleApplyCommissionAgain(id) {
      if (!id) return;
      setLoading(true);

      try {
        await axios
          .put(`/commission/${id}`, {
            is_requested: true,
            is_approved: null,
            note: note,
          })
          .then(async () => {
            await axios
              .put(`/machine/${id}`, {
                payment_lock: true,
              })
              .then(async () => {
                await onRefresh();
              });
          });
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }

    return (
      <Card className="max-w-[calc(100vw-34px)]">
        <CardContent className="p-4 space-y-2">
          <Link
            target="blank"
            href={`/${UserState.value.data?.base_route}/member/${item.customer_id}/${item.id}`}
          >
            <h2 className="font-semibold text-lg hover:underline">
              Customer: {item.customer?.name || item.customer?.owner || "NIL"}
            </h2>
          </Link>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Commission Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{item.serial_no}</TableCell>
                  <TableCell>{item.created_amount}</TableCell>
                  <TableCell>{item.paid_amount}</TableCell>
                  <TableCell>{item.balance}</TableCell>
                  <TableCell>
                    {item.balance !== 0 ? null : item.commission?.id ? (
                      <span>{item.commission?.note}</span>
                    ) : (
                      <div className="flex flex-row gap-2">
                        <Input
                          value={note || ""}
                          onChange={(e) => setNote(e.target.value)}
                        />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.balance !== 0 ? (
                      <span className="text-red-600">
                        Payment not cleared yet
                      </span>
                    ) : item.commission?.id ? (
                      item.commission.is_approved === true ? (
                        <span className="text-green-600">Approved</span>
                      ) : item.commission.is_approved === false ? (
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div>
                                  <span className="text-red-600">
                                    Disapproved
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="bg-red-600 mr-2">
                                <p className="text-white">{item.owner_note}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Button
                            onClick={() =>
                              handleApplyCommissionAgain(item.commission?.id)
                            }
                          >
                            Apply again
                          </Button>
                        </div>
                      ) : (
                        <span className="text-yellow-600">Pending</span>
                      )
                    ) : loading ? (
                      <Spinner />
                    ) : (
                      <Button
                        onClick={() =>
                          handleApplyCommission(item.id, item.paid_amount, item)
                        }
                      >
                        Apply for Commission
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading title="Commission" description="Apply for your commission" />
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-4">
          {data.length === 0 ? (
            <p>No data available.</p>
          ) : (
            data.map((item) => (
              <RenderEachRow
                key={item.id}
                item={item}
                onRefresh={async () => {
                  await fetchData(UserState.value.data?.id);
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
