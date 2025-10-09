"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowUpDown,
  ClipboardList,
  EditIcon,
  Info,
  InfoIcon,
  ShieldCheck,
  Siren,
  Trash,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import AddPayment from "@/components/addPayment";
import PageTable from "@/components/app-table";
import { downloadCustomerZip } from "@/components/downloadzip";
import DropzoneMulti from "@/components/dropzone-multi";
import EditMachine from "@/components/editMachine";
import EditPayment from "@/components/editPayment";
import InvoicePDF from "@/components/invoicepdf";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Spinner from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserSearch } from "@/components/user-search";
import { storage } from "@/config/firebase";
import { Colors } from "@/constants/data";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { debounce } from "@/lib/debounce";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { pdf } from "@react-pdf/renderer";
import { getDownloadURL, ref } from "firebase/storage";
import moment from "moment";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import "pdfjs-dist/build/pdf.worker";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import AddCheque from "./add-cheque";

export default function Machine({ id, onLoading = () => { }, base }) {
  const [data, setData] = useState();
  const [total, setTotal] = useState(0);
  const [received, setReceived] = useState(0);
  const [payments, setPayments] = useState([]);
  const { toast } = useToast();
  const [imageURL, setImageURL] = useState(null);
  const [visible, setVisible] = useState(false);
  const [imagesVisible, setImagesVisible] = useState(false);
  const [editMachine, setEditMachine] = useState(false);
  const [addPayment, setAddPayment] = useState(false);
  const [editPayment, setEditPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const { userID, isAdmin, limited_access, designation } = useUserDetail();
  const [editAllowed, setEditAllowed] = useState(false);
  const [zipDownloading, setZipDwonloading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [unmatched, setUnmatched] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [installmentVisible, setInstallmentVisible] = useState(false);
  const [credit, setCredit] = useState(false);

  useEffect(() => {

    if (id && userID) {

      fetchData(id);
    }
  }, [id, userID]);



  async function fetchData(id) {
    if (onLoading) {
      onLoading(true);
    }
    console.log(id, userID)
    try {
      const response = await axios.get(`/${userID}/machine/${id}`);

      const machine = response.data?.machine;
      if (response.data?.installments) {
        setInstallments(response.data?.installments);
      }
      setUnmatched(response.data.unmatchedFields);

      if (
        response.data?.customer &&
        response.data?.customer?.ownership === userID
      ) {
        setEditAllowed(true);
      } else if (
        response.data?.machine &&
        response.data?.machine?.sell_by === userID
      ) {
        setEditAllowed(true);
      } else if (isAdmin) {
        setEditAllowed(true);
      } else if (
        designation === "Customer Relationship Manager (After Sales)" &&
        !limited_access
      ) {
        setEditAllowed(true);
      } else {
        setEditAllowed(false);
      }

      setData(response.data);
      if (machine) {
        setTotal(Number(machine.price || 0));

        const payments =
          machine?.payments?.filter((p) => p.clearance_date !== null) || [];
        setPayments(machine?.payments);
        setReceived(
          payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
        );
      }

      return true;
    } catch (e) {
      return null;
    } finally {
      if (onLoading) onLoading(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: "track",
        filterFn: "includesString",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Payment
              <ArrowUpDown />
            </Button>
          );
        },
        cell: ({ row }) => {
          const currentItem = row.original;
          return (
            <div className="flex items-center ml-2">
              {currentItem?.status === "rejected" ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div>
                        <TriangleAlert className="text-red-600 h-5 w-5 animate-pulse-opacity mr-2" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-red-600">
                      <p className="text-white">{currentItem?.comment}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : currentItem?.status === "approved" ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div>
                        <ShieldCheck className="text-green-600 h-5 w-5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-green-600 mr-2">
                      <p className="text-white">Payment verified</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div>
                        <Info className="text-orange-600 h-5 w-5 animate-pulse-opacity mr-2" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-orange-600">
                      <p className="text-white">Need verification</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <div>{row.getValue("track")}</div>
            </div>
          );
        },
      },

      {
        accessorKey: "transaction_date",
        filterFn: "includesString",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Transaction Date
              <ArrowUpDown />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div>
            {row.getValue("transaction_date")
              ? moment(new Date(row.getValue("transaction_date"))).format(
                "YYYY-MM-DD"
              )
              : ""}
          </div>
        ),
      },

      {
        accessorKey: "clearance_date",
        filterFn: "includesString",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Clearance Date
              <ArrowUpDown />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div
            style={{ color: !row.getValue("clearance_date") ? "red" : "green" }}
          >
            {row.getValue("clearance_date")
              ? moment(new Date(row.getValue("clearance_date"))).format(
                "YYYY-MM-DD"
              )
              : "Pending"}
          </div>
        ),
      },
      {
        accessorKey: "amount",
        filterFn: "includesString",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Amount
              <ArrowUpDown />
            </Button>
          );
        },
        cell: ({ row }) => <div className="ml-2">{row.getValue("amount")}</div>,
      },
      {
        accessorKey: "note",
        filterFn: "includesString",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              TID
              <ArrowUpDown />
            </Button>
          );
        },
        cell: ({ row }) => <div>{row.getValue("note")}</div>,
      },

      {
        accessorKey: "mode",
        filterFn: "includesString",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Method
              <ArrowUpDown />
            </Button>
          );
        },
        cell: ({ row }) => <div>{row.getValue("mode")}</div>,
      },

      {
        id: "actions",
        cell: ({ row }) => {
          const currentItem = row.original;

          return (
            <div className="flex flex-row gap-2 items-center">
              {currentItem.image && (
                <div
                  onClick={() => {
                    if (currentItem.id) {
                      console.log(currentItem.id)
                      setImageURL(currentItem);
                      setVisible(true);
                    }
                  }}
                >
                  <MyImg img={currentItem.image} />
                </div>
              )}

              {data?.machine && !currentItem?.payment_lock && editAllowed && (
                <EditIcon
                  style={{ color: Colors.button }}
                  className="cursor-pointer h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPayment(currentItem);
                    setEditPayment(true);
                  }}
                />
              )}

              {isAdmin && currentItem?.status === "pending" && (
                <RenderVerifyButton
                  item={currentItem}
                  onRefresh={async () => {
                    await fetchData(id);
                    return true;
                  }}
                />
              )}
            </div>
          );
        },
      },
    ],
    [data, editAllowed]
  );

  async function handleDownloadLedger() {
    let runningBalance = total;

    const convertedPayment = payments.map((payment) => {
      runningBalance -= payment.amount;
      return { ...payment, balance: runningBalance };
    });

    const finalData = {
      customer: data?.customer?.name,
      name: data?.customer?.owner,
      contact: data?.customer.number?.join(", "),
      model: data?.machine?.serial_no,
      serial: data?.machine?.order_no_arr?.join(", "),
      manager: data?.machine?.sell_by_name || "NA",
      payments: convertedPayment,
      received: received || 0,
      total: total || 0,
    };

    const blob = await pdf(<InvoicePDF data={finalData} />).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 600000);
  }

  async function deleteMachine() {
    if (!id) return;
    setDeleteLoading(true);
    axios.delete(`/${userID}/machine/${id}`).then(() => {
      onRefresh()
      setDeleteLoading(false)
    });
  }

  const ClientCard = memo(({ data, payment, machine, children }) => {
    const isMobile = useIsMobile();
    const [showAlert, setShowAlert] = useState(false);
    useEffect(() => {
      if (machine) {
        const payments = machine.payments;
        const result = findDuplicateNotes(payments);
        if (result.length > 0) {
          setShowAlert(true);
        } else {
          setShowAlert(false);
        }
      }
    }, [machine]);

    function findDuplicateNotes(array) {
      const noteMap = new Map();
      const duplicates = [];

      for (const item of array) {
        if (noteMap.has(item.note)) {
          duplicates.push(item.note);
        } else {
          noteMap.set(item.note, true);
        }
      }

      return [...new Set(duplicates)];
    }

    return (
      <Card
        className={`bg-gray-100 dark:bg-gray-900 rounded-lg shadow-md p-4 w-full`}
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-between">
          <div className="hidden md:block" />
          <div className="flex flex-row flex-wrap gap-2 items-center">
            {data?.name || "Customer Name"}
            <span className="text-gray-500 text-sm">
              {data?.owner && `(${data.owner})`}
            </span>
          </div>
          <div className="flex gap-2">
            {showAlert && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div>
                      <Siren className="text-red-600 h-8 w-8 animate-pulse-opacity" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-red-600 mr-2">
                    <p className="text-white">Duplicate TID found</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {unmatched.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div>
                      <InfoIcon className="text-red-600 h-8 w-8 animate-pulse-opacity" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-red-600 mr-2">
                    {unmatched.map((item, index) => (
                      <p key={index} className="text-white">
                        {item.replace(/_/g, " ").toUpperCase()}
                      </p>
                    ))}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </h2>
        <h2 className="text-md font-bold text-primary dark:text-white mb-4 flex items-center justify-center">
          Manager {machine?.sell_by_name || "NA"}
        </h2>

        <div className="flex flex-1 gap-6 flex-wrap">
          <Card className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <CardContent>
              <div className="flex gap-2 text-sm items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Machine Information
                </h3>
                {machine?.status && (
                  <div>
                    <Badge variant={"secondary"}>{machine?.status}</Badge>
                  </div>
                )}
              </div>
              {machine ? (
                <div className="text-gray-600 dark:text-gray-300 text-sm flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <Wrench className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <span>
                      Model:{" "}
                      <span className="font-medium">
                        {machine.serial_no || "N/A"}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <ClipboardList className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <span>
                      Power:{" "}
                      <span className="font-medium">
                        {machine.power || "N/A"}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <ClipboardList className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <span>
                      Source:{" "}
                      <span className="font-medium">
                        {machine.source || "N/A"}
                      </span>
                    </span>
                  </div>

                  {(machine.order_no_arr && machine.order_no_arr.length > 0
                    ? machine.order_no_arr
                    : ["N/A"]
                  ).map((item, index) => (
                    <div className="flex items-start gap-2" key={index}>
                      <ClipboardList className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                      <span>
                        Order No: <span className="font-medium">{item}</span>
                      </span>
                    </div>
                  ))}

                  <div className="flex items-start gap-2">
                    <ClipboardList className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <span>
                      Contract:{" "}
                      <span className="font-medium">
                        {machine.contract_date
                          ? moment(machine.contract_date).format("YYYY-MM-DD")
                          : "N/A"}
                      </span>
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No machine data available
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <CardContent>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Billing Summary
              </h3>

              <div className="flex flex-col  sm:flex-row gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-2 justify-between flex-wrap">
                <div className="flex flex-col">
                  <p>
                    <strong>Bill:</strong>
                  </p>
                  <p className="font-bold">
                    {" "}
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "PKR",
                    }).format(payment[0] || 0)}
                  </p>
                </div>
                <div className="flex flex-col">
                  <p>
                    <strong>Received:</strong>
                  </p>
                  <p className="text-green-600 font-bold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "PKR",
                    }).format(payment[1] || 0)}
                  </p>
                </div>
                <div className="flex flex-col">
                  <p>
                    <strong>Balance:</strong>
                  </p>
                  <p className="text-red-600 font-bold">
                    {" "}
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "PKR",
                    }).format(payment[0] - payment[1] || 0)}
                  </p>
                </div>
              </div>

              {machine?.speed_money && (
                <>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mt-3">
                    Speed Money
                  </h3>
                  <div className="flex flex-col">
                    <p>Amount: {machine?.speed_money_amount}</p>
                    <p>{machine?.speed_money_note}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {children}
        </div>
      </Card>
    );
  });

  async function onRefresh() {
    setCredit(false)
    fetchData(id)
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <ClientCard
        data={data?.customer || null}
        machine={data?.machine || null}
        payment={[total, received]}
      >
        {data && (
          <div className="w-[150px] shrink-0 flex flex-col gap-2">
            <Button
              size="sm"
              onClick={() => {
                if (!editAllowed) {
                  toast({
                    title: "You are not allowed to edit machine",
                    variant: "destructive",
                  });
                  return;
                } else {
                  setEditMachine(true);
                }
              }}
            >
              Edit Machine
            </Button>

            {data?.machine && !data?.machine?.payment_lock && (
              <Button
                size="sm"
                onClick={() => {
                  if (!editAllowed) {
                    toast({
                      title: "You are not allowed to add payment",
                      variant: "destructive",
                    });
                    return;
                  } else {
                    setAddPayment(true);
                  }
                }}
              >
                Add Payment
              </Button>
            )}

            <Button onClick={() => setImagesVisible(true)}>View Images</Button>

            {payments.length > 0 && (
              <Button
                size="sm"
                onClick={() => {
                  handleDownloadLedger();
                }}
              >
                Download Ledger
              </Button>
            )}
            {editAllowed && (
              <Button
                size="sm"
                onClick={async () => {
                  setZipDwonloading(true);
                  await downloadCustomerZip(data);
                  setZipDwonloading(false);
                }}
              >
                {zipDownloading && <Spinner />} Download ZIP
              </Button>
            )}

            {isAdmin && !data?.machine?.payment_lock && (
              <Button size="sm" variant="destructive" onClick={deleteMachine}>
                {deleteLoading && <Spinner />} Delete
              </Button>
            )}

            {installments.length > 0 && (
              <Button
                size="sm"
                onClick={() => {
                  setInstallmentVisible(true);
                }}
              >
                Installments
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => {
                setCredit(true);
              }}
            >
              Credit Cheque
            </Button>
          </div>
        )}
      </ClientCard>

      <div className={`flex flex-1 min-h-[500px]`}>
        <PageTable
          columns={columns}
          data={payments}
          totalItems={payments.length}
          disableInput={true}
          onRowClick={(val, e) => { }}
        />
      </div>
      <EditMachine
        base={base}
        visible={editMachine}
        onClose={setEditMachine}
        machine_id={id}
        onRefresh={async () => await fetchData(id)}
        data={data?.machine || {}}
      />

      <ImageSheet
        payment_lock={imageURL?.payment_lock}
        editAllowed={editAllowed}
        visible={visible}
        onClose={() => {
          setVisible(false);
          setImageURL(null);
        }}
        img={imageURL?.image || null}
        note={imageURL?.note || null}
        cheque_id={imageURL?.cheque_id || null}
        remarks={imageURL?.remarks || null}
        id={imageURL?.id}
        onRefresh={async () => {
          await fetchData(id);
          return true;
        }}
      />
      <ViewImagesSheet
        editAllowed={editAllowed}
        visible={imagesVisible}
        data={data?.machine || {}}
        customer_id={data?.customer?.id}
        onClose={() => setImagesVisible(false)}
        onRefresh={async () => await fetchData(id)}
      />

      <InstallmentSheet
        visible={installmentVisible}
        data={installments}
        updateData={(id, val) => {
          setInstallments((prevState) =>
            prevState.map((item) =>
              item.id === id ? { ...item, pending: val } : item
            )
          );
        }}
        onDeleteData={(id) => {
          setInstallments((prevState) =>
            prevState.filter((item) => item.id !== id)
          );

        }}
        onClose={() => setInstallmentVisible(false)}
      />

      <AddPayment
        base={base}
        customer_id={data?.customer?.id}
        visible={addPayment}
        onClose={setAddPayment}
        machine_id={id}
        onRefresh={async () => await fetchData(id)}
      />
      {selectedPayment && (
        <EditPayment
          base={base}
          customer_id={data?.customer?.id}
          visible={editPayment}
          onClose={(val) => {
            setEditPayment(val);
            setSelectedPayment(null);
          }}
          machine_id={id}
          data={selectedPayment}
          onRefresh={async () => await fetchData(id)}
        />
      )}

      <AddCheque visible={credit} onClose={setCredit} saleID={id} customer_id={data?.customer?.id} onRefresh={onRefresh} />
    </div>
  );
}

