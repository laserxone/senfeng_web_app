"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowUpDown,
  Filter,
  Loader2,
  Trash
} from "lucide-react";
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
import CurrencyFormatter from "@/components/currency-formatter";
import { CustomerSearchWithData } from "@/components/customer-search-with-data";
import Dropzone from "@/components/dropzone";
import { RequiredStar } from "@/components/RequiredStar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import Heading from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Spinner from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { UserSearch } from "@/components/user-search";
import FilterSheet from "@/components/users/filterSheet";
import { storage } from "@/config/firebase";
import { TIMEZONE } from "@/constants/data";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import exportToExcel from "@/lib/exportToExcel";
import { MyCustomer, UserReimbursementType } from "@/lib/types";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { getDownloadURL, ref } from "firebase/storage";
import moment from "moment";
import momentT from "moment-timezone";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { z } from "zod";

export default function Page() {
  const [filterVisible, setFilterVisible] = useState(false);
  const [data, setData] = useState<UserReimbursementType[]>([]);
  const [imageURL, setImageURL] = useState<UserReimbursementType | null>(null);
  const [visible, setVisible] = useState(false);
  const [reimbursementVisible, setReimbursementVisible] = useState(false);
  const [total, setTotal] = useState(0);
  const { base_route, userID } = useUserDetail();
  const [resetLoading, setResetLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userID) {
      const startDate = momentT
        .tz(TIMEZONE)
        .startOf("month")
        .startOf("day")
        .utc()
        .toISOString();
      const endDate = momentT
        .tz(TIMEZONE)
        .endOf("month")
        .endOf("day")
        .utc()
        .toISOString();
      fetchData(startDate, endDate);
    }
  }, [userID]);

  async function fetchData(startDate: string, endDate: string, user: null | number = null) {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `/${userID}/reimbursement?start_date=${startDate}&end_date=${endDate}&user=${user || ""
          }`,
        )
        .then((response) => {
          setData(response.data);
          resolve(true);
        })
        .catch((e) => {
          console.log(e);
          reject(null);
        })
        .finally(() => {
          setLoading(false);
        });
    });
  }

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
        <div>
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
      cell: ({ row }) => {
        const currentItem = row.original;
        if (currentItem.customer_id)
          return (
            <Link
              href={`/${base_route}/${currentItem.customer_member ? "member" : "customer"
                }/${currentItem.customer_id}`}
              target="blank"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ml-2 hover:underline">
                {row.getValue("customer")}
              </div>
            </Link>
          );
      },
    },

    {
      accessorKey: "ownership_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Manager
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => {
        const currentItem = row.original;
        if (currentItem.ownership_id)
          return <div className="ml-2">{row.getValue("ownership_name")}</div>;
      },
    },

    {
      accessorKey: "submitted_by_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Submitted By
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="ml-2">{row.getValue("submitted_by_name")}</div>
      ),
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

  ];

  function handleDownload() {
    const headers = [
      "Date",
      "Customer",
      "Submitted By",
      "City",
      "Amount",
      "Description",
    ];

    const formattedData = data.map((item) => [
      moment(item.date).format("YYYY-MM-DD"),
      item?.title,
      item.submitted_by_name,
      item.city,
      Number(item.amount || 0),
      item.description,
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
      <div className="flex justify-between flex-wrap">
        <Heading title="Reimbursement" description="Manage reimbursements" />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyFormatter amount={total} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-1 min-h-[600px]">
        <PageTable
          loading={loading}
          columns={columns}
          data={data}
          onRowClick={(val) => {
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
              const startDate = momentT
                .tz(TIMEZONE)
                .startOf("month")
                .startOf("day")
                .utc()
                .toISOString();
              const endDate = momentT
                .tz(TIMEZONE)
                .endOf("month")
                .endOf("day")
                .utc()
                .toISOString();
              await fetchData(startDate, endDate);
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
          </div>
        </PageTable>
      </div>
      <FilterSheet
        user_disable={false}
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await fetchData(val.start, val.end, val.user);
        }}
      />
      <ImageSheet
        visible={visible}
        onClose={() => setVisible(false)}
        img={imageURL?.image || null}
        description={imageURL?.description || null}
        submittedBy={imageURL?.submitted_by_name || null}
        id={imageURL?.id || null}
        onRefresh={async (id) => {
          const tempData = [...data.filter((item) => item.id !== id)];
          setData([...tempData]);
          return true;
        }}
      />

      <AddReimbursementDialog
        visible={reimbursementVisible}
        onClose={setReimbursementVisible}
        onRefresh={async () => {
          const startDate = momentT
            .tz(TIMEZONE)
            .startOf("month")
            .startOf("day")
            .utc()
            .toISOString();
          const endDate = momentT
            .tz(TIMEZONE)
            .endOf("month")
            .endOf("day")
            .utc()
            .toISOString();
          await fetchData(startDate, endDate);
          setReimbursementVisible(false);
        }}
      />
    </div>
  );
}
const ImageSheet = ({
  visible,
  onClose,
  img,
  submittedBy,
  description,
  id,
  onRefresh,
}: {
  visible: boolean,
  onClose: () => void,
  img: string | null,
  submittedBy: string | null,
  description: string | null,
  id: number | null
  onRefresh: (id: number) => void
}) => {
  const [imageOpen, setImageOpen] = useState(false);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const isMountedRef = useRef(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { userID } = useUserDetail();

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

  useEffect(() => {
    isMountedRef.current = true;
    fetchImage();

    return () => {
      isMountedRef.current = false;
      setLocalImage(null);
    };
  }, [fetchImage]);

  const handleClose = useCallback(() => {
    if (!imageOpen) {
      onClose();
    }
  }, [imageOpen, onClose]);

  const handleZoomChange = useCallback((shouldZoom: boolean) => {
    setIsZoomed(shouldZoom);
    if (!shouldZoom) {
      setImageOpen(false);
    }
  }, []);

  const memoizedImage = useMemo(() => localImage, [localImage]);

  async function handleDelete() {
    if (img) {
      if (img.includes("https")) {
      } else {
        DeleteFromStorage(img);
      }
    }
    axios.delete(`/${userID}/reimbursement/${id}`).then(async () => {
      if (id)
        onRefresh(id);
      setDeleteLoading(false);
      handleClose();
    });
  }

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Bill Detail</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex flex-1 h-[90vh] px-4">
          <div className="flex flex-col">
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
                handleDelete();
              }}
            >
              {deleteLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Trash size={16} />
              )}
            </Button>

            <strong>Submitted by</strong>
            <p>{submittedBy || "N/A"}</p>

            <strong>Description</strong>
            <p>{description || "No description available"}</p>

            {memoizedImage ? (
              <ControlledZoom
                isZoomed={isZoomed}
                onZoomChange={handleZoomChange}
              >
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
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

const AddReimbursementDialog = ({ visible, onClose, onRefresh }: { visible: boolean, onClose: (val: boolean) => void, onRefresh: () => Promise<void> }) => {
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<MyCustomer | null>(null);
  const [selectedRadio, setSelectedRadio] = useState("customer");
  const { userID } = useUserDetail();
  const { state: OfficeState } = useContext(OfficeContext);

  const formSchema = z
    .object({
      title: z.string().min(1, { message: "Purpose is required." }),
      customer: z.number({ error: "Customer is required." }).nullable(),
      description: z.string().min(1, { message: "Description is required." }),
      amount: z.coerce.number<number>().min(0, "Amount is required"),
      date: z.date({ error: "Date is required." }),
      image: z.string().min(1, { message: "Image is required." }),
      city: z.string().min(1, { message: "City is required." }),
      submitted_by: z.number().min(1, { message: "User is required" }),
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
      submitted_by: undefined,
      customer: null,
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const name = `${OfficeState.value.data}/${values.submitted_by
        }/reimbursement/${moment().valueOf().toString()}.png`;
      const imgRef = await UploadImage(values.image, name);
      const response = await axios.post(`/${userID}/reimbursement`, {
        amount: values.amount,
        title: values.title,
        description: values.description,
        city: values.city,
        image: name,
        date: values.date,
        submitted_by: values.submitted_by,
        customer_id: selectedRadio === "customer" ? values?.customer : null,
        purpose: true,
      });
      onRefresh();
      form.reset();
      onClose(false);
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
        setLoading(false);
        onClose(val);
      }}
    >
      <DialogContent className="max-w-[90vw] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Reimbursement</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[80vh] px-2">
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

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                )}


                <Controller
                  name="title"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>
                        Purpose <RequiredStar />
                      </FieldLabel>

                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
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

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* City */}
                <Controller
                  name="city"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>
                        City <RequiredStar />
                      </FieldLabel>

                      <Input placeholder="Enter city" {...field} />

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Description */}
                <Controller
                  name="description"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>
                        Description <RequiredStar />
                      </FieldLabel>

                      <Textarea placeholder="Enter description" {...field} />

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Amount */}
                <Controller
                  name="amount"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>
                        Amount <RequiredStar />
                      </FieldLabel>

                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          if (!isNaN(Number(e.target.value))) {
                            field.onChange(Number(e.target.value));
                          }
                        }}
                      />

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Date */}
                <Controller
                  name="date"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>
                        Date <RequiredStar />
                      </FieldLabel>

                      <AppCalendar
                        date={field.value}
                        onChange={field.onChange}
                        max={new Date()}
                      />

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Submitted By */}
                <Controller
                  name="submitted_by"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>
                        Select User <RequiredStar />
                      </FieldLabel>

                      <UserSearch value={field.value} onReturn={field.onChange} />

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Image */}
                <Controller
                  name="image"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>
                        Image <RequiredStar />
                      </FieldLabel>

                      <Dropzone
                        value={field.value}
                        onDrop={(file) => field.onChange(file)}
                        title="Click to upload"
                        subheading="or drag and drop"
                        description="PNG or JPG"
                        drag="Drop the files here..."
                      />

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Submit */}
                <Button className="w-full" type="submit">
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
