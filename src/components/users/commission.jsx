"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { storage } from "@/config/firebase";
import { toast } from "@/hooks/use-toast";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { getDownloadURL, ref } from "firebase/storage";
import moment from "moment";
import Link from "next/link";
import { memo, useCallback, useEffect, useState } from "react";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import Heading from "../ui/heading";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import Spinner from "../ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ToastAction } from "../ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { ScrollArea } from "../ui/scroll-area";


export default function Commission({ owner, crm }) {
  return owner ? <OwnerView /> : crm ? <CrmView /> : <OtherView />;
}

const OwnerView = () => {
  const { userID } = useUserDetail();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleDisapprove, setVisibleDisapprove] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [disapproveMsg, setDisapproveMsg] = useState("");
  const [disapproveLoading, setDisapproveLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null)
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (userID) {
      fetchData();
    }
  }, [userID]);

  async function fetchData() {
    return new Promise(async (resolve, reject) => {
      try {
        const route = `/${userID}/commission`;
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

  function groupByMonth(data) {
    return data.reduce((acc, item) => {
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
    const allSearch = `${item.customer_name || ""} ${item.user_name || ""} ${
      item.customer_owner || ""
    }`;
    return allSearch.toLowerCase().includes(search.toLowerCase());
  });

  const groupedData = groupByMonth(filteredData);

  const RenderEachRow = ({ item, onRefresh, onDisapprove, onReturn }) => {
    const [loading, setLoading] = useState(false);
    const { userID, base_route } = useUserDetail();
    const [selectedPercentage, setSelectedPercentage] = useState(null);
    const [showManual, setShowManual] = useState(false);
    const [manualNumber, setManualNumber] = useState("");

    async function handleUpdate(
      id,
      is_approved,
      approval_date,
      commission_amount,
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

    async function revertIssued(id) {
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
            href={`/${base_route}/member/${item.customer_id}/${item.sale_id}`}
            className="hover:underline"
          >
            {item.customer_name}
          </Link>
        </TableCell>
        <TableCell>
          <Link
            target="blank"
            href={`/${base_route}/member/${item.customer_id}/${item.sale_id}`}
            className="hover:underline"
          >
            {item.customer_owner}
          </Link>
        </TableCell>
        <TableCell>{item.customer_group}</TableCell>
        <TableCell>{item.machine_name}</TableCell>
        <TableCell>{item.order_no_arr?.join(", ")}</TableCell>
        <TableCell>{item.total_amount}</TableCell>
        <TableCell>
          <Button
            onClick={() => {
              onReturn(item);
            }}
            variant="outline"
          >
            Open
          </Button>
        </TableCell>
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
                    setManualNumber(value); // Keep as string
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
                onClick={() =>
                  handleUpdate(
                    item.id,
                    true,
                    new Date(),
                    showManual
                      ? Number(manualNumber)
                      : (item.total_amount * (selectedPercentage || 0)) / 100,
                    item.lead_id ? item.total_amount / 100 : null,
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
              <Button
                onClick={() => handleUpdate(item.id, null, null, null, null)}
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
          <div className="max-w-3xl">
            <Input
              placeholder="Search customer, company, user"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {Object.keys(groupedData).length === 0 ? (
            <p>No data available.</p>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {Object.entries(groupedData).map(([month, items]) => (
                <AccordionItem key={month} value={month}>
                  <AccordionTrigger>
                    <span>{moment(month, "YYYY-MM").format("MMMM YYYY")}</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Request Date</TableHead>
                          <TableHead>Employee</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Group</TableHead>
                          <TableHead>Machine</TableHead>
                          <TableHead>Order No</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Images</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead>Note</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <RenderEachRow
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
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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

      <ImageSheet data={selectedRow} onClose={()=> setSelectedRow(null)} visible={!!selectedRow}/>
    </div>
  );
};

const OtherView = () => {
  const { userID } = useUserDetail();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (userID) {
      fetchData(userID);
    }
  }, [userID]);

  async function fetchData(id) {
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

  const RenderEachRow = ({ item, onRefresh }) => {
    const [loading, setLoading] = useState(false);
    const { userID, base_route } = useUserDetail();
    const [note, setNote] = useState(item?.note || "");
    const [issueLoading, setIssueLoading] = useState(false);

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
                  `/${base_route}/member/${item.customer.id}`,
                  "_blank",
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
                  `/${base_route}/member/${item.customer.id}/${item.id}`,
                  "_blank",
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

    async function handleApplyCommissionAgain(id) {
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

    async function handleAlreadyReceived(val) {
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

          <div className="overflow-x-auto">
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
                  <TableCell className="align-middle">
                    {item.serial_no}
                  </TableCell>
                  <TableCell className="align-middle">
                    {item.created_amount}
                  </TableCell>
                  <TableCell className="align-middle">
                    {item.paid_amount}
                  </TableCell>
                  <TableCell className="align-middle">{item.balance}</TableCell>

                  {/* Note column */}
                  <TableCell className="align-middle">
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
                  <TableCell className="align-middle">
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
                          handleApplyCommission(item.id, item.paid_amount, item)
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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userID) {
      fetchData(userID);
    }
  }, [userID]);

  async function fetchData(id) {
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

  const RenderEachRow = ({ item }) => {
    const renderCommissionStatus = (item) => {
      // if (item.lead_commission_issued === true) {
      //   return <span className="text-green-600">Issued</span>;
      // } else
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

const MyImg = memo(({ img, setImageOpen }) => {
  const [localImage, setLocalImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [rotation, setRotation] = useState(0);

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

  const handleZoomChange = useCallback((shouldZoom) => {
    setIsZoomed(shouldZoom);
    if (!shouldZoom) {
      setImageOpen(false);
    }
  }, []);

  const rotateImageRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const rotateImageLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const onPressClose = () => {
    setIsZoomed(false);
    setImageOpen(false);
  };

  if (loading) return <Spinner />;
  if (!img || error || !localImage) return <p>No image</p>;

  return (
    <ControlledZoom
      isZoomed={isZoomed}
      onZoomChange={handleZoomChange}
      ZoomContent={({ img }) =>
        isZoomed ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              width: "100vw",
              height: "100vh",
              overflow: "hidden",
              zIndex: 9999,
              pointerEvents: "auto",
            }}
          >
            <img
              src={localImage}
              alt="payment-img"
              style={{
                transform: `rotate(${rotation}deg)`,
                maxWidth: "90vw",
                maxHeight: "90vh",
                objectFit: "contain",
                pointerEvents: "auto",
              }}
            />
            <div
              className="mt-2 flex gap-5"
              style={{
                pointerEvents: "auto",
                zIndex: 10000,
              }}
            >
              <Button variant="outline" size="sm" onClick={rotateImageLeft}>
                Rotate Left
              </Button>
              <Button variant="outline" size="sm" onClick={rotateImageRight}>
                Rotate Right
              </Button>

              <Button variant="outline" size="sm" onClick={onPressClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          img
        )
      }
    >
      <img
        onClick={() => setImageOpen(true)}
        src={localImage}
        alt="payment-img"
        style={{
          maxWidth: "100%",
          maxHeight: "400px",
          objectFit: "contain",
          cursor: "zoom-in",
        }}
      />
    </ControlledZoom>
  );
});

const ImageSheet = memo(({
  data,
  visible,
  onClose,

}) => {
  const [imageOpen, setImageOpen] = useState(false);

 
  function handleClose() {
    if (!imageOpen) {
      onClose();
    }
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
                <MyImg img={item} setImageOpen={setImageOpen}/>
              </div>
            ))}

            {data?.machine_nameplate_images &&
            data?.machine_nameplate_images?.map((item) => (
              <div key={item}>
                <MyImg img={item} setImageOpen={setImageOpen}/>
              </div>
            ))}
            </ScrollArea>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
});
