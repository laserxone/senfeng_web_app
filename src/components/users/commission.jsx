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

export default function Commission({ owner }) {
  return owner ? <OwnerView /> : <OtherView />;
}

const OwnerView = () => {
  const { state: UserState } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const RenderEachRow = ({ item, onRefresh }) => {
    const [loading, setLoading] = useState(false);
    const { state: UserState } = useContext(UserContext);
    const [selectedPercentage, setSelectedPercentage] = useState(null);

    async function handleUpdate(id) {
      if (!id) return;
      setLoading(true);
      try {
        await axios.put(`/commission/${id}`, {
          is_approved: true,
          approval_date: new Date(),
          commission_amount: (item.total_amount * selectedPercentage) / 100,
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
          <div className="min-h-[40px] flex items-center">
            {item.is_approved ? (
              item.commission_amount
            ) : (
              <Select
                onValueChange={(val) => setSelectedPercentage(val)}
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
                </SelectContent>
              </Select>
            )}
          </div>
        </TableCell>
        <TableCell>{item.note}</TableCell>
      
        <TableCell>
          {loading ? (
            <Spinner />
          ) : item.is_approved === null ? (
            <Button
              disabled={!selectedPercentage}
              onClick={() => handleUpdate(item.id)}
            >
              Approve
            </Button>
          ) : item.is_approved === false ? (
            <span className="text-red-600">Disapproved</span>
          ) : (
            <span className="text-green-600">Approved</span>
          )}
        </TableCell>
      </TableRow>
    );
  };

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
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
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

    async function handleApplyCommission(id, amount) {
      if (!id) return;
      setLoading(true);
      try {
        await axios
          .post(`/commission`, {
            sale_id: id,
            user_id: UserState.value.data?.id,
            is_requested: true,
            total_amount: item.price,
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
                    {item.commission_issued ? (
                      <span className="text-green-600">Approved</span>
                    ) : item.balance !== 0 ? (
                      <span className="text-red-600">
                        Payment not cleared yet
                      </span>
                    ) : item.commission?.id ? (
                      item.commission.is_approved ? (
                        <span className="text-green-600">Approved</span>
                      ) : (
                        <span className="text-yellow-600">Pending</span>
                      )
                    ) : loading ? (
                      <Spinner />
                    ) : (
                      <Button
                        onClick={() =>
                          handleApplyCommission(item.id, item.paid_amount)
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
