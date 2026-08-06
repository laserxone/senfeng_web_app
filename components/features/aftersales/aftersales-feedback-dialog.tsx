import PageTable from "@/components/shared/tables/app-table";
import AddCustomerDialog from "@/components/features/customers/components/add-customer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { MyCustomerResolved } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Filter,
  Frown,
  PhoneCall,
  Smile,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { useEffect, useState } from "react";
import AddFeedbackDialog from "@/components/features/customer-relations/add-feedback";
import FilterSheet from "@/components/features/users/filter-sheet";
import OldRecordSheet from "@/components/features/employee-finance/old-record-sheet";
import {
  CustomerEmployeeAfterSalesProps,
  DashboardData,
  DataKeys,
  WithFeedbackProps,
} from "./aftersales-types";

export default function FeedbackDialog({
  open,
  onOpenChange,
  title,
  description,
  data,
  onRefresh,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  data: DashboardData;
  onRefresh: () => Promise<void>;
}) {
  const [filterData, setFilterData] = useState<DashboardData | null>(null);
  const { userID } = useUserDetail();
  const [selectedOption, setSelectedOption] =
    useState<string>("withoutFeedback");
  const [filter, setFilter] = useState<{ start: any; end: any }>({
    start: null,
    end: null,
  });

  useEffect(() => {
    if (filter.start) {
      const temp: any = {};
      const startDate = moment(new Date(filter.start));
      const endDate = moment(new Date(filter.end));

      temp.withoutFeedback = [...(data?.withoutFeedback || [])];
      temp.withFeedback = [...(data?.withFeedback || [])].filter(
        (item: WithFeedbackProps) => {
          const feedbackDate = moment(new Date(item.feedback_date));
          return (
            feedbackDate.isSameOrAfter(startDate) &&
            feedbackDate.isSameOrBefore(endDate)
          );
        },
      );

      setFilterData(temp);
    } else {
      setFilterData(data);
    }
  }, [filter, data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[calc(100dvh-160px)]">
          <CustomerEmployeeAfterSales
            data={filterData ? filterData : data}
            user_id={userID}
            onRefresh={onRefresh}
            onFilterData={(start, end) => {
              setFilter({ start: moment(start), end: moment(end) });
            }}
            handleClear={async () => setFilter({ start: null, end: null })}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

const CustomerEmployeeAfterSales = ({
  onRefresh,
  user_id,
  data,
  onFilterData,
  handleClear,
  selectedOption,
  setSelectedOption,
}: CustomerEmployeeAfterSalesProps) => {
  const { base_route, customer_add_access, designation, route_branch } =
    useUserDetail();
  const [addCustomer, setAddCustomer] = useState(false);
  const router = useRouter();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<
    WithFeedbackProps | MyCustomerResolved | null
  >(null);
  const [selectedCustomer, setSelectedCustomer] = useState<
    WithFeedbackProps | MyCustomerResolved | null
  >(null);
  const [next, setNext] = useState<Date | undefined>(undefined);
  const [top, setTop] = useState(false);
  const [satisfactory, setSatisfactory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [oldRecordVisible, setOldRecordVisible] = useState(false);

  const columns: ColumnDef<WithFeedbackProps | MyCustomerResolved>[] = [
    {
      accessorKey: "owner",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Owner
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <Link
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="hover:underline"
          target="_blank"
          href={`/${base_route}/${row.original.member ? "member" : "customer"}/${row.original.id}`}
        >
          <div className="ml-2">{row.getValue("owner")}</div>
        </Link>
      ),
    },
    {
      accessorKey: "name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Company
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <Link
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="hover:underline"
          target="_blank"
          href={`/${base_route}/${row.original.member ? "member" : "customer"}/${row.original.id}`}
        >
          <div>{row.getValue("name")}</div>
        </Link>
      ),
    },

    {
      accessorKey: "number",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Number
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("number")}</div>,
    },

    {
      accessorKey: "location",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Location
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("location")}</div>,
    },

    {
      accessorKey: "feedback_date",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Feedback
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div>
          {row.getValue("feedback_date")
            ? moment(new Date(row.getValue("feedback_date"))).format(
                "YYYY-MM-DD",
              )
            : "Not taken"}
        </div>
      ),
    },

    {
      accessorKey: "user_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Taken By
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("user_name") || "-"}</div>,
    },

    {
      id: "actions",
      cell: ({ row }) => {
        const currentItem = row.original;

        return (
          <Button
            size={"sm"}
            variant={"outline"}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCustomer(currentItem);
              setShowFeedback(true);
            }}
          >
            <PhoneCall /> Feedback
          </Button>
        );
      },
    },
  ];

  async function handleSaveFeedback() {
    setLoading(true);
    axios
      .post(`/${user_id}/feedback`, {
        feedback: feedback,
        type: "aftersales",
        customer_id: selectedCustomer?.id,
        user_id: user_id,
        status: satisfactory ? "Satisfactory" : "Unsatisfactory",
        next_followup: next,
        top_follow: top,
      })
      .then(async () => {
        await onRefresh();
      })
      .finally(() => {
        setLoading(false);
        setShowFeedback(false);
      });
  }

  return (
    <div className="relative flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-5">
      <div className="w-full shrink-0 lg:sticky lg:top-4 lg:z-10 lg:h-fit lg:w-[280px] lg:self-start">
        <CustomerExtraData
          data={{
            withFeedback: data?.withFeedback || [],
            withoutFeedback: data?.withoutFeedback || [],
          }}
          option={selectedOption}
          onSelect={(val) => {
            setSelectedOption(val);
          }}
        />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <PageTable
          columns={columns}
          data={data?.[selectedOption as DataKeys] || []}
          onRowClick={(val) => {
            setSelectedDetail(val);
          }}
          filter
          onFilterPress={() => setFilterVisible(true)}
          reset
          onResetPress={handleClear}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            {customer_add_access && (
              <Button onClick={() => setAddCustomer(true)}>Add Customer</Button>
            )}

            <Button
              variant={"outline"}
              onClick={() => setOldRecordVisible(true)}
            >
              Open Record
            </Button>
          </div>
        </PageTable>
      </div>

      <AddCustomerDialog
        user_designation={designation}
        office={route_branch}
        user_id={user_id}
        ownership={true}
        visible={addCustomer}
        onClose={setAddCustomer}
        onRefresh={async () => {
          await onRefresh();
        }}
      />

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          onFilterData(val.start, val.end);
        }}
      />

      <OldRecordSheet
        visible={oldRecordVisible}
        onClose={setOldRecordVisible}
        user_id={user_id}
      />

      <AddFeedbackDialog
        customer_id={selectedCustomer?.id}
        onClose={() => {
          setSelectedCustomer(null);
          setShowFeedback(false);
        }}
        onRefresh={onRefresh}
        open={showFeedback}
        user_id={user_id}
      />

      <FeedbackDetailDialog
        item={selectedDetail}
        open={!!selectedDetail}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setSelectedDetail(null);
        }}
      />
    </div>
  );
};

