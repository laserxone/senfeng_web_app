"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, Edit, Filter } from "lucide-react";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import PageTable from "@/components/app-table-without-pagination";
import AppCalendar from "@/components/appCalendar";
import Dropzone from "@/components/dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { storage } from "@/config/firebase";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import exportToExcel from "@/lib/exportToExcel";
import { MyCustomer, UserReimbursementType, UserReimbursementTypes } from "@/lib/types";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { getDownloadURL, ref } from "firebase/storage";
import moment from "moment";
import { Controller, useForm } from "react-hook-form";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { z } from "zod";
import CurrencyFormatter from "../currency-formatter";
import { CustomerSearchWithData } from "../customer-search-with-data";
import { RequiredStar } from "../RequiredStar";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import Spinner from "../ui/spinner";
import FilterSheet from "./filterSheet";
import { Field, FieldGroup, FieldLabel } from "../ui/field";

export default function Reimbursement({
  id,
  passingData,
  onAddRefresh,
  onFilterReturn,
  onReset,
  onUpdatePurpose,
  height
}: UserReimbursementTypes) {
  const [filterVisible, setFilterVisible] = useState(false);
  const [data, setData] = useState<UserReimbursementType[]>([]);
  const [imageURL, setImageURL] = useState<{ submitted_by_name: string, description: string, image: string } | null>(null);
  const [visible, setVisible] = useState(false);
  const [reimbursementVisible, setReimbursementVisible] = useState(false);
  const [total, setTotal] = useState(0);
  const [resetLoading, setResetLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UserReimbursementType | null>(null);

  useEffect(() => {
    setData([...passingData]);
  }, [passingData]);

  const columns: ColumnDef<UserReimbursementType>[] = [
    {
      accessorKey: "date",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="ml-2">
          {row.getValue("date")
            ? moment(new Date(row.getValue("date"))).format("YYYY-MM-DD")
            : ""}
        </div>
      ),
    },

    {
      accessorKey: "title",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Purpose
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div className="ml-2">{row.getValue("title")}</div>;
      },
    },

    {
      accessorKey: "customer",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Customer
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("customer")}</div>,
    },
    {
      accessorKey: "city",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            City
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div className="ml-2">{row.getValue("city")}</div>,
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
      cell: ({ row }) => <div>{row.getValue("amount")}</div>,
    },

    {
      accessorKey: "description",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Description
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("description")}</div>,
    },

    {
      id: "actions",
      cell: ({ row }) => {
        const currentItem = row.original;
        if (currentItem?.customer_id && !currentItem?.purpose)
          return (
            <Edit
              size={14}
              className="hover:cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedItem(currentItem);
              }}
            />
          );
      },
    },
  ];

  function handleDownload() {
    const headers = [
      "Date",
      "Customer",
      "City",
      "Amount",
      "Description",
      "Submitted By",
    ];

    const formattedData = [...data].map((item) => [
      moment(item.date).format("YYYY-MM-DD"),
      item.title,
      item?.city,
      Number(item.amount || 0),
      item.description,
      item.submitted_by_name,
    ]);
    exportToExcel(
      headers,
      formattedData,
      "Reimbursement.xlsx",
      false,
      "",
      false,
    );
  }

  useEffect(() => {
    let localTotal = 0;
    data.forEach((item) => {
      localTotal = localTotal + Number(item.amount);
    });
    setTotal(localTotal);
  }, [data]);

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-1">
        <PageTable
        height={height}
          columns={columns}
          data={data}
          onRowClick={(val, e) => {
            setImageURL(val);
            setVisible(true);
          }}
        >
          <Button
            onClick={() => setFilterVisible(true)}
            variant="ghost"
            className="p-0 w-8"
          >
            <Filter />
          </Button>

          <Button
            variant="destructive"
            onClick={async () => {
              setResetLoading(true);
              const startDate = moment().startOf("month").toISOString();
              const endDate = moment().endOf("month").toISOString();
              await onReset(startDate, endDate);
              setResetLoading(false);
            }}
          >
            {resetLoading && <Spinner />} Reset
          </Button>

          <Button onClick={() => setReimbursementVisible(true)}>
            Add Reimbursement
          </Button>

          <div className="flex flex-1 justify-between items-center">
            <Button onClick={handleDownload}>Download</Button>
            <Card>

              <CardContent>
                <h1>Total Amount</h1>
                <div className="text-2xl font-bold">
                  <CurrencyFormatter amount={total} />
                </div>
              </CardContent>
            </Card>
          </div>
        </PageTable>
      </div>

      <AddPurpose
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        visible={!!selectedItem}
        onUpdate={onUpdatePurpose}
      />

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await onFilterReturn(val.start, val.end);
        }}
      />
      <ImageSheet
        visible={visible}
        onClose={() => setVisible(false)}
        img={imageURL?.image || null}
        description={imageURL?.description || null}
        submittedBy={imageURL?.submitted_by_name || null}
      />

      <AddReimbursementDialog
        id={id}
        visible={reimbursementVisible}
        onClose={setReimbursementVisible}
        onRefresh={async () => {
          await onAddRefresh()
          setReimbursementVisible(false);
        }}
      />
    </div>
  );
}

