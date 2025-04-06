"use client";
import PageContainer from "@/components/page-container";
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
  Trash,
  Wrench,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import AddPayment from "@/components/addPayment";
import ConfimationDialog from "@/components/alert-dialog";
import PageTable from "@/components/app-table";
import DropzoneMulti from "@/components/dropzone-multi";
import EditMachine from "@/components/editMachine";
import EditPayment from "@/components/editPayment";
import InvoicePDF from "@/components/invoicepdf";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Spinner from "@/components/ui/spinner";
import { storage } from "@/config/firebase";
import { BASE_URL, Colors } from "@/constants/data";
import { useToast } from "@/hooks/use-toast";
import { debounce } from "@/lib/debounce";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import { UploadImage } from "@/lib/uploadFunction";
import { UserContext } from "@/store/context/UserContext";
import { pdf } from "@react-pdf/renderer";
import axios from "axios";
import { getDownloadURL, ref } from "firebase/storage";
import moment from "moment";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import "pdfjs-dist/build/pdf.worker";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

export default function Machine() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const pageTableRef = useRef();
  const search = useSearchParams();
  const [data, setData] = useState();
  const [total, setTotal] = useState(0);
  const [received, setReceived] = useState(0);
  const [payments, setPayments] = useState([]);
  const { toast } = useToast();
  const [imageURL, setImageURL] = useState(null);
  const [visible, setVisible] = useState(false);
  const [imagesVisible, setImagesVisible] = useState(false);

  const [editMachine, setEditMachine] = useState(false);
  const id = search.get("id");
  const [addPayment, setAddPayment] = useState(false);
  const [editPayment, setEditPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState({});
  const { state: UserState } = useContext(UserContext);

  useEffect(() => {
    if (id && UserState?.value?.data?.id) {
      debouncedFetchData(id);
    }
  }, [search, UserState]);

  const debouncedFetchData = useCallback(
    debounce((id) => {
      fetchData(id);
    }, 1000),
    []
  );

  async function fetchData(id) {
    try {
      const response = await axios.get(`${BASE_URL}/machine/${id}`);
      const machine = response.data?.machine;
      const user = UserState?.value?.data;

      // if (
      //   (user?.designation === "Sales" || user?.designation === "Engineer") &&
      //   machine?.sell_by !== user?.id
      // ) {
      //   toast({
      //     variant: "destructive",
      //     title: "Error.",
      //     description: "Machine was not sold by you",
      //   });
      //   return false;
      // }

      setData(response.data);
      if (machine) {
        setTotal(Number(machine.price || 0));

        const payments = machine?.payments || [];
        setPayments(payments);
        setReceived(
          payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
        );
      }

      return true;
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Something went wrong.",
        description:
          e.response?.data?.message || "There was a problem with your request.",
      });
      return null;
    }
  }

  const columns = [
    {
      accessorKey: "track",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Payment
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div className="ml-2">{row.getValue("track")}</div>,
    },

    {
      accessorKey: "transaction_date",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Note
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
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
        const userData = UserState?.value?.data;
        const isSalesOrEngineer =
          userData?.designation === "Sales" || userData?.designation === "Engineer";
        const isOwner = data?.machine?.sell_by === userData?.id;
    
        if (!isSalesOrEngineer || isOwner) {
          return (
            <EditIcon
              style={{ color: Colors.button }}
              className="cursor-pointer h-5 w-5"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPayment(currentItem);
                setEditPayment(true);
              }}
            />
          );
        }
    
        return null; // Explicitly return null if no conditions match
      },
    }
  ];

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
      serial: data?.machine?.order_no,
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

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <ClientCard
          data={data?.customer || null}
          machine={data?.machine || null}
          payment={[total, received]}
        />
        {data && (
          <div className="flex gap-2">
            <Button onClick={() => setImagesVisible(true)}>View Images</Button>
            <Button
              onClick={() => {
                if (
                  UserState?.value?.data?.designation === "Sales" ||
                  UserState?.value?.data?.designation === "Engineer"
                ) {
                  if (data?.machine?.sell_by === UserState?.value?.data?.id) {
                    setAddPayment(true);
                  } else {
                    toast({ title: "You are not allowed to add payment" ,   variant: "destructive", });
                  }

                  return;
                } else {
                  setAddPayment(true);
                }
              }}
            >
              Add Payment
            </Button>
            
            <Button
              onClick={() => {
                if (
                  UserState?.value?.data?.designation === "Sales" ||
                  UserState?.value?.data?.designation === "Engineer"
                ) {
                  if (data?.machine?.sell_by === UserState?.value?.data?.id) {
                    setEditMachine(true);
                  } else {
                    toast({ title: "You are not allowed to edit machine",   variant: "destructive", });
                  }

                  return;
                } else {
                  setEditMachine(true);
                }
              }}
            >
              Edit Machine
            </Button>
            {payments.length > 0 && (
              <Button
                onClick={() => {
                  handleDownloadLedger();
                }}
              >
                Download Ledger
              </Button>
            )}

            <AddPayment
              customer_id={data?.customer?.id}
              visible={addPayment}
              onClose={setAddPayment}
              machine_id={id}
              onRefresh={async () => await fetchData(id)}
            />

            <EditPayment
              customer_id={data?.customer?.id}
              visible={editPayment}
              onClose={setEditPayment}
              machine_id={id}
              data={selectedPayment}
              onRefresh={async () => await fetchData(id)}
            />
          </div>
        )}
        <PageTable
          
          columns={columns}
          data={payments}
          totalItems={payments.length}
          disableInput={true}
          onRowClick={(val) => {
            if (val.id) {
              setImageURL(val);
              setVisible(true);
            }
          }}
        />
        <EditMachine
          visible={editMachine}
          onClose={setEditMachine}
          machine_id={id}
          onRefresh={async () => await fetchData(id)}
          data={data?.machine || {}}
        />
        <ConfimationDialog
          open={showConfirmation}
          title={"Are you sure you want to delete?"}
          description={"Your action will remove branch expense from the system"}
          onPressYes={() => console.log("press yes")}
          onPressCancel={() => setShowConfirmation(false)}
        />
        <ImageSheet
          visible={visible}
          onClose={() => setVisible(false)}
          img={imageURL?.image || null}
          note={imageURL?.note || null}
          remarks={imageURL?.remarks || null}
          id={imageURL?.id}
          onRefresh={async () => {
            await fetchData(id);
            return true;
          }}
        />
        <ViewImagesSheet
          visible={imagesVisible}
          data={data?.machine || {}}
          customer_id={data?.customer?.id}
          onClose={() => setImagesVisible(false)}
          onRefresh={async () => await fetchData(id)}
        />
      </div>
    </PageContainer>
  );
}