const ImageSheet = ({
  payment_lock,
  visible,
  onClose,
  img,
  note,
  remarks,
  id,
  onRefresh,
  editAllowed,
  cheque_id
}) => {
  const [imageOpen, setImageOpen] = useState(false);
  const [localImage, setLocalImage] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [rotation, setRotation] = useState(0);
  const { userID } = useUserDetail();
  const { toast } = useToast();

  useEffect(() => {
    if (img) {
      if (img.includes("http")) {
        setLocalImage(img);
      } else {
        getDownloadURL(ref(storage, img)).then((url) => {
          setLocalImage(url);
        });
      }
    } else {
      setLocalImage(null);
    }
  }, [img]);

  function handleClose() {
    if (!imageOpen) {
      onClose();
      setLocalImage(null);
    }
  }

  const handleZoomChange = useCallback((shouldZoom) => {
    setIsZoomed(shouldZoom);
    if (!shouldZoom) {
      setImageOpen(false);
    }
  }, []);

  async function handleDelete() {
    try {
      if (img && !img.includes("https")) {
        await DeleteFromStorage(img);
      }

      await axios.delete(`/${userID}/payment/${id}`);
      await onRefresh(id);
      handleClose(false);
      toast({ title: "Payment Deleted" });
    } finally {
      setDeleteLoading(false);
    }
  }

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

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader className="mb-4">
          <SheetTitle>Payment Image</SheetTitle>
          {!payment_lock && editAllowed && (
            <Button
              className="mb-2"
              variant="destructive"
              size="icon"
              onClick={(e) => {
                // e.stopPropagation()
                // setSelectedCustomerId(currentItem?.id);
                // setShowConfirmation(true);
                if (!id) return;
                setDeleteLoading(true);
                handleDelete(id);
              }}
            >
              {deleteLoading ? <Spinner /> : <Trash size={16} />}
            </Button>
          )}
          {localImage ? (
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={rotateImageLeft}
                      >
                        Rotate Left
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={rotateImageRight}
                      >
                        Rotate Right
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onPressClose}
                      >
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
          ) : (
            <Label>No Image found</Label>
          )}

          <strong>TID</strong>
          <Label>{note}</Label>

          {cheque_id &&
          <>
          <strong>Cheque#</strong>
          <Label>{cheque_id}</Label>
          </>}

          <strong>Remarks</strong>
          <Label>{remarks}</Label>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

