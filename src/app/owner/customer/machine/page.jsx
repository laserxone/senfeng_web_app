"use client";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import PageContainer from "@/components/page-container";
import { Heading } from "@/components/ui/heading";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import AppCalendar from "@/components/appCalendar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Dropzone from "@/components/dropzone";
import Image from "next/image";
import ConfimationDialog from "@/components/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageTable from "@/components/app-table";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import "react-medium-image-zoom/dist/styles.css";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import "pdfjs-dist/build/pdf.worker";
import html2canvas from "html2canvas";
import { debounce } from "@/lib/debounce";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import DropzoneMulti from "@/components/dropzone-multi";

export default function Page() {
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
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const id = search.get("id");
    if (id) {
      debouncedFetchData(id);
    }
  }, [search]);

  const debouncedFetchData = useCallback(
    debounce((id) => {
      fetchData(id);
    }, 1000),
    []
  );

  async function fetchData(id) {
    axios
      .get(`/api/machine/${id}`)
      .then((response) => {
        setData(response.data);
        if (response.data?.machine) {
          setTotal(Number(response.data.machine.price || 0));
          if (response.data.machine?.payments) {
            setPayments(response.data.machine?.payments);
            if (response.data.machine?.payments.length > 0) {
              let temp = 0;
              response.data.machine?.payments.map((eachPayment) => {
                temp = temp + Number(eachPayment?.amount || 0);
              });
              setReceived(temp);
            }
          }
        }
      })
      .catch((e) => {
        toast({
          variant: "destructive",
          title: "Something went wrong.",
          description:
            e.response.data?.message ||
            "There was a problem with your request.",
        });
      });

    axios
      .get("/api/users")
      .then((response) => {
        setUsers(response.data);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  const columns = [
    {
      accessorKey: "track",
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
            ? new Date(row.getValue("transaction_date")).toLocaleDateString(
                "en-GB"
              )
            : ""}
        </div>
      ),
    },

    {
      accessorKey: "clearance_date",
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
            ? new Date(row.getValue("clearance_date")).toLocaleDateString(
                "en-GB"
              )
            : "Pending"}
        </div>
      ),
    },
    {
      accessorKey: "amount",
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

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                className="hover:cursor-pointer"
                onClick={() => {
                  setImageURL(currentItem);
                  setVisible(true);
                }}
              >
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:cursor-pointer"
                onClick={() =>
                  router.push(`customer/detail?id=${currentItem.id}`)
                }
              >
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                className="hover:cursor-pointer"
                onClick={() => setShowConfirmation(true)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <ClientCard data={data?.customer || null} payment={[total, received]} />
        {data && (
          <div className="flex gap-2">
            <Button onClick={() => setImagesVisible(true)}>View Images</Button>
            <AddPayment users={users} />
          </div>
        )}
        <PageTable
          ref={pageTableRef}
          columns={columns}
          data={payments}
          totalItems={payments.length}
          disableInput={true}
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
        />
        <ViewImagesSheet
          visible={imagesVisible}
          data={data?.machine || {}}
          onClose={() => setImagesVisible(false)}
        />
      </div>
    </PageContainer>
  );
}

const ClientCard = ({ data, payment }) => {
  const joinedNumber = data?.number ? data.number.join(", ") : "";
  return (
    <div className="flex w-full justify-between flex-wrap gap-2">
      <Heading
        title={
          <div className="flex items-center gap-2 justify-start text-[18px]">
            {data?.name}
          </div>
        }
        description={
          <>
            {data?.owner} <br />
            {data?.group} <br />
            {data?.location} <br />
            {data?.email} <br />
            {joinedNumber}
          </>
        }
      />
      <BillingInformation payment={payment || [0, 0]} />
    </div>
  );
};