const ClientCard = memo(({ data, payment, machine, manager }) => {
  return (
    <Card className="bg-gray-100 dark:bg-gray-900 rounded-lg shadow-md p-4 w-full">
      {/* Company Name */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center">
        {data?.name || "Customer Name"}{" "}
        <span className="text-gray-500 text-sm">
          {data?.owner && ` (${data.owner})`}
        </span>
      
      </h2>
      <h2 className="text-md font-bold text-primary dark:text-white mb-4 flex items-center justify-center">
      Manager {machine?.sell_by_name  || "NA"}
      </h2>
     

      <div className="grid md:grid-cols-2 gap-6">
        {/* Machine Info */}
        <Card className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <CardContent>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Machine Information
            </h3>
            {machine ? (
              <div className="text-gray-600 dark:text-gray-300 text-sm space-y-2">
                <p>
                  <Wrench className="inline h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  Serial No:{" "}
                  <span className="font-medium">
                    {machine.serial_no || "N/A"}
                  </span>
                </p>
                <p>
                  <ClipboardList className="inline h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  Power:{" "}
                  <span className="font-medium">{machine.power || "N/A"}</span>
                </p>
                <p>
                  <ClipboardList className="inline h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  Source:{" "}
                  <span className="font-medium">{machine.source || "N/A"}</span>
                </p>
                <p>
                  <ClipboardList className="inline h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  Order No:{" "}
                  <span className="font-medium">
                    {machine.order_no || "N/A"}
                  </span>
                </p>
                <p>
                  <ClipboardList className="inline h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  Contract Date:{" "}
                  <span className="font-medium">
                    {machine.contract_date
                      ? moment(machine.contract_date).format("DD/MM/YYYY")
                      : "N/A"}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No machine data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Billing Information */}
        <Card className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <CardContent>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Billing Summary
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300">
              <p>
                {/* <DollarSign className="inline h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" /> */}
                Bill:
              </p>
              <p>
                {/* <DollarSign className="inline h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" /> */}
                Received:
              </p>
              <p>
                {/* <DollarSign className="inline h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" /> */}
                Balance:
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm mt-2 font-semibold">
              <p>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "PKR",
                }).format(payment[0] || 0)}
              </p>
              <p className="text-green-600">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "PKR",
                }).format(payment[1] || 0)}
              </p>
              <p className="text-red-600">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "PKR",
                }).format(payment[0] - payment[1] || 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Card>
  );
});

