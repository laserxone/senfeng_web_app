"use client";
import { AreaStats } from "@/components/charts/area_stats/page";
import { BarStats } from "@/components/charts/bar_stats/page";
import { Stats } from "@/components/charts/pie_stats/page";
import { Sale } from "@/components/charts/sales/page";
import SalesTeamProgressChart from "@/components/charts/sales_progress/page";
import CurrencyFormatter from "@/components/currency-formatter";
import { CustomerMapComponent } from "@/components/customerMapComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PakCities } from "@/constants/data";
import { useDebounce } from "@/hooks/use-debounce";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import formatCurrency from "@/lib/formatCurrency";
import { AdminDashboard, AdminDashboardCustomers, AdminTeamTasks, TeamTaskForAdmin } from "@/lib/types";
import { MapProvider } from "@/providers/map-provider";
import { OfficeContext } from "@/store/context/OfficeContext";
import { Banknote, CheckCircle2, ClipboardList, Clock3, MonitorCheck, UsersRound } from "lucide-react";
import moment from "moment";
import { useContext, useEffect, useState } from "react";
import { FaCashRegister } from "react-icons/fa";

export default function Page() {
  const [customers, setCustomers] = useState<AdminDashboardCustomers[]>([]);
  const [data, setData] = useState<AdminDashboard>();
  const [loading, setLoading] = useState(false);
  const [userTaskData, setUserTaskData] = useState<AdminTeamTasks[]>([]);
  const { userID } = useUserDetail()
  const debouncedUserId = useDebounce(userID, 1000);
  const { state: OfficeState } = useContext(OfficeContext)

  useEffect(() => {
    if (debouncedUserId && OfficeState.value.data) {
      fetchData();
    }
  }, [debouncedUserId, OfficeState]);

  function fetchData() {
    setLoading(true)
    fetchCustomerList();
    fetchDashboardData();
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

          const splitTasksByDay = response.data.team_task.map((user: { tasks: TeamTaskForAdmin[] }) => {
            const yesterdayTasks = user.tasks.filter((task: TeamTaskForAdmin) => {
              const createdAt = new Date(task.created_at);
              return createdAt >= yesterday && createdAt < today;
            });

            const todayTasks = user.tasks.filter((task: TeamTaskForAdmin) => {
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

  async function fetchCustomerList() {
    try {
      axios.get(`/${debouncedUserId}/customer?map=true&office=${OfficeState.value.data}`).then((response) => {
        const customerList = response.data;
        const newArray = mergeArrays(customerList, PakCities);

        setCustomers(newArray);
      });
    } catch (error) {
      console.log(error);
    }
  }

  function mergeArrays(array1: any[], array2: any[]) {
    return array1
      .map((obj1) => {
        const matchingCity = array2.find(
          (obj2) => obj2?.name === obj1?.location
        );

        if (matchingCity) {
          return {
            ...obj1,
            latitude: matchingCity.lat,
            longitude: matchingCity.lng,
          };
        } else {
          return null;
        }
      })
      .filter(Boolean);
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Hi, Welcome back 👋
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <MiniStatsCard
          title="Payments"
          value={formatCurrency(data?.total_payment_this_month ?? 0)}
          subtitle={`${data?.payment_change_percentage}% from last month`}
          loading={loading}
          icon={Banknote}
          className="bg-green-50 text-green-700"
        />

        <MiniStatsCard
          title="Machines Sold"
          value={formatCurrency(data?.total_machines_sold_this_month ?? 0)}
          subtitle={`${data?.machines_sold_change_percentage}% from last month`}
          loading={loading}
          icon={MonitorCheck}
          className="bg-blue-50 text-blue-700"
        />

        <MiniStatsCard
          title="New Customers"
           value={formatCurrency(data?.total_new_customers_this_month ?? 0)}
          subtitle={`${data?.new_customer_change_percentage}% from last month`}
          loading={loading}
          icon={UsersRound}
          className="bg-purple-50 text-purple-700"
        />

        <Card className="shadow-sm">
          <CardContent className="items-center gap-3">
            <div className="flex justify-between">
              <p className="truncate text-lg font-bold">
                Complaint Stats
              </p>
              <div className={`rounded-lg p-2 bg-orange-50 text-orange-700`}>
                <ClipboardList className="h-4 w-4 " />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center gap-1.5 text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="text-xs">Paid</span>
                  </div>

                  {loading ? (
                    <Skeleton className="mt-1 h-5 w-12" />
                  ) : (
                    <p className="mt-1 text-lg font-semibold text-green-700">
                      {formatCurrency(data?.complaint_stats?.total_paid)}
                     
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-red-700">
                    <Clock3 className="h-3.5 w-3.5" />
                    <span className="text-xs">Pending</span>
                  </div>

                  {loading ? (
                    <Skeleton className="mt-1 h-5 w-12" />
                  ) : (
                    <p className="mt-1 text-lg font-semibold text-red-700">
                      {formatCurrency(data?.complaint_stats?.total_pending)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


        <Card className="shadow-sm">
          <CardContent className="items-center gap-3">
            <div className="flex justify-between">
              <p className="truncate text-lg font-bold">
                POS Stats
              </p>
              <div className={`rounded-lg p-2 bg-yellow-50 text-yellow-700`}>
                <FaCashRegister className="h-4 w-4 " />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="grid grid-cols-2 gap-2">

                <div>
                  <div className="flex items-center gap-1.5 text-red-700">
                    <Clock3 className="h-3.5 w-3.5" />
                    <span className="text-xs">Pending</span>
                  </div>

                  {loading ? (
                    <Skeleton className="mt-1 h-5 w-12" />
                  ) : (
                    <p className="mt-1 text-lg font-semibold text-red-700">
                      {formatCurrency(data?.pos_stats?.pending)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <SalesTeamProgressChart passingData={data?.team_progress || []} />
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          {loading ? (
            <Skeleton className="h-64" />
          ) : (
            <BarStats data={data?.machines_sold_last_3_months || []} />
          )}
        </div>
        <div className="col-span-4 md:col-span-3">
          {loading ? (
            <Skeleton className="h-64" />
          ) : (
            <Sale data={data?.recent_sales || []} />
          )}
        </div>
        <div className="col-span-4">
          {loading ? (
            <Skeleton className="h-64" />
          ) : (
            <AreaStats data={data?.feedback_status_last_6_months || []} />
          )}
        </div>
        <div className="col-span-4 md:col-span-3">
          {loading ? (
            <Skeleton className="h-64" />
          ) : (
            <Stats industryData={data?.industry_count || []} />
          )}
        </div>
      </div>
      {loading ?
        <Skeleton className="h-64" />
        :

        <Card>
          <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
            <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
              <CardTitle>Task status</CardTitle>
              <Separator className="my-2" />
              <ScrollArea className="h-[500px] pr-3">
                {userTaskData.map((user) => (
                  <div key={user.assigned_user_id} className="mb-10">
                    <h2 className="text-xl font-bold mb-4">
                      {user.assigned_user_name}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderTaskCard(user.yesterdayTasks, "🕒 Yesterday")}
                      {renderTaskCard(user.todayTasks, "📅 Today")}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </CardHeader>
        </Card>
      }

      <div className="mb-5">
        {loading ? (
          <Skeleton className="h-96" />
        ) : (
          customers.length > 0 && (
            <MapProvider>
              <CustomerMapComponent data={customers} />
            </MapProvider>
          )
        )}
      </div>
    </div>
  );
}

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


function StatsCard({
  title,
  value,
  change,
  loading,
  icon: Icon,
  iconClassName,
}: {
  title: string;
  value: React.ReactNode;
  change: string;
  loading: boolean;
  icon: React.ElementType;
  iconClassName: string;
}) {
  return (
    <Card className="h-full shadow-sm">
      <CardContent className="flex h-full items-center gap-4 p-4">
        <div className={`rounded-xl p-2.5 ${iconClassName}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">
            {title}
          </p>

          {loading ? (
            <Skeleton className="mt-2 h-6 w-24" />
          ) : (
            <div className="mt-1 truncate text-xl font-bold">{value}</div>
          )}

          {loading ? (
            <Skeleton className="mt-2 h-3 w-28" />
          ) : (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {change}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStatsCard({
  title,
  value,
  subtitle,
  loading,
  icon: Icon,
  className,
}: {
  title: string;
  value: React.ReactNode;
  subtitle: string;
  loading: boolean;
  icon: React.ElementType;
  className: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="items-center gap-3">
        <div className="flex justify-between">
          <p className="truncate text-lg font-bold">
            {title}
          </p>
          <div className={`rounded-lg p-2 ${className}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {loading ? (
            <Skeleton className="mt-1 h-5 w-20" />
          ) : (
            <div className="mt-0.5 truncate text-lg font-semibold">
              {value}
            </div>
          )}

          {loading ? (
            <Skeleton className="mt-1 h-3 w-24" />
          ) : (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}