const BillingInformation = ({ payment }) => {
  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
  }).format(payment[0] || 0);
  const formattedReceived = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
  }).format(payment[1] || 0);
  const formattedBalance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
  }).format(payment[0] - payment[1] || 0);

  return (
    <div className="p-4  bg-gray-100 rounded-lg shadow-sm dark:bg-gray-800 dark:text-white">
      <h3 className="text-lg font-semibold text-black dark:text-white">
        Billing Summary
      </h3>
      <Separator />
      <div className="grid grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300 mt-2">
        <p>
          <strong>Bill:</strong>
        </p>
        <p>
          <strong>Received:</strong>
        </p>
        <p>
          <strong>Balance:</strong>
        </p>
      </div>
      <div
        className="grid grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300 mt-2"
        style={{ fontWeight: 700 }}
      >
        <p>{formattedTotal}</p>
        <p style={{ color: "green", fontWeight: 700 }}>{formattedReceived}</p>
        <p style={{ color: "red", fontWeight: 700 }}>{formattedBalance}</p>
      </div>
    </div>
  );
};

const AddPayment = ({ users }) => {
  const formSchema = z.object({
    note: z.string().min(1, { message: "Note is required." }),
    amount: z
      .number()
      .min(0.01, { message: "Amount must be greater than zero." }),
    paymentMode: z.string().min(1, { message: "Payment mode is required." }),
    receivedBy: z.number({ required_error: "Received by is required." }),
    transactionDate: z.date({
      required_error: "Transaction date is required.",
    }),
    clearanceDate: z.date().optional(),
    status: z.string().optional(),
    image: z.string().min(1, { message: "Image by is required." }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: "",
      amount: "",
      paymentMode: "",
      receivedBy: null,
      transactionDate: undefined,
      clearanceDate: undefined,
      status: "Pending",
      image: null,
    },
  });
  function onSubmit(values) {
    console.log("Form Data:", values);
  }

  const imageFile = form.watch("image");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button onClick={() => form.reset()}>Add Payment</Button>
      </DialogTrigger>
      <DialogContent className={`max-w-[95vw] sm:max-w-md lg:max-w-2xl p-4`}>
        <DialogHeader>
          <DialogTitle>Add New Payment</DialogTitle>
        </DialogHeader>
        <div
          className={`flex flex-col sm:flex-row gap-4 sm:gap-6`}
          style={{
            display: "flex",
            flexDirection: imageFile ? "row" : "column",
            gap: imageFile ? 16 : 0,
          }}
        >
          <div className="flex flex-1">
            <ScrollArea className="max-h-[80vh] px-2 w-full">
              <div className="px-2">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    {/* Note Field */}
                    <FormField
                      control={form.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note / TID</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter note / TID" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Amount Field */}
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter amount"
                              value={field.value}
                              onChange={(e) => {
                                if (!isNaN(e.target.value)) {
                                  field.onChange(Number(e.target.value));
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Payment Mode */}
                    <FormField
                      control={form.control}
                      name="paymentMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Mode</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(val) => field.onChange(val)}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment mode" />
                              </SelectTrigger>
                              <SelectContent>
                                {["Cheque", "Cash", "Deposit", "Online"].map(
                                  (user) => (
                                    <SelectItem key={user} value={user}>
                                      {user}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Received By */}
                    <FormField
                      control={form.control}
                      name="receivedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Received By</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(val) =>
                                field.onChange(Number(val))
                              }
                              value={field.value || ""}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select user" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {users?.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Transaction Date */}
                    <FormField
                      control={form.control}
                      name="transactionDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transaction Date</FormLabel>
                          <FormControl>
                            <AppCalendar
                              date={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Clearance Date */}
                    <FormField
                      control={form.control}
                      name="clearanceDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Clearance Date</FormLabel>
                          <FormControl>
                            <AppCalendar
                              date={field.value}
                              onChange={(date) => {
                                field.onChange(date);
                                if (date) {
                                  form.setValue("status", "Cleared");
                                } else {
                                  form.setValue("status", "Pending");
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Image Field */}
                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image</FormLabel>
                          <FormControl>
                            <div className="flex flex-1 items-center justify-center">
                              <Dropzone
                                value={field.value}
                                onDrop={(file) => {
                                  field.onChange(file);
                                }}
                                title={"Click to upload"}
                                subheading={"or drag and drop"}
                                description={"PNG or JPG"}
                                drag={"Drop the files here..."}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submit Button */}
                    <Button className="w-full" type="submit">
                      Submit
                    </Button>
                  </form>
                </Form>
              </div>
            </ScrollArea>
          </div>

          {imageFile && (
            <div className="flex flex-1">
              <div className="mt-2 hidden sm:block">
                <Image
                  src={imageFile}
                  width={1000}
                  height={1000}
                  alt="Selected Image"
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AddImages = () => {
  const formSchema = z.object({
    note: z.string().min(1, { message: "Type is required." }),
    images: z.array(z.string().url()).optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      images: [],
    },
  });

  function onSubmit(values) {
    console.log("Form Data:", values);
  }

  const handleFileChange = async (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);

      console.log(files)

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
    <Dialog>
      <DialogTrigger asChild>
        <Button onClick={() => form.reset()}>Add Image</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Images</DialogTitle>
        </DialogHeader>
        <div>
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
                    <Separator className="flex flex-1"/>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ImageSheet = ({ visible, onClose, img, note }) => {
  const [imageOpen, setImageOpen] = useState(false);

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

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader className="mb-4">
          <SheetTitle>Payment Image</SheetTitle>

          <ControlledZoom isZoomed={isZoomed} onZoomChange={handleZoomChange}>
            <img
              onClick={() => setImageOpen(true)}
              className="hover:cursor-pointer"
              src={img}
              alt="payment-img"
            />
          </ControlledZoom>

          <strong>Note</strong>
          <Label>{note}</Label>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

const ViewImagesSheet = ({ visible, onClose, data }) => {
  const [imageOpen, setImageOpen] = useState(false);
  const [contractPdfImages, setContractPdfImages] = useState([]);
  const [otherPdfImages, setOtherPdfImages] = useState([]);

  const { contract_images_png, other_images_png } = data;

  useEffect(() => {
    if (visible) {
      if (data?.contract_images_pdf || data?.other_images_pdf) {
        const { contract_images_pdf, other_images_pdf } = data;
        if (contract_images_pdf && contract_images_pdf.length > 0) {
          prepareData(contract_images_pdf, "pdf");
        }

        if (other_images_pdf && other_images_pdf.length > 0) {
          prepareData(other_images_pdf, "other");
        }
      }
    }

    return () => {
      if (visible) {
        console.log("closed");
        setContractPdfImages([]);
        setOtherPdfImages([]);
      }
    };
  }, [data, visible]);

  async function prepareData(pdfUrls, condition) {
    console.log("called");
    console.log(pdfUrls);
    let localImages = [];
    await Promise.all(
      pdfUrls.map(async (pdfUrl) => {
        const pdfData = await fetchPdfData(pdfUrl);
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
    if (condition === "pdf") {
      setContractPdfImages((prevState) => [...prevState, ...localImages]);
    } else {
      setOtherPdfImages((prevState) => [...prevState, ...localImages]);
    }
  }

  const fetchPdfData = async (url) => {
    const response = await fetch(url);
    return new Uint8Array(await response.arrayBuffer());
  };

  function handleClose() {
    if (!imageOpen) {
      onClose();
    }
  }

  const RenderImage = ({ img }) => {
    const [isZoomed, setIsZoomed] = useState(false);

    const handleZoomChange = useCallback((shouldZoom) => {
      setIsZoomed(shouldZoom);
      setImageOpen(shouldZoom);
    }, []);

    return (
      <ControlledZoom isZoomed={isZoomed} onZoomChange={handleZoomChange}>
        <img src={img} alt="payment-img" />
      </ControlledZoom>
    );
  };

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader className="mb-4">
          <SheetTitle className="text-2xl">View Images</SheetTitle>
          <AddImages />
          <ScrollArea className="h-[85vh] px-4">
            <div className="flex flex-1 flex-col gap-2">
              <Label className="font-semibold text-[18px]">
                Contract Images
              </Label>

              {contract_images_png &&
                contract_images_png.map((item, ind) => (
                  <RenderImage key={ind} img={item} />
                ))}

              {contractPdfImages &&
                contractPdfImages.map((item, ind) => (
                  <RenderImage key={ind} img={item} />
                ))}

              <Label className="font-semibold text-[18px]">
                Additional Images
              </Label>
              {other_images_png &&
                other_images_png.map((item, ind) => (
                  <RenderImage key={ind} img={item} />
                ))}

              {otherPdfImages &&
                otherPdfImages.map((item, ind) => (
                  <RenderImage key={ind} img={item} />
                ))}
            </div>
          </ScrollArea>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};
