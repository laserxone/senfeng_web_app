"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  MessageSquareText,
  Phone,
  PhoneCall,
  UserRound,
  UsersRound
} from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import SalesTeamProgressChartCRM from "../charts/sales_progress/crm-sales-progress";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

export default function CRMDashboard() {
  const [data, setData] = useState<CRMDashboardData>();
  const [loading, setLoading] = useState(false);
  const [userTaskData, setUserTaskData] = useState<AdminTeamTasks[]>([]);
  const { userID, base_route } = useUserDetail()
  const debouncedUserId = useDebounce(userID, 1000);
  const { state: OfficeState } = useContext(OfficeContext)!
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [topOpen, setTopOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (debouncedUserId && OfficeState.value.data) {
      fetchData();
    }
  }, [debouncedUserId, OfficeState]);

  function fetchData() {
    setLoading(true)
    fetchDashboardData();
  }

  console.log(data)


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
              label: "Total This Month",
              value: data?.unassigned_customers?.total ?? 0,
              className: "text-purple-700",
              onClick: () => setFeedbackOpen(true),
            },
            {
              label: "With / Without Feedback",
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
        <Card>
          <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
            <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
              <CardTitle>Task status</CardTitle>
              <Separator className="my-2" />

              <ScrollArea className="h-[500px] pr-3">
                {userTaskData.map((user) => (
                  <div key={user.assigned_user_id} className="mb-10">
                    <h2 className="mb-4 text-xl font-bold">
                      {user.assigned_user_name}
                    </h2>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {renderTaskCard(user.yesterdayTasks, "🕒 Yesterday")}
                      {renderTaskCard(user.todayTasks, "📅 Today")}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </CardHeader>
        </Card>
      )}

      <FeedbackDialog
        open={feedbackOpen}
        data={[
          ...(data?.unassigned_customers?.with_feedback?.data ?? []),
          ...(data?.unassigned_customers?.without_feedback?.data ?? []),
        ]}
        onClose={() => setFeedbackOpen(false)}
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
  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">{title}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {count}
        </span>
      </div>

      <ScrollArea className="h-[70vh]">
        <div className="space-y-2 p-3">
          {data.length > 0 ? (
            data.map((customer: any) => (
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

const renderTaskCard = (tasks: TeamTaskForAdmin[], label: string) => (
  <Card className="w-full">
    <CardHeader className="text-base font-semibold">{label}</CardHeader>
    <CardContent className="space-y-2">
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks</p>
      ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            className={`p-3 rounded text-sm border border-muted-foreground/10 ${task.status === "Completed" ? "bg-green-200" : "bg-red-200"
              }`}
          >
            <p className="font-medium text-black">
              {task.title || `Task #${task.id}`}{" "}
            </p>

            <p className="text-xs text-muted-foreground">
              {moment(task.created_at).format("YYYY-MM-DD hh:mm A")}
            </p>
          </div>
        ))
      )}
    </CardContent>
  </Card>
);

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