const InstallmentSheet = ({ visible, onClose, data, updateData, onDeleteData }) => {
  const [imageOpen, setImageOpen] = useState(false);
  const { toast } = useToast();
  const { isAdmin, userID } = useUserDetail();

  const handleClose = useCallback(() => {
    if (!imageOpen) {
      onClose();
    }
  }, [imageOpen, onClose]);

  const RenderEachRow = ({ item }) => {
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false)

    async function handlePaid(id) {
      if (!id || !userID) return;

      setLoading(true);

      try {
        await axios.put(`/${userID}/reminders/${id}`, {
          pending: false,
        });
        updateData(id, false);
      } catch (error) {
        toast({
          title: "Failed to update status",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }


    async function handleDelete(id) {
      if (!id || !userID) return;

      setDeleteLoading(true);

      if (item.image) {
        DeleteFromStorage(item.image);
      }

      try {
        await axios.delete(`/${userID}/reminders/${id}`);
        onDeleteData(id);
      } catch (error) {
        toast({
          title: "Failed to delete installment",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      } finally {
        setDeleteLoading(false);
      }
    }

    return (
      <div className="rounded-xl border shadow-sm bg-white dark:bg-neutral-900 hover:shadow-md transition p-3">
        <div className="grid grid-cols-5 items-center gap-4 p-3 ">
          {/* Status */}
          <div>
            {item.pending ? (
              <Badge variant="destructive">Pending</Badge>
            ) : (
              <Badge variant="secondary">Paid</Badge>
            )}
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Input
              value={moment(item.date).format("YYYY-MM-DD")}
              readOnly
              className="h-8 text-sm"
            />
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Amount</Label>
            <Input value={item.amount} readOnly className="h-8 text-sm" />
          </div>

          {/* Image */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Image</Label>
            <RenderInstallmentImage
              img={item.image}
              setImageOpen={setImageOpen}
            />
          </div>

          {/* Action */}

        </div>

        <div className="flex justify-end gap-4">
          {isAdmin && item?.pending && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => handlePaid(item.id)}
              disabled={loading}
            >
              {loading && <Spinner className="h-4 w-4 animate-spin" />}
              Mark Paid
            </Button>
          )}

          {isAdmin &&
            <Button onClick={() => {
              handleDelete(item.id)
            }} variant="destructive" disable={deleteLoading}>   {loading && <Spinner className="h-4 w-4 animate-spin" />}
              Delete</Button>
          }
        </div>
      </div>

    );
  };

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent className="w-[90vw] max-w-[90vw]"
        style={{ width: "100%", maxWidth: "90vw" }}>
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-semibold">
            Installments
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[80vh] px-1">
          <div className="flex flex-1 flex-col gap-3">
            {data.length > 0 ? (
              data.map((item, index) => (
                <RenderEachRow key={index} item={item} />
              ))
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                No installments found
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

const RenderInstallmentImage = memo(({ img, type, setImageOpen }) => {
  const [localImage, setLocalImage] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const handleZoomChange = useCallback((shouldZoom) => {
    setIsZoomed(shouldZoom);
    setImageOpen(shouldZoom);
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (type) {
      setLocalImage(img);
    } else if (img) {
      if (img.includes("http")) {
        setLocalImage(img);
      } else {
        getDownloadURL(ref(storage, img)).then((url) => {
          if (isMounted) setLocalImage(url);
        });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [img, type]);

  return (
    <div className="space-y-2">
      <ControlledZoom isZoomed={isZoomed} onZoomChange={handleZoomChange}>
        <img
          src={localImage}
          alt="payment-img"
          className="h-[150px] w-auto object-contain"
        />
      </ControlledZoom>
    </div>
  );
});

const ViewImagesSheet = ({
  editAllowed,
  visible,
  onClose,
  data,
  onRefresh,
  customer_id,
}) => {
  const [imageOpen, setImageOpen] = useState(false);
  const [contractPdfImages, setContractPdfImages] = useState([]);
  const [otherPdfImages, setOtherPdfImages] = useState([]);
  const [addImageVisible, setAddImageVisible] = useState(false);

  const { userID } = useUserDetail();
  const { toast } = useToast();

  const contractImages = useMemo(() => data?.contract_images_png || [], [data]);
  const otherImages = useMemo(() => data?.other_images_png || [], [data]);
  const handshakeImages = useMemo(() => data?.handshake_images || [], [data]);
  const handoverImages = useMemo(
    () => data?.final_handover_images || [],
    [data]
  );
  const nameplateImages = useMemo(
    () => data?.machine_nameplate_images || [],
    [data]
  );
  const installationReport = useMemo(
    () => data?.installation_report || [],
    [data]
  );

  const prepareData = useCallback(async (pdfUrls, condition) => {
    let localImages = [];
    await Promise.all(
      pdfUrls.map(async (pdfUrl) => {
        const pdfData = await fetchPdfData(pdfUrl);
        const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;

        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const scale = 2;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: ctx, viewport }).promise;
          const imgData = canvas.toDataURL("image/jpeg");

          localImages.push(imgData);
        }
      })
    );
    if (condition === "pdf") {
      setContractPdfImages((prevState) => [...prevState, ...localImages]);
    } else {
      setOtherPdfImages((prevState) => [...prevState, ...localImages]);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;

    if (data?.contract_images_pdf?.length) {
      prepareData(data.contract_images_pdf, "pdf");
    }
    if (data?.other_images_pdf?.length) {
      prepareData(data.other_images_pdf, "other");
    }

    return () => {
      setContractPdfImages([]);
      setOtherPdfImages([]);
    };
  }, [visible, data?.contract_images_pdf, data?.other_images_pdf, prepareData]);

  const handleClose = useCallback(() => {
    if (!imageOpen) {
      onClose();
    }
  }, [imageOpen, onClose]);

  const handleDeleteImage = async (imgUrl, typeKey) => {
    try {
      if (!imgUrl || !typeKey) return;
      let storagePath = "";
      if (imgUrl.includes("https")) {
        storagePath = "";
      } else {
        storagePath = imgUrl;
      }

      if (storagePath) {
        await DeleteFromStorage(storagePath);
      }

      const updatedImages = data[typeKey].filter((i) => i !== imgUrl);
      let formData = { [typeKey]: updatedImages };

      if (typeKey === "final_handover_images") {
        formData.handover_user_id = null;
      }

      await axios.put(`/${userID}/machine/${data.id}`, formData);

      toast({ title: "Image deleted successfully." });
      await onRefresh();
    } catch (error) {
      toast({
        title: "Failed to delete image",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent
        className="w-[90vw] max-w-[90vw]"
        style={{ width: "100%", maxWidth: "90vw" }}
      >
        <SheetHeader className="mb-4">
          <div className="flex gap-4 flex-wrap">
            <SheetTitle className="text-2xl">View Images</SheetTitle>
            <Button
              onClick={() => {
                if (editAllowed) {
                  setAddImageVisible(true);
                } else {
                  toast({
                    title: "You are not allowed to perform this action ",
                    variant: "destructive",
                  });
                }
              }}
            >
              Add Image
            </Button>
          </div>
          <AddImages
            customer_id={customer_id}
            machine={data}
            visible={addImageVisible}
            onClose={setAddImageVisible}
            onRefresh={onRefresh}
          />
          <ScrollArea className="h-[85vh] px-4">
            <div className="flex flex-1 flex-col gap-2">
              <Label className="font-semibold text-[18px]">
                Handshake Images
              </Label>
              <div className="flex flex-row gap-2 flex-wrap">
                {handshakeImages.length > 0 ? (
                  handshakeImages.map((item, ind) => (
                    <RenderImage
                      key={ind}
                      img={item}
                      setImageOpen={setImageOpen}
                      onDelete={editAllowed ? handleDeleteImage : null}
                      imageType="handshake_images"
                    />
                  ))
                ) : (
                  <p>No images found</p>
                )}
              </div>
              <Label className="font-semibold text-[18px]">
                Nameplate Images
              </Label>
              <div className="flex flex-row gap-2 flex-wrap">
                {nameplateImages.length > 0 ? (
                  nameplateImages.map((item, ind) => (
                    <RenderImage
                      key={ind}
                      img={item}
                      setImageOpen={setImageOpen}
                      onDelete={editAllowed ? handleDeleteImage : null}
                      imageType="machine_nameplate_images"
                    />
                  ))
                ) : (
                  <p>No images found</p>
                )}
              </div>

              <Label className="font-semibold text-[18px]">
                Handover Images
              </Label>
              <div className="flex flex-row gap-2 flex-wrap">
                {handoverImages.length > 0 ? (
                  handoverImages.map((item, ind) => (
                    <RenderImage
                      key={ind}
                      img={item}
                      setImageOpen={setImageOpen}
                      onDelete={editAllowed ? handleDeleteImage : null}
                      imageType="final_handover_images"
                    />
                  ))
                ) : (
                  <p>No images found</p>
                )}
              </div>
              <Label className="font-semibold text-[18px]">
                Installation Report
              </Label>
              <div className="flex flex-row gap-2 flex-wrap">
                {installationReport.length > 0 ? (
                  installationReport.map((item, ind) => (
                    <RenderImage
                      key={ind}
                      img={item}
                      setImageOpen={setImageOpen}
                      onDelete={editAllowed ? handleDeleteImage : null}
                      imageType="installation_report"
                    />
                  ))
                ) : (
                  <p>No report found</p>
                )}
              </div>

              <Label className="font-semibold text-[18px]">
                Contract Images
              </Label>
              <div className="flex flex-row gap-2 flex-wrap">
                {contractImages.length > 0 ? (
                  contractImages.map((item, ind) => (
                    <RenderImage
                      key={ind}
                      img={item}
                      setImageOpen={setImageOpen}
                      onDelete={editAllowed ? handleDeleteImage : null}
                      imageType="contract_images_png"
                    />
                  ))
                ) : (
                  <p>No images found</p>
                )}
              </div>
              {contractPdfImages.map((item, ind) => (
                <RenderImage
                  key={ind}
                  img={item}
                  type="pdf"
                  setImageOpen={setImageOpen}
                />
              ))}

              <Label className="font-semibold text-[18px]">
                Additional Images
              </Label>
              <div className="flex flex-row gap-2 flex-wrap">
                {otherImages.length > 0 ? (
                  otherImages.map((item, ind) => (
                    <RenderImage
                      key={ind}
                      img={item}
                      setImageOpen={setImageOpen}
                      onDelete={editAllowed ? handleDeleteImage : null}
                      imageType="other_images_png"
                    />
                  ))
                ) : (
                  <p>No images found</p>
                )}
              </div>
              {otherPdfImages.map((item, ind) => (
                <RenderImage
                  key={ind}
                  img={item}
                  type="pdf"
                  setImageOpen={setImageOpen}
                />
              ))}
            </div>
          </ScrollArea>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

const RenderImage = memo(({ img, type, setImageOpen, onDelete, imageType }) => {
  const [localImage, setLocalImage] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleZoomChange = useCallback((shouldZoom) => {
    setIsZoomed(shouldZoom);
    setImageOpen(shouldZoom);
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (type) {
      setLocalImage(img);
    } else if (img) {
      if (img.includes("http")) {
        setLocalImage(img);
      } else {
        getDownloadURL(ref(storage, img)).then((url) => {
          if (isMounted) setLocalImage(url);
        });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [img, type]);

  return (
    <div className="space-y-2">
      <ControlledZoom isZoomed={isZoomed} onZoomChange={handleZoomChange}>
        <img
          src={localImage}
          alt="payment-img"
          className="h-[150px] w-auto object-contain"
        />
      </ControlledZoom>
      {onDelete && (
        <Button
          variant="destructive"
          size="icon"
          onClick={(e) => {
            setDeleteLoading(true);
            onDelete(img, imageType);
          }}
        >
          {deleteLoading ? <Spinner /> : <Trash size={16} />}
        </Button>
      )}
    </div>
  );
});

const AddImages = ({ customer_id, machine, visible, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();
  const { state: OfficeState } = useContext(OfficeContext);
  const formSchema = z
    .object({
      note: z.string().min(1, { message: "Type is required." }),
      images: z
        .array(z.string().url())
        .min(1, { message: "one image is required" }),
      handover_user_id: z.number().nullable().optional(),
    })
    .refine(
      (data) =>
        data.note !== "handover" ||
        (data.handover_user_id !== null && data.handover_user_id !== undefined),
      {
        message: "Handover User ID is required",
        path: ["handover_user_id"],
      }
    );

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      images: [],
      handover_user_id: null,
    },
  });

  async function onSubmit(values) {
    setLoading(true);
    let allProcessedImages = [];
    await Promise.all(
      values.images.map(async (item) => {
        const name = `${OfficeState.value.data
          }/customer/${customer_id}/machine/${machine.id}/${values.note
          }/${moment().valueOf().toString()}.png`;
        const imageRefResult = await UploadImage(item, name);
        allProcessedImages.push(name);
      })
    );
    let formData = {};
    if (values.note === "contract") {
      formData.contract_images_png = [
        ...machine.contract_images_png,
        ...allProcessedImages,
      ];
    } else if (values.note === "additional") {
      formData.other_images_png = [
        ...machine.other_images_png,
        ...allProcessedImages,
      ];
    } else if (values.note === "handshake") {
      formData.handshake_images = [
        ...machine.handshake_images,
        ...allProcessedImages,
      ];
    } else if (values.note === "installation") {
      formData.installation_report = [
        ...machine.installation_report,
        ...allProcessedImages,
      ];
    } else if (values.note === "handover") {
      formData.final_handover_images = [
        ...machine.final_handover_images,
        ...allProcessedImages,
      ];
      formData.handover_user_id = values.handover_user_id;
    } else if (values.note === "nameplate") {
      formData.machine_nameplate_images = [
        ...machine.machine_nameplate_images,
        ...allProcessedImages,
      ];
    }

    await axios
      .put(`/${userID}/machine/${machine.id}`, formData)
      .then(async (response) => {
        await onRefresh();
        handleClose(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function handleClose(val) {
    form.reset();
    onClose(val);
  }

  const handleFileChange = async (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);

      let localImages = [];

      await Promise.all(
        files.map(async (file) => {
          const pdfData = await fetchPdfData(file);
          const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;

          for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const scale = 2; // Increase for better quality
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: ctx, viewport }).promise;
            const imgData = canvas.toDataURL("image/jpeg");

            localImages.push(imgData);
          }
        })
      );

      form.setValue("images", localImages);
    }
  };

  const fetchPdfData = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  };

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogTrigger asChild></DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Images</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh] px-2">
          <div className="px-2">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-2"
              >
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          className="flex flex-wrap"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="contract" id="r1" />
                            <Label htmlFor="r1">Contract</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="handshake" id="r2" />
                            <Label htmlFor="r2">Handshake</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nameplate" id="r2" />
                            <Label htmlFor="r2">Machine nameplate</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="handover" id="r2" />
                            <Label htmlFor="r2">Final handover</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="installation" id="r2" />
                            <Label htmlFor="r2">Installation report</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="additional" id="r2" />
                            <Label htmlFor="r2">Additional</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("note") === "handover" && (
                  <FormField
                    control={form.control}
                    name="handover_user_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Handover User</FormLabel>
                        <FormControl>
                          <UserSearch
                            value={field.value}
                            onReturn={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Add Images</FormLabel>
                      <FormControl>
                        <DropzoneMulti
                          value={field.value || []}
                          onDrop={(files) => {
                            field.onChange(files);
                          }}
                          title="Click to upload"
                          subheading="or drag and drop"
                          description="PNG or JPG"
                          drag="Drop the files here..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-1 gap-2 items-center">
                  <Separator className="flex flex-1" />
                  <Label className="mx-2 text-[16px]">or</Label>
                  <Separator className="flex flex-1" />
                </div>
                <Label className="font-medium text-[16px]">Select Pdf</Label>
                <input
                  multiple
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleFileChange(e)}
                />

                <Button className="w-full" type="submit">
                  {loading && <Spinner />} Submit
                </Button>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const MyImg = ({ img }) => {
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
  if (!img || error || !localImage) return <p>No image</p>;

  return <Image alt="payment image" src={localImage} width={50} height={50} />;
};

const RenderVerifyButton = ({ item, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();
  async function handleVerify(item) {
    setLoading(true);
    await axios
      .put(`/${userID}/payment-verification/${item.id}`, {
        status: "approved",
        payment_lock: true,
      })
      .then(async () => {
        await onRefresh();
      })
      .finally(() => {
        setLoading(false);
      });
  }
  return (
    <Button
      disabled={loading}
      onClick={() => {
        handleVerify(item);
      }}
    >
      {loading && <Spinner />} {loading ? "Verifying" : "Verify"}
    </Button>
  );
};