const ImageSheet = ({ visible, onClose, img, submittedBy, description }: { visible: boolean, onClose: () => void, img: string | null, submittedBy: string | null, description: string | null }) => {
  const [imageOpen, setImageOpen] = useState(false);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const isMountedRef = useRef(true);

  const fetchImage = useCallback(async () => {
    if (!img) return;

    if (img.includes("http")) {
      if (isMountedRef.current) setLocalImage(img);
    } else {
      try {
        const storageRef = ref(storage, img);
        const url = await getDownloadURL(storageRef);

        if (isMountedRef.current) setLocalImage(url);
      } catch (error) {
        console.error("Error fetching image URL:", error);
      }
    }
  }, [img]);

  // Use Effect to fetch image on mount or when img changes
  useEffect(() => {
    isMountedRef.current = true;
    fetchImage();

    return () => {
      isMountedRef.current = false;
      setLocalImage(null);
    };
  }, [fetchImage]);

  // Memoized function for closing modal
  const handleClose = useCallback(() => {
    if (!imageOpen) {
      onClose();
    }
  }, [imageOpen, onClose]);

  // Memoized function for zoom change
  const handleZoomChange = useCallback((shouldZoom: boolean) => {
    setIsZoomed(shouldZoom);
    if (!shouldZoom) {
      setImageOpen(false);
    }
  }, []);

  // Memoized local image URL to prevent unnecessary re-renders
  const memoizedImage = useMemo(() => localImage, [localImage]);

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader className="mb-4">
          <SheetTitle>Bill Detail</SheetTitle>

          <strong>Submitted by</strong>
          <p>{submittedBy || "N/A"}</p>

          <strong>Description</strong>
          <p>{description || "No description available"}</p>

          {memoizedImage ? (
            <ControlledZoom isZoomed={isZoomed} onZoomChange={handleZoomChange}>
              <img
                onClick={() => setImageOpen(true)}
                className="hover:cursor-pointer"
                src={memoizedImage}
                alt="reimbursement-img"
                style={{
                  flex: 1,
                  maxWidth: "100%",
                  maxHeight: "400px",
                  objectFit: "contain",
                }}
              />
            </ControlledZoom>
          ) : (
            <p>Loading image...</p>
          )}
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

const AddReimbursementDialog = ({ visible, onClose, onRefresh, id }: { visible: boolean, onClose: (val: boolean) => void, onRefresh: () => Promise<void>, id: number | string }) => {
  const [selectedRadio, setSelectedRadio] = useState("customer");
  const [selectedCustomer, setSelectedCustomer] = useState<MyCustomer | null>(null);
  const { state: OfficeState } = useContext(OfficeContext);
  const [loading, setLoading] = useState(false);

  const formSchema = z.object({
    title: z.string().min(1, { message: "Purpose is required." }),
    customer: z.number({ error: "Customer is required." }).nullable(),
    description: z.string().min(1, { message: "Description is required." }),
    amount: z.coerce.number<number>().min(0, "Amount is required"),
    date: z.date({ error: "Date is required." }),
    image: z.string().min(1, { message: "Image is required." }),
    city: z.string().min(1, { message: "City is required." }),
  })
    .refine(
      (data) => selectedRadio !== "customer" || (data.customer !== undefined && data.customer !== null),
      {
        path: ["customer"],
        message: "Customer is required.",
      }
    );

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: 0,
      date: undefined,
      image: "",
      city: "",
      customer: null,
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const name = `${OfficeState.value.data}/${id}/reimbursement/${moment().valueOf().toString()}.png`;
      const imgRef = await UploadImage(values.image, name);
      const response = await axios.post(`/${id}/reimbursement`, {
        amount: values.amount,
        title: values.title,
        description: values.description,
        city: values.city,
        image: name,
        date: values.date,
        submitted_by: id,
        customer_id: selectedRadio === 'customer' ? values.customer : null,
        purpose: true
      });
      onRefresh();
      form.reset();
      setSelectedCustomer(null);
      setSelectedRadio("customer");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(val) => {
        form.reset();
        setSelectedCustomer(null);
        setSelectedRadio("customer");
        setLoading(false);
        onClose(false);
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Reimbursement</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh] px-2">
          <div className="px-2 space-y-4">
            <RadioGroup
              defaultValue={selectedRadio}
              onValueChange={setSelectedRadio}
              className="flex"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="customer" id="r1" />
                <Label htmlFor="r1">Customer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="r2" />
                <Label htmlFor="r2">Other</Label>
              </div>
            </RadioGroup>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FieldGroup>

                {/* Customer (conditional) */}
                {selectedRadio === "customer" && (
                  <Controller
                    name="customer"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>
                          Customer <RequiredStar />
                        </FieldLabel>

                        <CustomerSearchWithData
                          value={selectedCustomer}
                          onReturn={(val) => {
                            field.onChange(val.id);
                            setSelectedCustomer(val);

                            if (val.location) {
                              form.setValue("city", val.location);
                            }

                            form.setValue("title", val?.company || val?.owner || "");
                          }}
                        />
                      </Field>
                    )}
                  />
                )}

                {/* Purpose */}
                <Controller
                  name="title"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>
                        Purpose <RequiredStar />
                      </FieldLabel>

                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Purpose" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="New Installation">
                              New Installation
                            </SelectItem>
                            <SelectItem value="Complaint">
                              Complaint
                            </SelectItem>
                            <SelectItem value="Overhauling">
                              Overhauling
                            </SelectItem>
                            <SelectItem value="Sales Meeting">
                              Sales Meeting
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />

                {/* City */}
                <Controller
                  name="city"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>
                        City <RequiredStar />
                      </FieldLabel>

                      <Input placeholder="Enter city" {...field} />
                    </Field>
                  )}
                />

                {/* Description */}
                <Controller
                  name="description"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>
                        Description <RequiredStar />
                      </FieldLabel>

                      <Textarea placeholder="Enter description" {...field} />
                    </Field>
                  )}
                />

                {/* Amount */}
                <Controller
                  name="amount"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>
                        Amount <RequiredStar />
                      </FieldLabel>

                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </Field>
                  )}
                />

                {/* Date */}
                <Controller
                  name="date"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>
                        Date <RequiredStar />
                      </FieldLabel>

                      <AppCalendar
                        date={field.value}
                        onChange={field.onChange}
                        max={new Date()}
                        min={
                          new Date(
                            new Date().getFullYear(),
                            new Date().getMonth(),
                            1
                          )
                        }
                      />
                    </Field>
                  )}
                />

                {/* Image */}
                <Controller
                  name="image"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>
                        Image <RequiredStar />
                      </FieldLabel>

                      <div className="flex flex-1 items-center justify-center">
                        <Dropzone
                          value={field.value}
                          onDrop={(file) => field.onChange(file)}
                          title="Click to upload"
                          subheading="or drag and drop"
                          description="PNG or JPG"
                          drag="Drop the files here..."
                        />
                      </div>
                    </Field>
                  )}
                />

                {/* Submit */}
                <Button className="w-full" type="submit" disabled={loading}>
                  {loading && <Spinner />} Submit
                </Button>

              </FieldGroup>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const AddPurpose = ({ item, visible, onClose, onUpdate }: { item: UserReimbursementType | null, visible: boolean, onClose: () => void, onUpdate: (val: UserReimbursementType) => void }) => {
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();

  function handleClose() {
    setPurpose("");
    setLoading(false);
    onClose();
  }
  async function handleSubmit() {
    if (!item?.id) return;

    try {
      setLoading(true);
      await axios.put(`/${userID}/reimbursement/${item.id}`, { title: purpose, purpose: true });
      let updatedItem = { ...item };
      updatedItem.purpose = purpose;
      onUpdate(updatedItem);
      handleClose();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }
  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Missing Purpose</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Select Purpose</Label>
            <Select onValueChange={setPurpose} value={purpose}>
              <SelectTrigger>
                <SelectValue placeholder="Select Purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="New Installation">
                    New Installation
                  </SelectItem>
                  <SelectItem value="Complaint">Complaint</SelectItem>
                  <SelectItem value="Overhauling">Overhauling</SelectItem>
                  <SelectItem value="Sales Meeting">Sales Meeting</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>

          <Button disabled={loading || !purpose} onClick={handleSubmit}>
            {loading && <Spinner />}
            <span className="ml-1">Submit</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
