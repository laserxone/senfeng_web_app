"use client";
import { ArrowUpDown, Building2, DownloadIcon, MapPin, Phone, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import ConfirmationDialog from "@/components/alert-dialog";
import PageTable from "@/components/app-table";
import AddCustomerDialog from "@/components/customer-components/add-customer";
import useUserDetail from "@/hooks/use-user-detail";
import { ExtraCustomer, NewlyAssignedCustomer } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import moment from "moment";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import AddFeedbackDialog from "./add-feedback";


type CustomerEmployeeProps = {

  customer_data: ExtraCustomer[];
  onRefresh: () => Promise<void>;
  ownership: boolean;
  totalCustomerText?: string;
  height?: string

  newly_assigned?: null | { total: number, data: NewlyAssignedCustomer[] }

};

export default function CustomerEmployee({
  customer_data,
  onRefresh,
  ownership,
  height,

  newly_assigned,

}: CustomerEmployeeProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [data, setData] = useState<ExtraCustomer[]>([]);
  const [addCustomer, setAddCustomer] = useState(false);
  const { userID, designation, customer_add_access, base_route, route_branch } =
    useUserDetail();
  const [selectedCustomer, setSelectedCustomer] = useState<ExtraCustomer | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (customer_data && customer_data.length > 0) {
      setData(customer_data);
    }
  }, [customer_data]);


  const columns = useMemo(() => {
    const baseColumns: ColumnDef<ExtraCustomer>[] = [
      {
        accessorKey: "owner",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Owner
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => <div className="ml-2">{row.getValue("owner")}</div>,
      },
      {
        accessorKey: "name",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Company
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("name")}</div>,
      },
      {
        accessorKey: "industry",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Industry
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("industry")}</div>,
      },
      {
        accessorKey: "number",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Number
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("number")}</div>,
      },
      {
        accessorKey: "location",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Location
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("location")}</div>,
      },
      {
        accessorKey: "created_at",
        filterFn: "includesString",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Added
            <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div>
            {moment(new Date(row.getValue("created_at"))).format("YYYY-MM-DD")}
          </div>
        ),
      },
    ];

    if (
      designation === "Customer Relationship Manager" ||
      designation === "Social Media Manager"
    ) {
      baseColumns.push({
        id: "actions",
        cell: ({ row }) => {
          const currentItem = row.original;
          return (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCustomer(currentItem);
                setShowFeedback(true);
              }}
            >
              Take Feedback
            </Button>
          );
        },
      });
    }

    return baseColumns;
  }, [userID]);



  return (
    <div className="flex flex-1 flex-col space-y-4">

      <PageTable
        height={height}
        columns={columns}
        data={data}
        onRowClick={(val, event) => {
          if (val?.id) {
            const url = `/${base_route}/${val?.member ? "member" : "customer"
              }/${val.id}`;

            if (event.ctrlKey || event.metaKey) {
              window.open(url, "_blank");
            } else {

              router.push(url);
            }
          }
        }}
      >
        <div className=" flex justify-between">
          <div className="flex gap-4 flex-wrap">
            {customer_add_access && (
              <Button onClick={() => setAddCustomer(true)}>
                <Plus />   Add Customer
              </Button>
            )}
            {newly_assigned && <RenderNewlyAssigned data={newly_assigned} />}
          </div>
        </div>
      </PageTable>

      <AddCustomerDialog
        office={route_branch}
        user_id={userID}
        user_designation={designation}
        ownership={ownership}
        visible={addCustomer}
        onClose={setAddCustomer}
        onRefresh={async () => {
          setData([]);
          await onRefresh();
        }}
      />

      <AddFeedbackDialog open={showFeedback} customer_id={selectedCustomer?.id} onClose={() => {
        setSelectedCustomer(null)
        setShowFeedback(false)
      }}
        onRefresh={onRefresh}
        user_id={userID} />

      <ConfirmationDialog
        open={showConfirmation}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove branch expense from the system"}
        onPressYes={() => console.log("press yes")}
        onPressCancel={() => setShowConfirmation(false)}
      />
    </div>
  );
}



const RenderNewlyAssigned = ({ data }: { data: { total: number, data: NewlyAssignedCustomer[] } }) => {
  const { base_route } = useUserDetail()
  const customers = data?.data || []

  const formatNumber = (value: NewlyAssignedCustomer["number"]) => {
    if (Array.isArray(value)) return value.filter(Boolean).join(", ")
    return value || "N/A"
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-white rounded-md"
        >
          <DownloadIcon />  New Customers Assigned
          <Badge >
            {data?.total || 0}
          </Badge>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[94vw] overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b bg-muted/20 px-5 py-5 text-left">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <DownloadIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl font-bold tracking-tight">
                New Customers Assigned
              </DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {data?.total || 0} customers assigned this month.
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100dvh-150px)]">
          <div className="space-y-3 p-5">
            {customers.length === 0 ? (
              <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed bg-muted/15 p-6 text-center">
                <div>
                  <Users className="mx-auto h-9 w-9 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold">No new assigned customers</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Assigned customers will appear here.
                  </p>
                </div>
              </div>
            ) : (
              customers.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border bg-background p-4 shadow-sm transition hover:bg-muted/15"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Link
                      href={`/${base_route}/${item.member ? "member" : "customer"}/${item.id}`}
                      className="flex min-w-0 items-start gap-3"
                      target="_blank"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                        <Building2 className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block break-words text-base font-bold hover:underline">
                          {item.name || "Unnamed customer"}
                        </span>
                        <span className="mt-1 block break-words text-sm text-muted-foreground">
                          {item.owner || "No owner"}
                        </span>
                      </span>
                    </Link>

                    <Badge variant="outline" className="w-fit rounded-full bg-muted/20 px-2.5 py-1">
                      {item.member ? "Member" : "Customer"}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex min-w-0 items-center gap-2 rounded-xl border bg-muted/10 px-3 py-2">
                      <Phone className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="truncate">{formatNumber(item.number)}</span>
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-2 rounded-xl border bg-muted/10 px-3 py-2">
                      <MapPin className="h-4 w-4 shrink-0 text-amber-600" />
                      <span className="truncate">{item.location || "N/A"}</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