const ImageSheet = ({
  visible,
  onClose,
  img,
  note,
  remarks,
  id,
  onRefresh,
}) => {
  const [imageOpen, setImageOpen] = useState(false);
  const [localImage, setLocalImage] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { state: UserState } = useContext(UserContext);
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
    }
  }, [img]);

  function handleClose() {
    if (!imageOpen) {
      onClose();
    }
  }

  const [isZoomed, setIsZoomed] = useState(false);

  const handleZoomChange = useCallback((shouldZoom) => {
    setIsZoomed(shouldZoom);
    if (!shouldZoom) {
      setImageOpen(false);
    }
  }, []);

  async function handleDelete() {
    if (img && !img.includes("http")) {
      const deleteRef = await DeleteFromStorage(img);
    }
    axios
      .delete(`${BASE_URL}/payment/${id}`)
      .then(async () => {
        await onRefresh(id);
        setDeleteLoading(false);
        handleClose(false);
        toast({ title: "Payment Deleted" });
      })
      .catch(() => {
        toast({ title: "Error occured", variant: "destructive" });
      });
  }

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader className="mb-4">
          <SheetTitle>Payment Image</SheetTitle>
          {UserState.value.data?.designation === "Owner" && (
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
          <ControlledZoom isZoomed={isZoomed} onZoomChange={handleZoomChange}>
            <img
              onClick={() => setImageOpen(true)}
              className="hover:cursor-pointer"
              src={localImage}
              alt="payment-img"
            />
          </ControlledZoom>

          <strong>Note</strong>
          <Label>{note}</Label>

          <strong>Remarks</strong>
          <Label>{remarks}</Label>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

const ViewImagesSheet = ({
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

  const contractImages = useMemo(() => data?.contract_images_png || [], [data]);
  const otherImages = useMemo(() => data?.other_images_png || [], [data]);

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

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader className="mb-4">
          <SheetTitle className="text-2xl">View Images</SheetTitle>
          <Button onClick={() => setAddImageVisible(true)}>Add Image</Button>
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
                Contract Images
              </Label>
              {contractImages.map((item, ind) => (
                <RenderImage key={ind} img={item} setImageOpen={setImageOpen} />
              ))}
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
              {otherImages.map((item, ind) => (
                <RenderImage key={ind} img={item} setImageOpen={setImageOpen} />
              ))}
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

const RenderImage = memo(({ img, type, setImageOpen }) => {
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
    <ControlledZoom isZoomed={isZoomed} onZoomChange={handleZoomChange}>
      <img src={localImage} alt="payment-img" />
    </ControlledZoom>
  );
});

const AddImages = ({ customer_id, machine, visible, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const formSchema = z.object({
    note: z.string().min(1, { message: "Type is required." }),
    images: z
      .array(z.string().url())
      .min(1, { message: "one image is required" }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      images: [],
    },
  });

  async function onSubmit(values) {
    setLoading(true);
    console.log("Form Data:", values);
    let allProcessedImages = [];
    await Promise.all(
      values.images.map(async (item) => {
        const name = `customer/${customer_id}/machine/${machine.id}/${
          values.note
        }/${moment().valueOf().toString()}.png`;
        const imageRefResult = await UploadImage(item, name);
        allProcessedImages.push(name);
      })
    );
    let formData = {};
    if (values.note == "contract") {
      formData.contract_images_png = [
        ...machine.contract_images_png,
        ...allProcessedImages,
      ];
    } else {
      formData.other_images_png = [
        ...machine.other_images_png,
        ...allProcessedImages,
      ];
    }
    await axios
      .put(`${BASE_URL}/machine/${machine.id}`, formData)
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
    const arrayBuffer = await file.arrayBuffer(); // Get the raw data of the PDF
    return new Uint8Array(arrayBuffer); // Return it as a Uint8Array for PDF.js to handle
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
                      {/* <FormLabel>Note</FormLabel> */}
                      <FormControl>
                        <RadioGroup
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          className="flex"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="contract" id="r1" />
                            <Label htmlFor="r1">Contract</Label>
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
                  Submit
                </Button>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
