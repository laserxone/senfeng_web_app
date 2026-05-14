"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "@/lib/axios";
import Heading from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserSearch } from "@/components/user-search";
import useUserDetail from "@/hooks/use-user-detail";
import Spinner from "@/components/ui/spinner";
import { toast } from "sonner";
import { MyCustomer } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";


export default function Page() {
  const [fromUserId, setFromUserId] = useState<number | null>(null);
  const [toUserId, setToUserId] = useState<number | null>(null);
  const { userID } = useUserDetail();
  const [customers, setCustomers] = useState<MyCustomer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile()


  useEffect(() => {
    if (!userID || !fromUserId) return;
    setCustomers([]);
    fetchCustomersByUser(fromUserId);
  }, [fromUserId, userID]);

  const fetchCustomersByUser = async (userId: number) => {
    setLoading(true);

    try {
      const response = await axios.get(`/${userID}/transfer?id=${userId}`);
      setCustomers(response.data);
    } finally {
      setLoading(false);
    }
  };

  const allSelected = useMemo(
    () => customers.length > 0 && selectedCustomers.length === customers.length,
    [customers, selectedCustomers],
  );

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map((c) => c.id));
    }
  };

  const toggleCustomer = (id: number) => {
    setSelectedCustomers((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleTransfer = async () => {
    if (!fromUserId || !toUserId || selectedCustomers.length === 0) return;

    const payload = {
      from_user_id: fromUserId,
      to_user_id: toUserId,
      ids: selectedCustomers,
    };

    setTransferLoading(true);

    try {
      await axios.post(`/${userID}/transfer`, payload);
      await fetchCustomersByUser(fromUserId);
      setSelectedCustomers([]);
      toast.success("Transferred successfully");
    } finally {
      setTransferLoading(false);
    }
  };

  return (

    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-start justify-between">
        <Heading
          title="Customer Transfers"
          description="Reassign customers between owners in just a few clicks"
        />
      </div>

      <Card className="border-muted/60 bg-muted/30">
        <CardContent className="flex gap-4 items-end">
          <div className="flex flex-col gap-4 min-w-[200px]">
            <h2 className="text-lg font-semibold">Select transfer from</h2>
            <UserSearch
              value={fromUserId}
              onReturn={(val)=>setFromUserId(val)}
              placeholder="Select employee"
            />
          </div>

          <div className="flex flex-col gap-4 min-w-[200px]">
            <h2 className="text-lg font-semibold">Select transfer to</h2>
            <UserSearch
              value={toUserId}
              onReturn={(value) => setToUserId(Number(value))}
              placeholder="Select employee"
            />
          </div>

          <Button
            size="lg"
            onClick={handleTransfer}
            disabled={
              !toUserId ||
              transferLoading ||
              !fromUserId ||
              selectedCustomers.length === 0
            }
          >
            {transferLoading ? "Transferring..." : "Transfer"}
          </Button>
        </CardContent>
      </Card>

      {fromUserId && (
        <Card className="w-full gap-0">
          <CardHeader className="border-b bg-muted/20 m-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Customers</h2>
                <p className="text-sm text-muted-foreground">
                  Select customers you want to transfer
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Selected: {selectedCustomers.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  disabled={customers.length === 0}
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 w-full relative">

            <div
              className={`relative flex flex-1 min-h-[calc(100dvh-230px)] ${isMobile && "w-[calc(100vw-44px)]"}`}
            >
              <div className="absolute bottom-0 left-0 right-0 top-0 flex md:overflow-auto custom-scrollbar overflow-auto">

                <Table className="relative">
                  <TableHeader>
                    <TableRow className="bg-background sticky top-0 z-30">
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Current Ownership</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-10 text-center text-muted-foreground"
                        >
                          <div className="flex items-center justify-center">
                            <Spinner />
                            <span className="ml-2 text-muted-foreground">
                              Loading customers...
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map((customer) => (
                        <TableRow
                          key={customer.id}
                          className={`transition-colors duration-150 ${selectedCustomers.includes(customer.id)
                            ? "bg-primary/10"
                            : "hover:bg-muted/10"
                            }`}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedCustomers.includes(customer.id)}
                              onCheckedChange={() => toggleCustomer(customer.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {customer.name}
                          </TableCell>
                          <TableCell className="font-medium">
                            {customer.owner}
                          </TableCell>
                          <TableCell>{customer.location}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {customer.ownership_name}
                          </TableCell>
                        </TableRow>
                      ))
                    )}

                    {!loading && customers.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-10 text-center text-muted-foreground"
                        >
                          No customers found for this ownership
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
