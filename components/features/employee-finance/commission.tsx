"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import Heading from "@/components/ui/heading";
import { useIsMobile } from "@/hooks/use-mobile";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { CommissionCRMProps, CommissionMachineItemProps, CommissionOwnerProps } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { memo, useEffect, useState } from "react";
import { toast } from "sonner";
import { MyImgZooming } from "@/components/shared/media/img-zooming";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSidebar } from "@/components/ui/sidebar";
import Spinner from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


export default function Commission({ owner, crm }: { owner?: boolean, crm?: boolean }) {
  return owner ? <OwnerView /> : crm ? <CrmView /> : <OtherView />;
}

const OwnerView = () => {
  const { userID } = useUserDetail();
  const [data, setData] = useState<CommissionOwnerProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleDisapprove, setVisibleDisapprove] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CommissionOwnerProps | null>(null);
  const [disapproveMsg, setDisapproveMsg] = useState("");
  const [disapproveLoading, setDisapproveLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<CommissionOwnerProps | null>(null)
  const [search, setSearch] = useState("");
  const { state } = useSidebar()
  const isMobile = useIsMobile()
  useEffect(() => {
    if (userID) {
      fetchData();
    }
  }, [userID]);

  async function fetchData() {

    try {
      const route = `/${userID}/commission`;
      const response = await axios.get(route);

      setData(response.data);
    } catch (error) {
    } finally {

      setLoading(false);
    }

  }

  function groupByMonth(data: CommissionOwnerProps[]) {
    return data.reduce((acc: any, item) => {
      const key = item.request_date
        ? moment(item.request_date).format("YYYY-MM")
        : "Unknown";

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});
  }

  const filteredData = data.filter((item) => {
    if (!search) return true;
    const allSearch = `${item.customer_name || ""} ${item.user_name || ""} ${item.customer_owner || ""
      }`;
    return allSearch.toLowerCase().includes(search.toLowerCase());
  });

  const groupedData: Record<string, CommissionOwnerProps[]> = groupByMonth(filteredData);

  const RenderEachRow = ({ item, onRefresh, onDisapprove, onReturn, index }: { item: CommissionOwnerProps, onRefresh: () => Promise<void>, onDisapprove: () => void, onReturn: (val: CommissionOwnerProps) => void, index: number }) => {
    const [loading, setLoading] = useState(false);
    const { userID, base_route } = useUserDetail();
    const [selectedPercentage, setSelectedPercentage] = useState<null | number>(null);
    const [showManual, setShowManual] = useState(false);
    const [manualNumber, setManualNumber] = useState("");

    async function handleUpdate(
      id: number,
      is_approved: boolean | null,
      approval_date: string | Date | null,
      commission_amount: number | null,
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

    async function revertIssued(id: number) {
      if (!id) return;
      setLoading(true);
      try {
        await axios.put(`/${userID}/commission/${id}`, {
          commission_issued: false,
          issue_date: null,
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

    const getRowBg = (item: CommissionOwnerProps, index: number) => {

      if (item.commission_issued === true) return "bg-green-100 dark:bg-green-900 border-b-gray-400";
      if (item.is_approved === false) return "bg-red-100 dark:bg-red-900 border-b-gray-400";
      if (item.is_approved === true) return "bg-blue-100 dark:bg-blue-900 border-b-gray-400";
      return index % 2 === 0 ? "bg-slate-50 dark:bg-gray-900 border-b-gray-400" : "bg-white dark:bg-slate-800 border-b-gray-400";
    };

    return (
      <TableRow className={`${getRowBg(item, index)} hover:${getRowBg(item, index)}`}>
        <TableCell className="min-w-[120px] whitespace-nowrap">
          {item.request_date
            ? moment(item.request_date).format("YYYY-MM-DD")
            : ""}
        </TableCell>
        <TableCell className="min-w-[150px] max-w-[220px] whitespace-normal break-words">{item.user_name}</TableCell>
        <TableCell className="min-w-[180px] max-w-[260px] whitespace-normal break-words">
          <Link
            target="blank"
            href={`/${base_route}/member/${item.customer_id}/${item.sale_id}`}
            className="hover:underline"
          >
            {item.customer_name}
          </Link>
        </TableCell>
        <TableCell className="min-w-[170px] max-w-[240px] whitespace-normal break-words">
          <Link
            target="blank"
            href={`/${base_route}/member/${item.customer_id}/${item.sale_id}`}
            className="hover:underline"
          >
            {item.customer_owner}
          </Link>
        </TableCell>
        <TableCell className="min-w-[150px] max-w-[220px] whitespace-normal break-words">{item.customer_group}</TableCell>
        <TableCell className="min-w-[190px] max-w-[300px] whitespace-normal break-words">{item.machine_name}</TableCell>
        <TableCell className="min-w-[180px] max-w-[280px] whitespace-normal break-words">{item.order_no_arr?.join(", ")}</TableCell>
        <TableCell className="min-w-[110px] whitespace-nowrap">{item.total_amount}</TableCell>
        <TableCell className="min-w-[100px]">
          <Button
            onClick={() => {
              onReturn(item);
            }}
            variant="outline"
          >
            Open
          </Button>
        </TableCell>
        <TableCell className="min-w-[300px]">
          <div className="flex min-h-[40px] min-w-[280px] items-center gap-2">
            {item.is_approved ? (
              item.commission_amount
            ) : (
              <Select
                onValueChange={(val) => {
                  if (val === "manual") {
                    setShowManual(true);
                  } else {
                    setSelectedPercentage(Number(val));
                  }
                }}
                value={String(selectedPercentage) || ""}
              >
                <SelectTrigger className="w-full">
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
                    setManualNumber(value); // Keep as string
                  }
                }}
              />
            )}
          </div>
        </TableCell>
        <TableCell className="min-w-[220px] max-w-[340px] whitespace-normal break-words">{item.note}</TableCell>

        <TableCell className={`min-w-[220px] bg-inherit ${!isMobile && "sticky right-0 z-30"}`}>
          {loading ? (
            <Spinner />
          ) : item.commission_issued === true ? (
            <div className="flex gap-2 items-center">
              <span className="text-green-600">Issued</span>
              <Button onClick={() => revertIssued(item.id)}>Revert</Button>
            </div>
          ) : item.is_approved === null ? (
            <div className="flex gap-2 items-center">
              <Button
                disabled={
                  showManual ? manualNumber === "" : !selectedPercentage
                }
                onClick={() => {
                  handleUpdate(
                    item.id,
                    true,
                    new Date(),
                    showManual
                      ? Number(manualNumber || 0)
                      : (item.total_amount * (selectedPercentage || 0)) / 100,
                  )
                }
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
              <Button
                onClick={() => handleUpdate(item.id, null, null, null)}
              >
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
    <div className="flex min-w-0 flex-1 flex-col space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Heading title="Commission" description="Approve employee commission" />
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="min-w-0 space-y-4">
          <div className="w-full max-w-3xl">
            <Input
              placeholder="Search customer, company, user"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {Object.keys(groupedData).length === 0 ? (
            <p>No data available.</p>
          ) : (

            Object.entries(groupedData).map(([month, items]) => (
              <Collapsible key={month} className="min-w-0 rounded-xl border bg-background">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"

                    className="group h-auto w-full justify-start gap-2 rounded-xl px-3 py-3 text-left transition-none hover:bg-card hover:text-accent-foreground sm:px-4"
                  >
                    <ChevronRight className="transition-transform group-data-[state=open]:rotate-90" />
                    <span className="font-semibold">{moment(month, "YYYY-MM").format("MMMM YYYY")}</span>
                    <span className="ml-auto rounded-full border bg-muted/30 px-2 py-0.5 text-xs text-muted-foreground">
                      {items.length} rows
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="relative min-w-0 flex-1 p-2 pt-0 sm:p-3 sm:pt-0">
                    {/* <ScrollArea
                        className={`w-full  ${state === 'expanded' ? "max-w-[calc(100dvw-310px)]" : "max-w-[calc(100dvw-100px)]"}  overflow-x-auto`}
                      > */}
                    <div
                      className={`custom-scrollbar rounded-lg border ${!isMobile && state === "expanded"
                        ? "xl:max-w-[calc(100dvw-330px)]"
                        : "xl:max-w-[calc(100dvw-130px)]"
                        } ${isMobile && "w-[calc(100dvw-50px)]"}`}
                    >
                      <Table className="w-[2100px] min-w-[2100px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[120px]">Request Date</TableHead>
                            <TableHead className="min-w-[150px]">Employee</TableHead>
                            <TableHead className="min-w-[180px]">Customer</TableHead>
                            <TableHead className="min-w-[170px]">Owner</TableHead>
                            <TableHead className="min-w-[150px]">Group</TableHead>
                            <TableHead className="min-w-[190px]">Machine</TableHead>
                            <TableHead className="min-w-[180px]">Order No</TableHead>
                            <TableHead className="min-w-[110px]">Price</TableHead>
                            <TableHead className="min-w-[100px]">Images</TableHead>
                            <TableHead className="min-w-[300px]">Commission</TableHead>
                            <TableHead className="min-w-[220px]">Note</TableHead>
                            <TableHead className={`min-w-[220px] ${!isMobile && "sticky right-0 z-30  border-l"} bg-background shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.35)]`}>
                              Status
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="bg-white dark:bg-gray-900">
                          {items.map((item, i) => (
                            <RenderEachRow
                              index={i}
                              key={item.id}
                              item={item}
                              onRefresh={fetchData}
                              onReturn={(i) => setSelectedRow(i)}
                              onDisapprove={() => {
                                setSelectedItem(item);
                                setVisibleDisapprove(true);
                              }}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {/* <ScrollBar orientation="horizontal" />
                      </ScrollArea> */}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))


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
            <Button
              disabled={disapproveLoading || !disapproveMsg}
              onClick={handleDisapprove}
            >
              {disapproveLoading && <Spinner />} Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageSheet data={selectedRow} onClose={() => setSelectedRow(null)} visible={!!selectedRow} />
    </div>
  );
};

const OtherView = () => {
  const { userID } = useUserDetail();
  const [data, setData] = useState<CommissionMachineItemProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (userID) {
      fetchData(userID);
    }
  }, [userID]);

  async function fetchData(id: string | number) {
    setLoading(true);
    return new Promise(async (resolve) => {
      try {
        const route = `/${id}/commission`;
        const response = await axios.get(route);
        setData(response.data);
      } catch (error) {
      } finally {
        resolve(true);
        setLoading(false);
      }
    });
  }



  const RenderEachRow = ({ item, onRefresh }: { item: CommissionMachineItemProps, onRefresh: () => Promise<void> }) => {
    const [loading, setLoading] = useState(false);
    const { userID, base_route } = useUserDetail();
    const [note, setNote] = useState(item?.commission?.note || "");
    const [issueLoading, setIssueLoading] = useState(false);
    const { state } = useSidebar()
    const isMobile = useIsMobile()

    async function handleApplyCommission(id: number, item: CommissionMachineItemProps) {
      if (item.customer.profile_completion < 100) {
        toast.error("Data incomplete in customer record, kindly enter all data in this customer")
        return;
      }
      if (item.percentage_completion < 100) {
        toast.error("Data incomplete in machine record, kindly enter all data in this machine")

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
          .post(`/${userID}/commission`, {
            sale_id: id,
            user_id: userID,
            is_requested: true,
            total_amount: totalPrice,
            note: note,
            lead_id: item.first_machine ? item.customer.lead : null,
          })
          .then(async () => {
            await axios
              .put(`/${userID}/machine/${id}`, {
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

    async function handleApplyCommissionAgain(id: number | undefined) {
      if (!id) return;
      setLoading(true);

      try {
        await axios
          .put(`/${userID}/commission/${id}`, {
            is_requested: true,
            is_approved: null,
            request_date: new Date(),
          })
          .then(async () => {
            await axios
              .put(`/${userID}/machine/${id}`, {
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

    async function handleAlreadyReceived(val: CommissionMachineItemProps) {
      if (!val?.id) return;
      setIssueLoading(true);
      try {
        if (val?.commission?.id) {
          await axios.put(`/${userID}/commission/${val.commission.id}`, {
            commission_issued: true,
            is_requested: true,
            is_approved: true,
            // lead_commission_issued: true,
          });
        } else {
          const formData = {
            sale_id: val.id,
            user_id: userID,
            is_requested: true,
            request_date: new Date(),
            is_approved: true,
            approval_date: new Date(),
            commission_amount: 0,
            total_amount: val.price,
            commission_issued: true,
          };

          await axios.post(`/${userID}/old-commissions`, formData);
          await fetchData(userID);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIssueLoading(false);
      }
    }

    return (
      <Card className="max-w-[calc(100vw-34px)]">
        <CardContent className="p-4 space-y-2">
          <Link
            target="_blank"
            href={`/${base_route}/member/${item.customer_id}/${item.id}`}
          >
            <h2 className="font-semibold text-lg hover:underline">
              Customer: {item.customer?.name || item.customer?.owner || "NIL"}
            </h2>
          </Link>

          <div className={`${state === 'expanded' ? "w-[calc(100dvw-350px)]" : "w-[calc(100dvw-150px)]"} ${isMobile && "w-full"} overflow-x-auto`}>
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Machine</TableHead>
                  <TableHead className="w-[100px]">Price</TableHead>
                  <TableHead className="w-[100px]">Paid</TableHead>
                  <TableHead className="w-[100px]">Balance</TableHead>
                  <TableHead className="w-[200px]">Note</TableHead>
                  <TableHead className="w-[220px]">Commission Status</TableHead>
                  <TableHead className="w-[160px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="align-middle whitespace-normal break-words">
                    {item.serial_no}
                  </TableCell>
                  <TableCell className="align-middle whitespace-normal break-words">
                    {item.created_amount}
                  </TableCell>
                  <TableCell className="align-middle whitespace-normal break-words">
                    {item.paid_amount}
                  </TableCell>
                  <TableCell className="align-middle whitespace-normal break-words">{item.balance}</TableCell>

                  {/* Note column */}
                  <TableCell className="align-middle whitespace-normal break-words">
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

                  {/* Commission Status column */}
                  <TableCell className="align-middle whitespace-normal break-words">
                    {loading ? (
                      <Spinner />
                    ) : item.commission?.commission_issued === true ? (
                      <span className="text-green-600">Issued</span>
                    ) : item.balance !== 0 ? (
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
                                <p className="text-white">
                                  {item.commission.owner_note}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Button
                            variant="outline"
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
                    ) : (
                      <Button
                        onClick={() =>
                          handleApplyCommission(item.id, item)
                        }
                      >
                        Apply for Commission
                      </Button>
                    )}
                  </TableCell>

                  <TableCell className="align-middle">
                    {!item.commission?.commission_issued && (
                      <Button
                        disabled={issueLoading}
                        onClick={() => handleAlreadyReceived(item)}
                      >
                        {issueLoading && <Spinner />} Already received
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

  const filteredData = data.filter((item) => {
    const customerName = item?.customer?.name?.toLowerCase() ?? "";
    const customerOwner = item?.customer?.owner?.toLowerCase() ?? "";
    const searchingValue = search.toLowerCase();

    return (
      customerName.includes(searchingValue) ||
      customerOwner.includes(searchingValue)
    );
  });

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
          <Input
            value={search}
            placeholder={`Search...`}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            className="w-[60vw] max-w-sm"
          />

          {data.length === 0 ? (
            <p>No data available.</p>
          ) : (
            filteredData.map((item) => (
              <RenderEachRow
                key={item.id}
                item={item}
                onRefresh={async () => {
                  await fetchData(userID);
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

const CrmView = () => {
  const { userID } = useUserDetail();
  const [data, setData] = useState<CommissionCRMProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userID) {
      fetchData(userID);
    }
  }, [userID]);

  async function fetchData(id: number | string) {
    return new Promise(async (resolve, reject) => {
      try {
        const route = `/${id}/commission?lead=true`;
        const response = await axios.get(route);
        setData(response.data);
      } catch (error) {
      } finally {
        resolve(true);
        setLoading(false);
      }
    });
  }

  const RenderEachRow = ({ item }: { item: CommissionCRMProps }) => {
    const renderCommissionStatus = (item: CommissionCRMProps) => {

      if (item.is_approved === true) {
        return <span className="text-green-600">Approved</span>;
      } else if (item.is_approved === false) {
        return (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <span className="text-red-600">Disapproved</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-red-600 mr-2">
                  <p className="text-white">
                    {item.owner_note || "No reason provided"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      } else {
        return <span className="text-yellow-600">Pending</span>;
      }
    };

    return (
      <TableRow>
        <TableCell>{item.customer_name}</TableCell>
        <TableCell>{item.customer_owner}</TableCell>
        <TableCell>{item.user_name}</TableCell>
        <TableCell>{item.note}</TableCell>

        <TableCell>{renderCommissionStatus(item)}</TableCell>
      </TableRow>
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
            <Card className="max-w-[calc(100vw-34px)]">
              <CardContent className="p-4 space-y-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Commission Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item) => (
                      <RenderEachRow key={item.id} item={item} />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};


const ImageSheet = memo(({
  data,
  visible,
  onClose,

}: {
  data: CommissionOwnerProps | null;
  visible: boolean;
  onClose: () => void;
}) => {


  function handleClose() {

    onClose();

  }

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader className="mb-4">
          <SheetTitle>Images</SheetTitle>

          <ScrollArea className="h-[85vh] px-4">

            {data?.contract_images_png &&
              data?.contract_images_png?.map((item) => (
                <div key={item}>
                  <MyImgZooming img={item} />
                </div>
              ))}

            {data?.machine_nameplate_images &&
              data?.machine_nameplate_images?.map((item) => (
                <div key={item}>
                  <MyImgZooming img={item} />
                </div>
              ))}
          </ScrollArea>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
});
