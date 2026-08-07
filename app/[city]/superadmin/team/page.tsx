"use client";
import PageTable from "@/components/shared/tables/app-table";
import AppCalendar from "@/components/features/calendar/app-calendar";
import { RequiredStar } from "@/components/shared/common/RequiredStar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import Heading from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { Team } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import moment from "moment";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const columns: ColumnDef<Team>[] = [
  {
    accessorKey: "name",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div className="ml-2">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "designation",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Designation
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("designation")}</div>,
  },

  {
    accessorKey: "joining_date",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Joining Date
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div>
        {row.getValue("joining_date")
          ? moment(row.getValue("joining_date")).format("YYYY-MM-DD")
          : null}
      </div>
    ),
  },

  {
    accessorKey: "leaving_date",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Leaving Date
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div>
        {row.getValue("leaving_date")
          ? moment(row.getValue("leaving_date")).format("YYYY-MM-DD")
          : null}
      </div>
    ),
  },

  {
    accessorKey: "email",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },

  {
    accessorKey: "office",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Office
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="uppercase">{row.getValue("office")}</div>
    ),
  },

  {
    accessorKey: "active",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => {
      const val = row.getValue("active");
      return (
        <Badge variant={val ? "default" : "destructive"}>
          {val ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
];

export default function Page() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { userID, office, base_route } = useUserDetail();
  const [status, setStatus] = useState("Active");

  useEffect(() => {
    if (userID) fetchData();
  }, [userID]);

  async function fetchData() {
    return new Promise((resolve, reject) => {
      axios
        .get(`/${userID}/user?withbranch=true`)
        .then((response) => {
          setData(response.data);
        })
        .finally(() => {
          resolve(true);
          setLoading(false);
        });
    });
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <Heading panel title="Team" description="Manage team members" />
        <Button
          onClick={() => {
            setOpen(true);
          }}
        >
          Add User
        </Button>
      </div>
      <PageTable
        tableWidth="w-[calc(100dvw-30px)]"
        loading={loading}
        columns={columns}
        data={data.filter((item) => {
          if (status === "All") return true;
          if (status === "Active") return item.active === true;
          return item.active === false;
        })}
        onRowClick={(val, event) => {
          if (val.id) {
            const url = `/${base_route}/team/${val.id}`;
            if (event.ctrlKey || event.metaKey) {
              window.open(url, "_blank");
            } else {
              router.push(url);
            }
          }
        }}
      >
        <div className="w-fit">
          <Select onValueChange={setStatus} value={status}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </PageTable>

      <AddUserDialog
        visible={open}
        onClose={setOpen}
        office={office}
        onReturn={(newUser) => {
          let temp = [...data];
          temp.push(newUser);
          temp.sort((a, b) => {
            const nameA = a.name ? a.name.toLowerCase() : "";
            const nameB = b.name ? b.name.toLowerCase() : "";

            if (!nameA && nameB) return 1;
            if (nameA && !nameB) return -1;

            return nameA.localeCompare(nameB);
          });
          setData([...temp]);
          toast.success("New user added");
        }}
      />
    </div>
  );
}

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.email({ message: "Invalid email address." }),
  designation: z.string().min(1, { message: "Designation missing" }),
  joining_date: z.date({ error: "Joining date is required." }),
  office: z.string().min(1, { message: "" }),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const AddUserDialog = ({
  visible,
  onClose,
  onReturn,
  office = "islamabad",
}: {
  visible: boolean;
  onClose: (val: boolean) => void;
  onReturn: (item: any) => void;
  office: string;
}) => {
  const [dataLoading, setDataLoading] = useState(false);
  const { userID } = useUserDetail();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      designation: "",
      joining_date: undefined,
      note: "",
      office: office,
    },
  });

  function onSubmit(values: FormValues) {
    setDataLoading(true);

    axios
      .post(`/${userID}/user`, {
        ...values,
        email : values.email.trim().toLocaleLowerCase(),
        name: values.name.toUpperCase(),
      })
      .then(async (response) => {
        onReturn(response.data);
        handleClose(false);
      })
      .finally(() => {
        setDataLoading(false);
      });
  }

  const designations = [
    { label: "Manager", value: "Manager" },
    { label: "Sales", value: "Sales" },
    { label: "Engineer", value: "Engineer" },
    { label: "Dealer", value: "Dealer" },
    {
      label: "Customer Relationship Manager",
      value: "Customer Relationship Manager",
    },
    {
      label: "Customer Relationship Manager (After Sales)",
      value: "Customer Relationship Manager (After Sales)",
    },
    {
      label: "Social Media Manager",
      value: "Social Media Manager",
    },
    { label: "Office Boy", value: "Office Boy" },
    { label: "Store Manager", value: "Store Manager" },
  ];

  async function handleClose(val: boolean) {
    onClose(val);
    form.reset();
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-[425px]">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <DialogTitle className="text-sm font-semibold text-foreground">
            Add New User
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-3 p-3.5 pb-4 [&_input]:rounded-lg [&_label]:text-[11px] [&_label]:font-semibold [&_label]:tracking-wide [&_label]:text-muted-foreground [&_label]:uppercase"
          >
            {/* Personal Information */}
            <FieldSet className="gap-3 rounded-md border p-3">
              <FieldLegend className="mb-1 px-1 text-sm text-muted-foreground">
                Personal Information
              </FieldLegend>

              {/* Name */}
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Name <RequiredStar />
                    </FieldLabel>
                    <Input placeholder="Enter name" {...field} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Email */}
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Email <RequiredStar />
                    </FieldLabel>
                    <Input placeholder="Enter email" {...field} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldSet>

            {/* Work Details */}
            <FieldSet className="gap-3 rounded-md border p-3">
              <FieldLegend className="mb-1 px-1 text-sm text-muted-foreground">
                Work Details
              </FieldLegend>

              {/* Designation */}
              <Controller
                name="designation"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Designation <RequiredStar />
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select designation..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {designations.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Office */}
              <Controller
                name="office"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Office branch <RequiredStar />
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select office" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {["lahore", "karachi"].map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Joining Date */}
              <Controller
                name="joining_date"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>
                      Joining Date <RequiredStar />
                    </FieldLabel>
                    <AppCalendar date={field.value} onChange={field.onChange} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldSet>

            {/* Additional Info */}
            <FieldSet className="gap-3 rounded-md border p-3">
              <FieldLegend className="mb-1 px-1 text-sm text-muted-foreground">
                Additional Info
              </FieldLegend>

              {/* Note */}
              <Controller
                name="note"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Additional Note</FieldLabel>
                    <Textarea placeholder="Enter personal note" {...field} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldSet>

            {/* Submit */}
            <Button disabled={dataLoading} className="w-full" type="submit">
              {dataLoading && <Spinner />} Save
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