const CustomerExtraData = ({
  data,
  option,
  onSelect,
}: {
  data: {
    withFeedback: WithFeedbackProps[];
    withoutFeedback: MyCustomerResolved[];
  };
  option: string;
  onSelect: (a: string) => void;
}) => {
  const menuItems = [
    {
      key: "pending",
      label: "Pending",
      dataKey: "withoutFeedback",
      icon: <TrendingDown className="h-4 w-4" />,
    },
    {
      key: "completed",
      label: "Completed",
      dataKey: "withFeedback",
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ];

  return (
    <div className="rounded-md border border-border bg-card p-2 text-card-foreground shadow-sm">
      <div className="mb-2 rounded-md border border-border bg-muted/50 px-3 py-2">
        <h2 className="text-sm font-bold tracking-tight text-foreground">
          Customer Group
        </h2>
        <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
          Filter customer records
        </p>
      </div>

      <div className="flex w-full gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {menuItems.map(({ key, label, dataKey, icon }) => {
          const count = data?.[dataKey as keyof typeof data]?.length ?? 0;
          const isActive = option === dataKey;

          return (
            <button
              type="button"
              onClick={() => onSelect(dataKey)}
              key={key}
              className={`group flex min-w-[145px] shrink-0 items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left transition-all duration-200 lg:w-full lg:min-w-0 ${
                isActive
                  ? "border border-blue-200 bg-blue-50 text-blue-800 shadow-sm dark:border-blue-800/70 dark:bg-blue-950/50 dark:text-blue-100"
                  : "border border-transparent bg-muted/50 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
              } `}
            >
              <div className="flex items-center gap-2 text-xs">
                {icon}
                <span className="truncate text-xs font-semibold sm:text-sm">
                  {label}
                </span>
              </div>

              {count > 0 && (
                <Badge
                  variant="secondary"
                  className={`h-5 rounded-full px-2 text-[10px] font-bold shadow-none ${
                    isActive
                      ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-white"
                      : "bg-background text-foreground ring-1 ring-border"
                  } `}
                >
                  {count > 999 ? "999+" : count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

function FeedbackDetailDialog({
  item,
  open,
  onOpenChange,
}: {
  item: WithFeedbackProps | MyCustomerResolved | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const feedbackStatus =
    item && "feedback_status" in item ? item.feedback_status : undefined;
  const isSatisfactory = feedbackStatus === "Satisfactory";
  const statusLabel = feedbackStatus || "No feedback";
  const detailRows = item ? Object.entries(item) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Feedback Detail</DialogTitle>
          <DialogDescription>
            Complete selected customer feedback record.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-160px)]">
          {item ? (
            <div className="space-y-4">
              <div
                className={`rounded-2xl border p-4 ${isSatisfactory ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30" : "border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-12 items-center justify-center rounded-full ${isSatisfactory ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}
                  >
                    {isSatisfactory ? (
                      <Smile className="size-6" />
                    ) : (
                      <Frown className="size-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold ${isSatisfactory ? "text-emerald-900 dark:text-emerald-200" : "text-rose-900 dark:text-rose-200"}`}
                    >
                      {isSatisfactory
                        ? "Satisfactory Feedback"
                        : "Unsatisfactory Feedback"}
                    </p>
                    <p
                      className={`text-xs ${isSatisfactory ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}
                    >
                      Current status: {statusLabel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {detailRows.map(
                  ([key, value]) =>
                    key !== "id" &&
                    key !== "created_at" && (
                      <div
                        key={key}
                        className="rounded-xl border border-border bg-muted/40 p-3"
                      >
                        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                          {formatDetailLabel(key)}
                        </p>
                        <p className="mt-1 text-sm font-medium break-words text-foreground">
                          {formatDetailValue(value, key)}
                        </p>
                      </div>
                    ),
                )}
              </div>
            </div>
          ) : (
            <EmptyState label="No feedback item selected." />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function formatDetailValue(value: unknown, key: string) {
  if (key === "created_at" || key === "feedback_date")
    return value ? moment(value).format("YYYY-MM-DD") : "-";
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function formatDetailLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
