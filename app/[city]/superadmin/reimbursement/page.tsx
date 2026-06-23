"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowUpDown,
  Banknote,
  CalendarDays,
  Download,
  FileText,
  Filter,
  Info,
  Loader2,
  Plus,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  Trash,
  UserRound,
  WalletCards
} from "lucide-react";
import {
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";

import PageTable from "@/components/app-table-without-pagination";
import AppCalendar from "@/components/appCalendar";
import CurrencyFormatter from "@/components/currency-formatter";
import { CustomerSearchWithData } from "@/components/customer-search-with-data";
import Dropzone from "@/components/dropzone";
import { MyImgZooming } from "@/components/img-zooming";
import { RequiredStar } from "@/components/RequiredStar";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserSearch } from "@/components/user-search";
import FilterSheet from "@/components/users/filterSheet";
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
import moment from "moment";
import momentT from "moment-timezone";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
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
        <div className="flex items-center gap-2">

          {row.original?.verified ? (

            <Tooltip>
              <TooltipTrigger>

                <ShieldCheck className="text-green-600 h-5 w-5" />

              </TooltipTrigger>
              <TooltipContent className="bg-green-600 mr-2" arrowColor="bg-green-600 fill-green-600">
                <p className="text-white">verified</p>
              </TooltipContent>
            </Tooltip>
          ) : (

            <Tooltip>
              <TooltipTrigger>

                <Info className="text-orange-600 h-5 w-5 animate-pulse-opacity mr-2" />

              </TooltipTrigger>
              <TooltipContent className="bg-orange-600" arrowColor="bg-orange-600 fill-orange-600">
                <p className="text-white">Unverified</p>
              </TooltipContent>
            </Tooltip>

          )}

          <div>
            {row.getValue("date")
              ? moment(new Date(row.getValue("date"))).format("YYYY-MM-DD")
              : ""}
          </div>
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
    <div className="flex flex-1 flex-col gap-5">
      <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className="flex flex-col gap-5 border-b bg-muted/20 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <WalletCards className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Expense control
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                Reimbursement
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Manage reimbursement claims, receipt proofs, verification state, and monthly totals.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setReimbursementVisible(true)}
            className="w-full gap-2 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add Reimbursement
          </Button>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <Card className="rounded-2xl shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <Banknote className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Total Amount
                  </CardTitle>
                  <div className="text-xl font-bold">
                    <CurrencyFormatter amount={total} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Claims
                  </CardTitle>
                  <div className="text-xl font-bold">{data.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    View
                  </CardTitle>
                  <div className="text-xl font-bold">Monthly</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="flex flex-1 overflow-hidden rounded-2xl border bg-background p-3 shadow-sm">
        <PageTable
          tableWidth="w-[calc(100dvw-30px)]"
          loading={loading}
          columns={columns}
          data={data}
          onRowClick={(val) => {
            setImageURL(val);
            setVisible(true);
          }}
        >
          <div className="flex w-full flex-col gap-3 rounded-xl border bg-muted/15 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setFilterVisible(true)}
                variant="outline"
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filter
              </Button>

              <Button
                variant="outline"
                className="gap-2"
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
                {resetLoading ? <Spinner /> : <RotateCcw className="h-4 w-4" />}
                Reset
              </Button>

              <Button
                variant="outline"
                className="gap-2"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>

            <div className="rounded-xl border bg-background px-4 py-2 text-sm font-medium text-muted-foreground">
              Total:{" "}
              <span className="font-bold text-foreground">
                <CurrencyFormatter amount={total} />
              </span>
            </div>
          </div>
        </PageTable>
      </section>
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
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { userID } = useUserDetail();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);


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
      <SheetContent className="w-full overflow-hidden p-0 sm:max-w-md">
        <SheetHeader className="border-b bg-muted/20 px-5 py-5 text-left">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-xl font-bold tracking-tight">
                Bill Detail
              </SheetTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Review receipt proof, description, and submitter details.
              </p>
            </div>
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100dvh-150px)]">
          <div className="space-y-4 p-5">
            <div className="rounded-2xl border bg-background p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Submitted by
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold">
                    {submittedBy || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-background p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                  <FileText className="h-5 w-5" />
                </div>
                <p className="font-semibold">Description</p>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                {description || "No description available"}
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-muted/15 p-3">

              <MyImgZooming img={img} />

            </div>

            <Button
              className="w-full gap-2"
              variant="destructive"
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
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash className="h-4 w-4" />
              )}
              Delete
            </Button>
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
  const { state: OfficeState } = useContext(OfficeContext)!

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
      resolved: z.boolean().optional()
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
      resolved: false
    },
  });

  async function onSubmit(values: FormValues) {
    const verified =
      values.title !== "Complaint" &&
      values.title !== "Overhauling";
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
        resolved: values.resolved,
        verified
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
      <DialogContent className="max-w-[94vw] overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b bg-muted/20 px-5 py-5 text-left">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Add New Reimbursement
              </DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Capture visit purpose, expense details, submitter, and receipt attachment.
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100dvh-160px)]">
          <div className="space-y-4 p-5">
            <RadioGroup
              defaultValue={selectedRadio}
              onValueChange={setSelectedRadio}
              className="grid gap-3 sm:grid-cols-2"
            >
              <div className="flex items-center space-x-2 rounded-2xl border bg-background p-3">
                <RadioGroupItem value="customer" id="r1" />
                <Label htmlFor="r1">Customer</Label>
              </div>
              <div className="flex items-center space-x-2 rounded-2xl border bg-background p-3">
                <RadioGroupItem value="other" id="r2" />
                <Label htmlFor="r2">Other</Label>
              </div>
            </RadioGroup>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

                {/* Trip Details */}
                <FieldSet className="gap-4 rounded-2xl border bg-background p-4 shadow-sm">
                  <FieldLegend className="px-1 text-sm font-semibold text-foreground">Trip Details</FieldLegend>

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
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Purpose" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="New Installation">New Installation</SelectItem>
                              <SelectItem value="Complaint">Complaint</SelectItem>
                              <SelectItem value="Overhauling">Overhauling</SelectItem>
                              <SelectItem value="Sales Meeting">Sales Meeting</SelectItem>
                              <SelectItem value="Final Hand Over">Final Hand Over</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  {/* Resolved (conditional) */}
                  {(form.watch("title") === "Complaint" || form.watch("title") === "Overhauling") && (
                    <Controller
                      name="resolved"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <div className="flex items-center gap-2">
                            <FieldLabel>Resolved?</FieldLabel>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked: boolean) => field.onChange(checked)}
                            />
                          </div>
                        </Field>
                      )}
                    />
                  )}

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
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </FieldSet>

                {/* Expense Details */}
                <FieldSet className="gap-4 rounded-2xl border bg-background p-4 shadow-sm">
                  <FieldLegend className="px-1 text-sm font-semibold text-foreground">Expense Details</FieldLegend>

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
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                        <AppCalendar date={field.value} onChange={field.onChange} min={new Date(new Date().getFullYear(), new Date().getMonth(), 1)} />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </FieldSet>

                {/* Description */}
                <FieldSet className="gap-4 rounded-2xl border bg-background p-4 shadow-sm lg:col-span-2">
                  <FieldLegend className="px-1 text-sm font-semibold text-foreground">Description</FieldLegend>

                  <Controller
                    name="description"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <Textarea placeholder="Enter description" {...field} />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </FieldSet>

                {/* Attachment */}
                <FieldSet className="gap-4 rounded-2xl border bg-muted/15 p-4 lg:col-span-2">
                  <FieldLegend className="px-1 text-sm font-semibold text-foreground">Attachment</FieldLegend>

                  <Controller
                    name="image"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <Dropzone
                          value={field.value}
                          onDrop={(file) => field.onChange(file)}
                          title="Click to upload"
                          subheading="or drag and drop"
                          description="PNG or JPG"
                          drag="Drop the files here..."
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </FieldSet>

              </div>

              {/* Submit */}
              <Button className="w-full" type="submit" disabled={loading}>
                {loading && <Spinner />} Submit
              </Button>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
