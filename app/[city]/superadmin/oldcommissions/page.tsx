"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Heading from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import { UserSearch } from "@/components/shared/search/user-search";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import moment from "moment";
import { useEffect, useRef, useState } from "react";


type CustomerMachinesResponse = {
  customer_id: number;
  customer_name: string;
  customer_owner: string;
  customer_owner_name: string;
  customer_number: string[];
  machines: Machine[];
};

type Machine = {
  sale_id: number;
  serial_no: string;
  power: string | null;
  source: string | null;
  order_no_arr: string[];
  contract_date: string; 
  sold_by_name: string;
  sold_by_id: number;
  price: string; 
  speed_money: boolean;
  speed_money_note: string;
  speed_money_amount: string | null;
};

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CustomerMachinesResponse[]>([]);
  const hasFetched = useRef(false);
  const [search, setSearch] = useState("");
  const { userID } = useUserDetail();

  useEffect(() => {
    if (userID && !hasFetched.current) {
      hasFetched.current = true;
      fetchData();
    }
  }, [userID]);

  async function fetchData() {
    setLoading(true);
    try {
      const response = await axios.get(`/${userID}/old-commissions`);
      setData(response.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }

 

  const filteredData = data.filter((item) =>
    `${item.customer_name} ${item.customer_owner}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-1 flex-col space-y-4 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <Heading panel title="Old Commissions" description="Clear old commissions" />
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
              <AccordionTrigger className="px-4 py-3 font-semibold text-lg">
                <div className="w-full flex flex-col sm:flex-row sm:justify-between">
                  <div>
                    <p>{customer?.customer_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Owner: {customer?.customer_owner}
                    </p>
                  </div>
                  <div className="text-right whitespace-normal wrap-break-word max-w-sm">
                    <div className="text-sm text-muted-foreground mt-2 sm:mt-0">
                      Number:{" "}
                      {Array.isArray(customer?.customer_number)
                        ? customer?.customer_number?.join(", ")
                        : customer?.customer_number}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Manager: {customer?.customer_owner_name}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-muted px-4 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customer.machines.map((machine) => (
                    <RenderEachMachine
                      machine={machine}
                      key={machine.sale_id}
                      onReturn={(machineId) => {
                        setData((prevData) => {
                          return prevData.map((cust) => {
                            if (cust.customer_id === customer.customer_id) {
                              return {
                                ...cust,
                                machines: cust.machines.filter(
                                  (m) => m.sale_id !== machineId
                                ),
                              };
                            }
                            return cust;
                          });
                        });
                      }}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

const RenderEachMachine = ({ machine, onReturn } : {machine : Machine, onReturn : (val : number)=> void}) => {
  const [selectedPercentage, setSelectedPercentage] = useState("2");
  const [showManual, setShowManual] = useState(false);
  const [manualNumber, setManualNumber] = useState("");
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [commissionAmount, setCommissionAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();

  useEffect(() => {
    if (machine?.sold_by_id) {
      setSelectedUser(machine?.sold_by_id);
    }
  }, [machine]);

  useEffect(() => {
    if (showManual) {
      setCommissionAmount(parseFloat(manualNumber) || 0);
    } else {
      if (selectedPercentage && selectedUser) {
        const percentage = parseFloat(selectedPercentage);
        const price = parseFloat(machine?.price) || 0;
        const amount = (price * percentage) / 100;
        setCommissionAmount(amount);
      }
    }
  }, [selectedPercentage, selectedUser, machine, showManual, manualNumber]);

  async function handleClearCommission(machine : Machine) {
    setLoading(true);
    const formData = {
      sale_id: machine.sale_id,
      user_id: selectedUser,
      is_requested: true,
      request_date: new Date(),
      is_approved: true,
      approval_date: new Date(),
      commission_amount: commissionAmount,
      total_amount: machine.price,
      commission_issued: true,
    };

    try {
      await axios.post(`/${userID}/old-commissions`, formData);
      onReturn(machine.sale_id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedPercentage !== "manual") {
      setShowManual(false);
      setManualNumber("");
    }
  }, [selectedPercentage]);

  return (
    <Card className="shadow-md">
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
            ? moment(new Date(machine.contract_date)).format("YYYY-MM-DD")
            : "N/A"}
        </p>
        <p className="text-sm text-muted-foreground">
          Order No(s): {machine.order_no_arr?.join(", ") || "N/A"}
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
        <div className="space-y-2">
          <UserSearch value={selectedUser} onReturn={setSelectedUser} />
          <Select
            onValueChange={(val) => {
              if (val === "manual") {
                setSelectedPercentage(val);
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
          {showManual && (
            <Input
              type="number"
              value={manualNumber}
              onChange={(e) => {
                setManualNumber(e.target.value);
              }}
            />
          )}
          <p className="text-sm text-muted-foreground">
            Commission Amount: {commissionAmount}
          </p>
          <Button
            disabled={
              loading ||
              !selectedUser ||
              commissionAmount < 0
            }
            onClick={() => handleClearCommission(machine)}
          >
            {loading && <Spinner />} Clear Commission
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
