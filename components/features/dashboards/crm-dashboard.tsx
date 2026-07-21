"use client";
import { ReimbursementAfterSales } from "@/components/features/aftersales/AfterSalesDashboardNew";
import { AfterSalesReimbursement } from "@/components/features/aftersales/aftersales-types";
import SalesTeamProgressChartCRM from "@/components/shared/charts/sales_progress/crm-sales-progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import formatCurrency from "@/lib/formatCurrency";
import { AdminTeamTasks, CRMCustomer, CRMDashboardData, CRMLoan, CRMTask, CRMTopFollowup, TeamTaskForAdmin } from "@/lib/types";
import { OfficeContext } from "@/store/context/OfficeContext";
import {
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Clock3,
  MessageSquareText,
  Phone,
  PhoneCall,
  Search,
  UserRound,
  UsersRound
} from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";

export default function CRMDashboard({ userID }: { userID: string | number }) {
  const [data, setData] = useState<CRMDashboardData>();
  const [loading, setLoading] = useState(false);
  const [userTaskData, setUserTaskData] = useState<AdminTeamTasks[]>([]);
  const { base_route } = useUserDetail()
  const debouncedUserId = useDebounce(userID, 1000);
  const { state: OfficeState } = useContext(OfficeContext)!
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [unassigned, setUnassigned] = useState(false)
  const [topOpen, setTopOpen] = useState(false)
  const [reimbursementApprovals, setReimbursementApprovals] = useState<AfterSalesReimbursement[]>([])
  const router = useRouter()

  useEffect(() => {
    if (debouncedUserId && OfficeState.value.data) {
      fetchData();
    }
  }, [debouncedUserId, OfficeState]);

  function fetchData() {
    setLoading(true)
    fetchDashboardData();
    fetchReimbursementApprovals()
  }

  async function fetchReimbursementApprovals() {

    const start = moment()
      .startOf("month")
      .startOf("day")
      .utc()
      .toISOString();
    const end = moment()
      .endOf("month")
      .endOf("day")
      .utc()
      .toISOString();
    try {
      const res = await axios.get(`/${userID}/reimbursementapproval?start_date=${start}&end_date=${end}`);
      setReimbursementApprovals(res.data);

    } finally {
    }
  }


  async function fetchDashboardData() {
    axios
      .get(`/${debouncedUserId}/dashboard?office=${OfficeState.value.data}`)
      .then((response) => {
        setData(response.data);
        if (response.data?.team_task) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);

          const todayEnd = new Date(today);
          todayEnd.setHours(23, 59, 59, 999);

          const splitTasksByDay = response.data.team_task.map((user: { tasks: CRMTask[] }) => {
            const yesterdayTasks = user.tasks.filter((task) => {
              const createdAt = new Date(task.created_at);
              return createdAt >= yesterday && createdAt < today;
            });

            const todayTasks = user.tasks.filter((task) => {
              const createdAt = new Date(task.created_at);
              return createdAt >= today && createdAt <= todayEnd;
            });

            return {
              ...user,
              yesterdayTasks,
              todayTasks,
            };
          });

          setUserTaskData(splitTasksByDay);
        }
      })
      .catch((e) => console.log(e))
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          Hi, Welcome back 👋
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardInfoCard
          title="Payment"
          icon={Banknote}
          iconClassName="bg-green-50 text-green-700"
          bottomClassName="border-b-green-500"
          loading={loading}
          items={[
            {
              label: "Due Delivery Payment",
              value: formatCurrency(data?.total_due_payment ?? 0),
              className: "text-green-700",
              onClick: () => router.push(`/${base_route}/delivery/due-payments`),
            },
            {
              label: "Due Parts Payment",
              value: formatCurrency(data?.pos_stats?.pending ?? 0),
              className: "text-red-600",

            },
          ]}
        />

        <DashboardInfoCard
          title="Unassigned Customers"
          icon={UsersRound}
          iconClassName="bg-purple-50 text-purple-700"
          bottomClassName="border-b-purple-500"
          loading={loading}
          items={[
            {
              label: "Total",
              value: data?.total_unassigned?.length ?? 0,
              className: "text-purple-700",
              onClick: () => setUnassigned(true),
            },
            {
              label: "With / Without Feedback This Month",
              value: `${data?.unassigned_customers?.with_feedback?.total ?? 0} / ${data?.unassigned_customers?.without_feedback?.total ?? 0
                }`,
              onClick: () => setFeedbackOpen(true),
              className: "text-muted-foreground",
            },
          ]}
        />

        <DashboardInfoCard
          title="Top Follow-up Customers"
          icon={PhoneCall}
          iconClassName="bg-red-50 text-red-700"
          bottomClassName="border-b-red-500"
          loading={loading}
          items={[
            {
              label: "Customers Need Urgent Follow-up",
              value: data?.top_followup?.total ?? 0,
              className: "text-red-600",
              onClick: () => setTopOpen(true),
            },
          ]}
        />

        <DashboardInfoCard
          title="Career"
          icon={BriefcaseBusiness}
          iconClassName="bg-blue-50 text-blue-700"
          bottomClassName="border-b-blue-500"
          loading={loading}
          items={[
            {
              label: "New Applicants",
              value: data?.resumes?.total ?? 0,
              className: "text-blue-700",
              onClick: () => router.push(`/${base_route}/careers`),
            },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        {loading ? (
          <Skeleton className="h-[380px]" />
        ) : (
          <SalesTeamProgressChartCRM passingData={data?.team_progress || []} />
        )}

        {loading ? (
          <Skeleton className="h-[380px]" />
        ) : (
          <LoansCard loans={data?.loans || []} />
        )}
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold">Task status</CardTitle>
                <CardDescription className="text-xs">
                  Yesterday and today task movement by team member
                </CardDescription>
              </div>
              <div className="rounded-md border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                {userTaskData.length} users
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3">
            <ScrollArea className="h-[420px] pr-2">
              {userTaskData.map((user) => (
                <div key={user.assigned_user_id} className="mb-3 rounded-md border bg-background p-2.5 last:mb-0">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h2 className="truncate text-sm font-bold">
                      {user.assigned_user_name}
                    </h2>
                    <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                      {(user.yesterdayTasks?.length || 0) + (user.todayTasks?.length || 0)} tasks
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {renderTaskCard(user.yesterdayTasks, "Yesterday")}
                    {renderTaskCard(user.todayTasks, "Today")}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      )}


      {reimbursementApprovals.length > 0 && <ReimbursementAfterSales userID={userID} data={reimbursementApprovals} onRefresh={fetchReimbursementApprovals} />}

      <FeedbackDialog
        open={feedbackOpen}
        data={[
          ...(data?.unassigned_customers?.with_feedback?.data ?? []),
          ...(data?.unassigned_customers?.without_feedback?.data ?? []),
        ]}
        onClose={() => setFeedbackOpen(false)}
      />


      <UnassignedDialog
        open={unassigned}
        data={[
          ...(data?.total_unassigned?.data ?? []),
        ]}
        onClose={() => setUnassigned(false)}
      />

      <TopDialog
        open={topOpen}
        data={[
          ...(data?.top_followup?.data ?? []),
        ]}
        onClose={() => setTopOpen(false)}
      />
    </div>
  );
}


const TopDialog = ({
  open,
  data = [],
  onClose,
}: {
  open: boolean;
  data: CRMTopFollowup[];
  onClose: () => void;
}) => {
  const { base_route } = useUserDetail()
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Top Follow-up Customers</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[80vh] pr-3">
          <div className="space-y-3">
            {data.length > 0 ? (
              data.map((item: any) => (
                <div
                  key={item.id}
                  className="rounded-lg border bg-card p-4 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link target="_blank" href={`/${base_route}/${item?.customer_member ? "member" : "customer"}/${item.customer_id}`} className="hover:underline">
                        <p className="font-semibold">
                          {item.customer_name || "No customer name"}
                        </p>
                      </Link>

                      <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                        <UserRound className="h-3.5 w-3.5" />
                        <span>{item.customer_owner || "No owner"}</span>
                      </div>
                    </div>


                  </div>

                  <div className="mt-3 rounded-md bg-muted/40 p-3">
                    <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <MessageSquareText className="h-3.5 w-3.5" />
                      Feedback
                    </div>
                    <p className="leading-relaxed">
                      {item.feedback || "No feedback added."}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      <span>
                        Next:{" "}
                        {item.next_followup
                          ? new Date(item.next_followup).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>

                    {Array.isArray(item.customer_phone) &&
                      item.customer_phone.map((phone: string) => (
                        <a
                          key={phone}
                          href={`tel:${phone}`}
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {phone}
                        </a>
                      ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No top follow-up customers found.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

const UnassignedDialog = ({
  open,
  data = [],
  onClose,
}: {
  open: boolean;
  data: CRMCustomer[];
  onClose: () => void;
}) => {
  const { base_route } = useUserDetail()
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Unassigned Customers</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[80vh] pr-3">
          <div className="space-y-3">
            {data.length > 0 ? (
              data.map((item: any) => (
                <div
                  key={item.id}
                  className="rounded-lg border bg-card p-4 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link target="_blank" href={`/${base_route}/${item?.member ? "member" : "customer"}/${item.id}`} className="hover:underline">
                        <p className="font-semibold">
                          {item.name || "No customer name"}
                        </p>
                      </Link>

                      <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                        <UserRound className="h-3.5 w-3.5" />
                        <span>{item.owner || "No owner"}</span>
                      </div>
                    </div>


                  </div>




                </div>
              ))
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No Unassigned customers found.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}


const FeedbackDialog = ({
  open,
  data = [],
  onClose,
}: {
  open: boolean;
  data: CRMCustomer[];
  onClose: () => void;
}) => {
  const withFeedback = data.filter(
    (item: any) => item.has_feedback_this_month === true
  );

  const withoutFeedback = data.filter(
    (item: any) => item.has_feedback_this_month === false
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Unassigned Customers</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <CustomerList
            title="With Feedback"
            count={withFeedback.length}
            data={withFeedback}
          />

          <CustomerList
            title="Without Feedback"
            count={withoutFeedback.length}
            data={withoutFeedback}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CustomerList = ({
  title,
  count,
  data,
}: {
  title: string;
  count: number;
  data: CRMCustomer[];
}) => {
  const { base_route } = useUserDetail()
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const pageSize = 10;
  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return data;
    }

    return data.filter((customer: any) => {
      const searchableValues = [
        customer.id,
        customer.name,
        customer.customer_name,
        customer.company,
        customer.company_name,
        customer.owner,
        customer.customer_owner,
        customer.phone,
        customer.mobile,
        customer.number,
        customer.numbers,
        customer.customer_phone,
        customer.customer_number,
      ];

      return searchableValues
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value) => value !== undefined && value !== null)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [data, search]);
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const startItem = filteredCustomers.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, filteredCustomers.length);
  const visibleCustomers = useMemo(
    () => filteredCustomers.slice((page - 1) * pageSize, page * pageSize),
    [filteredCustomers, page]
  );

  useEffect(() => {
    setPage(1);
  }, [data, search]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="rounded-lg border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {filteredCustomers.length > 0
              ? `Showing ${startItem}-${endItem} of ${filteredCustomers.length}`
              : "No records"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
            {filteredCustomers.length}/{count}
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              aria-label={`Previous ${title} page`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-12 text-center text-xs font-medium text-muted-foreground">
              {page}/{totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              aria-label={`Next ${title} page`}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="border-b p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="h-[70vh]">
        <div className="space-y-2 p-3">
          {visibleCustomers.length > 0 ? (
            visibleCustomers.map((customer: any) => (
              <div
                key={customer.id}
                className="rounded-lg border bg-card p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/${base_route}/${customer.member ? "member" : "customer"}/${customer.id}`} className="hover:underline" target="_blank">

                      <p className="font-semibold">
                        {customer.name || "No customer name"}
                      </p>
                    </Link>
                    <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                      <UserRound className="h-3.5 w-3.5" />
                      <span>{customer.owner || "No owner"}</span>
                    </div>
                  </div>

                  <Link href={`/${base_route}/${customer.member ? "member" : "customer"}/${customer.id}`} className="hover:underline" target="_blank">
                    <span className="text-xs text-muted-foreground">
                      #{customer.id}
                    </span>
                  </Link>
                </div>

                <div className="mt-3 space-y-1">
                  {Array.isArray(customer.number) &&
                    customer.number.length > 0 ? (
                    customer.number.map((num: string) => (
                      <a
                        key={num}
                        href={`tel:${num}`}
                        className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {num}
                      </a>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No number available
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No customers found.
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const renderTaskCard = (tasks: TeamTaskForAdmin[], label: string) => {
  const completedCount = tasks.filter((task) => task.status === "Completed").length;
  const pendingCount = tasks.length - completedCount;

  return (
    <Card className="w-full overflow-hidden rounded-md border-border/70 bg-card shadow-none">
      <CardHeader className="border-b bg-muted/25 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold leading-none text-foreground">{label}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {tasks.length} total tasks
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1 rounded-md border bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            {completedCount}
            <span className="text-border">/</span>
            <CircleDashed className="h-3 w-3 text-rose-500" />
            {pendingCount}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-2">
        {tasks.length === 0 ? (
          <div className="flex min-h-20 flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 px-3 py-4 text-center">
            <CircleDashed className="mb-1.5 h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-semibold text-foreground">No tasks</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Nothing assigned for this window.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {tasks.map((task) => {
              const completed = task.status === "Completed";

              return (
                <div
                  key={task.id}
                  className={`group rounded-md border px-2.5 py-2 text-xs transition hover:bg-muted/30 ${completed
                    ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                    : "border-rose-200 bg-rose-50/60 dark:border-rose-900/60 dark:bg-rose-950/20"
                    }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border bg-background ${completed
                        ? "border-emerald-200 text-emerald-700"
                        : "border-rose-200 text-rose-600"
                        }`}
                    >
                      {completed ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <CircleDashed className="h-3.5 w-3.5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-1 font-semibold leading-snug text-foreground">
                          {task.title || `Task #${task.id}`}
                        </p>
                        <span
                          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${completed
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                            }`}
                        >
                          {task.status || "Pending"}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock3 className="h-3 w-3" />
                        {moment(task.created_at).format("YYYY-MM-DD hh:mm A")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

function DashboardInfoCard({
  title,
  icon: Icon,
  iconClassName,
  bottomClassName,
  items,
  loading,
}: {
  title: string;
  icon: React.ElementType;
  iconClassName: string;
  bottomClassName: string;
  items: {
    label: string;
    value: string | number;
    className?: string;
    onClick?: () => void;
  }[];
  loading: boolean;
}) {
  return (
    <Card className={`overflow-hidden shadow-sm border-b-2 ${bottomClassName} p-0`}>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className={`rounded-lg p-2 ${iconClassName}`}>
            <Icon className="h-4 w-4" />
          </div>

          <p className="font-semibold">{title}</p>
        </div>

        <div className="space-y-3">
          {items.map((item: any) => (
            <div key={item.label}>
              <p className="text-xs text-muted-foreground">
                {item.label}
              </p>

              {loading ? (
                <Skeleton className="mt-1 h-5 w-20" />
              ) : item.onClick ? (
                <button
                  onClick={item.onClick}
                  className={`text-xl font-bold transition hover:opacity-70 cursor-pointer ${item.className}`}
                >
                  {item.value}
                </button>
              ) : (
                <p className={`text-xl font-bold ${item.className}`}>
                  {item.value}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LoansCard({ loans }: { loans: CRMLoan[] }) {
  const [activeTab, setActiveTab] = useState<"active" | "closed">("active");

  const activeLoans = loans.filter((loan) => loan.status === "active");
  const closedLoans = loans.filter((loan) => loan.status === "closed");

  const filteredLoans = activeTab === "active" ? activeLoans : closedLoans;
  const { base_route } = useUserDetail()
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Loans</CardTitle>
            <CardDescription>Employee loan overview</CardDescription>
          </div>

          <div className="flex rounded-lg bg-muted p-1">
            <Button
              size="sm"
              variant={activeTab === "active" ? "default" : "ghost"}
              onClick={() => setActiveTab("active")}
            >
              Active
            </Button>

            <Button
              size="sm"
              variant={activeTab === "closed" ? "default" : "ghost"}
              onClick={() => setActiveTab("closed")}
            >
              Closed
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <LoanStatus title="Active" value={activeLoans.length} />
          <LoanStatus title="Closed" value={closedLoans.length} />
        </div>

        <div className="space-y-1">
          {filteredLoans.slice(0, 5).map((loan) => (
            <div
              key={loan.id}
              className="flex items-center justify-between border-b py-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-muted text-xs font-semibold">
                  {getInitials(loan.user_name)}
                </div>

                <p className="font-medium">{loan.user_name}</p>
              </div>

              <p className="font-semibold text-red-600">
                {formatCurrency(loan.remaining_amount)}
              </p>
            </div>
          ))}

          {filteredLoans.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No {activeTab} loans found.
            </p>
          )}
        </div>

        <Link href={`/${base_route}/loans`}>
          <Button variant="outline" className="w-full">
            View All Loans
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function LoanStatus({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();
}
