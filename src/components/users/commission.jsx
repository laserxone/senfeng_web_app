"use client";

import { UserContext } from "@/store/context/UserContext";
import { useContext, useEffect, useState } from "react";
import { Heading } from "../ui/heading";
import axios from "axios";
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
        const route = `${BASE_URL}/commission`;
        const response = await axios.get(route);
        console.log(response.data);
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

   

    async function handleUpdate(id) {

        if (!id) return;
        setLoading(true);
        try {
          await axios
            .put(`${BASE_URL}/commission/${id}`, {
              is_approved: true,
              approval_date: new Date(),
            })
            .then(async () => {
              await onRefresh();
            });
        } catch (error) {
        } finally {
          setLoading(false);
        }
        
        
    }

    return (
      <Card>
        <CardContent className="p-4 space-y-2">
            <Link target="blank" href={`/${UserState.value.data?.base_route}/customer/machine?id=${item.sale_id}`}>
          <h2 className="font-semibold text-lg hover:underline">
            Customer: {item.customer_name || item.customer_owner || "NIL"}
          </h2>
          </Link>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Machine</TableHead>
                <TableHead>Commission Amount</TableHead>
                <TableHead>Commission Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>{item.user_name}</TableCell>
                <TableCell>{item.machine_name}</TableCell>

                <TableCell>{item.commission_amount}</TableCell>
                <TableCell>
                  {loading ? (
                    <Spinner />
                  ) : item.is_approved === null ? (
                    <div>
                      <Button
                        onClick={() => handleUpdate(item.id, true)} // Handle approve
                        className="mr-2"
                      >
                        Approve
                      </Button>
                    </div>
                  ) : item.is_approved === false ? (
                    <span className="text-red-600">Disapproved</span>
                  ) : (
                    <span className="text-green-600">Approved</span>
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
            data.map((item) => (
              <RenderEachRow
                key={item.id}
                item={item}
                onRefresh={async () => {
                  await fetchData();
                }}
              />
            ))
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
        const route = `${BASE_URL}/user/${id}/commission`;
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

    async function handleApplyCommission(id, amount) {
      if (!id) return;
      setLoading(true);
      try {
        await axios
          .post(`${BASE_URL}/commission`, {
            sale_id: id,
            user_id: UserState.value.data?.id,
            is_requested: true,
            commission_amount: amount * 0.025,
          })
          .then(async () => {
            await onRefresh();
          });
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }

    return (
      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="font-semibold text-lg">
            Customer: {item.customer?.name || item.customer?.owner || "NIL"}
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Machine</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
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
                  {item.balance !== 0 ? (
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
