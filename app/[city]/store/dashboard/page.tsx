"use client";

import AddTaskDialog from '@/components/add-task-dialog';
import PageTable from '@/components/app-table';
import CurrencyFormatter from "@/components/currency-formatter";
import { MyImgZooming } from '@/components/img-zooming';
import EngineerModal from '@/components/pos/engineer-modal';
import GatePassSlip from '@/components/pos/gatepass-slip';
import NotificationBadge from "@/components/pos/NotificationBadge";
import { OrderDonutChart } from '@/components/pos/order-donut-chart';
import SearchResultModal from "@/components/pos/search-result-modal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import Spinner from '@/components/ui/spinner';
import { AddExpensesDialog } from '@/components/users/employee-expense';
import TaskDetail from "@/components/users/task-detail";
import { useMachineDelivery } from '@/hooks/use-machine-delivery';
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { StoreAvailableStock, StoreDashboardResponse, StoreLowStockData, StorePosStatsEach, StoreStockGroup, StoreStockItem, TaskProps } from "@/lib/types";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  ArrowUpDown,
  BadgeCheck,
  Bell,
  CircleDashed,
  CreditCard,
  DollarSign,
  Eye,
  FileText,
  Grid2X2,
  List,
  ListCheck,
  Package,
  ShoppingCart,
  Sun,
  Truck,
  Users,
  Wrench
} from "lucide-react";
import moment from "moment";
import { useRouter } from 'nextjs-toploader/app';
import { useEffect, useState } from "react";



export default function StoreManagerDashboard() {

  const { userID, base_route } = useUserDetail()
  const [data, setData] = useState<StoreDashboardResponse | null>(null)
  const [selectedMachines, setSelectedMachines] = useState<StoreStockItem[]>([])
  const [selectedTask, setSelectedTask] = useState<TaskProps | null>(null);
  const [engineerLoading, setEngineerLoading] = useState(false);
  const [allEngineersData, setAllEngineersData] = useState([]);
  const [engineersModal, setEngineersModal] = useState(false);
  const [expense, setExpense] = useState(false)
  const [gatePass, setGatePass] = useState(false)
  const [lowStock, setLowStock] = useState(false)
  const [selectedData, setSelectedData] = useState<StorePosStatsEach | null>(null)
  const router = useRouter()
  const { pendingDelivery } = useMachineDelivery()

  useEffect(() => {
    if (userID) {
      fetchData()
    }
  }, [userID])

  async function fetchData() {
    axios.get(`/${userID}/dashboard`).then((response) => {
      setData(response.data);
    });
  }

  async function handleEngineerItems() {
    try {
      setEngineerLoading(true);
      const response = await axios.get(`/${userID}/pos/engineer`);

      setAllEngineersData(response.data);
      setEngineersModal(true);
      return true;
    } finally {
      setEngineerLoading(false);
    }
  }

  const quickActions = [
    {
      title: "Machine Delivery",
      icon: Truck,
      color: "text-blue-600",
      onClick: () => { router.push(`/${base_route}/delivery/machinedelivery`) },
      count: pendingDelivery
    },
    {
      title: "Parts Delivery",
      icon: Package,
      color: "text-orange-500",
      onClick: () => { },
    },
    {
      title: "POS",
      icon: CreditCard,
      color: "text-green-600",
      onClick: () => { router.push(`/${base_route}/pos`) },
    },
    {
      title: "Pending Payments",
      icon: CreditCard,
      color: "text-red-600",
      count: data?.pos_stats?.pending?.length || 0,
      onClick: () => { setSelectedData(data?.pos_stats?.pending || null) },
    },
    {
      title: "Issued Items to Engineer",
      icon: Wrench,
      color: "text-purple-600",
      onClick: () => { handleEngineerItems() },
      loading: engineerLoading
    },
    {
      title: "Add Expenses",
      icon: DollarSign,
      color: "text-green-600",
      showExpenses: true,
      onClick: () => { setExpense(true) },
    },
    {
      title: "Add Parts to Cart",
      subtitle: "New Order",
      icon: ShoppingCart,
      color: "text-purple-600",
      onClick: () => { },
    },
    {
      title: "Returnable Gatepass",
      icon: FileText,
      color: "text-cyan-600",
      onClick: () => { setGatePass(true) },
    },
    {
      title: "Customers",
      icon: Users,
      color: "text-orange-500",
      onClick: () => { },
    },
    {
      title: "Suppliers",
      icon: Truck,
      color: "text-purple-600",
      onClick: () => { },
    },
    {
      title: "Stock Alert",
      icon: Bell,
      color: "text-red-600",
      onClick: () => { },
    },
    {
      title: "Low Stock Items",
      icon: AlertTriangle,
      color: "text-orange-500",
      count: data?.low_stock?.total || 0,
      onClick: () => { setLowStock(true) },
    },
    {
      title: "Purchase Order",
      icon: ShoppingCart,
      color: "text-green-600",
      onClick: () => { },
    },
  ];



  const machineColumns: ColumnDef<StoreStockGroup>[] = [
    {
      accessorKey: "machine_model",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Model
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div className="ml-2">{row.getValue("machine_model")}</div>,
    },
    {
      accessorKey: "machine_power",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Power
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("machine_power")}</div>,
    },

    {
      accessorKey: "quantity",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Quantity
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("quantity")}</div>,
    },

    {
      id: "actions",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
          >
            Action
          </Button>
        );
      },
      cell: ({ row }) => {
        const currentItem = row.original;

        return (
          <Button
            size={"sm"}
            variant={"outline"}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMachines(row.original.data)
            }}
          >
            View
          </Button>
        );
      },
    },
  ];

  const taskColumns: ColumnDef<TaskProps>[] = [
    {
      accessorKey: "status",
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
      cell: ({ row }) => (
        <div className="flex ml-2 gap-1 items-center">
          <div>
            {row.getValue("status") === "Completed" ? (
              <BadgeCheck color="green" size={"15px"} />
            ) : (
              <CircleDashed color="red" size={"15px"} />
            )}
          </div>
          <div>{row.getValue("status")}</div>
        </div>
      ),
    },
    {
      accessorKey: "task_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Task Name
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("task_name")}</div>,
    },

    {
      accessorKey: "created_at_time",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Assign Time
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div>
          {new Date(row.getValue("created_at_time")).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      ),
    },

    {
      accessorKey: "created_at",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Assign Date
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div>
          {moment(new Date(row.getValue("created_at"))).format("YYYY-MM-DD")}
        </div>
      ),
    },
  ];

  function getAllStoreStockItems(
    availableStock: StoreAvailableStock | null
  ): StoreStockItem[] {
    if (!availableStock) return []
    return availableStock.groups.flatMap((group) => group.data);
  }

  const ordersOverview = [
    {
      label: "Completed",
      count: data?.pos_stats?.completed?.length || 0,
      onClick: () => setSelectedData(data?.pos_stats?.completed || null)
    },
    {
      label: "Pending",
      count: data?.pos_stats?.pending?.length || 0,
      onClick: () => setSelectedData(data?.pos_stats?.pending || null)
    },
    {
      label: "Partial",
      count: data?.pos_stats?.partial?.length || 0,
      onClick: () => setSelectedData(data?.pos_stats?.partial || null)
    },
    {
      label: "Cancelled",
      count: data?.pos_stats?.cancelled?.length || 0,
      onClick: () => setSelectedData(data?.pos_stats?.cancelled || null)
    },

  ]

  return (

    <div className="flex flex-1 pb-2">
      <div className="flex flex-1 flex-col gap-3">

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-7">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                onClick={action.onClick}
                key={action.title}
                className={`cursor-pointer
                   relative rounded-lg border bg-card p-3 text-center shadow-sm ring-1 ring-border/30 transition hover:-translate-y-0.5 hover:shadow-md ${action.showExpenses ? "col-span-2 lg:col-span-2" : ""
                  }`}
              >
                {Number(action.count || 0) > 0 && (
                  <div className="absolute right-1.5 top-1.5 z-10">
                    <NotificationBadge count={action.count || 0} />
                  </div>
                )}

                {action.showExpenses ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-center">

                    <div className="flex flex-col items-center">
                      <Icon size={22} className={action.color} />
                      <p className="mt-2 text-xs font-semibold">
                        {action.title}
                      </p>
                    </div>

                    <div className="border-t pt-2 text-left sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                      <p className="text-xs font-medium text-slate-500">
                        Today&apos;s Expenses
                      </p>
                      <p className="mt-1 text-sm font-bold text-green-600">
                        <CurrencyFormatter amount={data?.branch_expenses?.today_total || 0} />
                      </p>
                    </div>

                    <div className="border-t pt-2 text-left sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                      <p className="text-xs font-medium text-slate-500">
                        This Month
                      </p>
                      <p className="mt-1 text-sm font-bold text-green-600">
                        <CurrencyFormatter amount={data?.branch_expenses?.this_month_total || 0} />
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {action.loading ? <Spinner className={`mx-auto ${action.color}`} /> :
                      <Icon size={22} className={`mx-auto ${action.color}`} />}
                    <p className="mt-2 text-xs font-semibold leading-4">
                      {action.title}
                    </p>
                    {action.subtitle ? (
                      <p className="text-xs font-medium text-slate-600">
                        {action.subtitle}
                      </p>
                    ) : null}
                  </>
                )}
              </button>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-2 lg:grid-cols-10">
          <div className="rounded-md border bg-card px-2 py-2 ring-1 ring-border/30 lg:col-span-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold leading-none">Today&apos;s Sale</p>
                <p className="mt-1 text-xs text-muted-foreground">Revenue</p>
              </div>
              <span className="rounded-md bg-emerald-500/10 px-4 text-emerald-600 font-bold">
                <CurrencyFormatter amount={data?.sales_stats?.today || 0} />
              </span>
            </div>
            <h3 className="mt-1 text-md font-bold leading-none"></h3>

            <div className=''>
              <p className="text-sm font-bold leading-none mt-2">Sales Summary</p>

              <div className="mt-2 space-y-2 grid grid-cols-3">
                <div className="rounded-md bg-muted/35 px-2 py-1.5">
                  <p className="text-xs text-muted-foreground">This Week</p>
                  <p className="text-xs font-bold leading-tight"><CurrencyFormatter amount={data?.sales_stats?.this_week || 0} /></p>
                </div>

                <div className="rounded-md bg-muted/35 px-2 py-1.5">
                  <p className="text-xs text-muted-foreground">This Month</p>
                  <p className="text-xs font-bold leading-tight"><CurrencyFormatter amount={data?.sales_stats?.this_month || 0} /></p>
                </div>

                <div className="rounded-md bg-muted/35 px-2 py-1.5">
                  <p className="text-xs text-muted-foreground">Last Month</p>
                  <p className="text-xs font-bold leading-tight"><CurrencyFormatter amount={data?.sales_stats?.last_month || 0} /></p>
                </div>
              </div>
            </div>

          </div>

          <div className="rounded-md border bg-card p-3 ring-1 ring-border/30 lg:col-span-3">
            <p className="text-sm font-bold leading-none">Orders Overview</p>

            <div className="mt-3 grid grid-cols-[76px_1fr] items-center gap-3">
              {/* <div className="mx-auto h-16 w-16 rounded-full border-[11px] border-green-500 border-b-amber-400 border-l-blue-500 border-t-red-500" /> */}
              <div className="h-[82px] w-[82px] shrink-0">
                <OrderDonutChart data={ordersOverview.map((item) => {
                  return { status: item.label, total: item.count }
                })} />
              </div>

              <div className="space-y-1 text-xs">
                {ordersOverview.map((item) => (
                  <p key={item.label} className="flex justify-between">
                    <span>{item.label}</span>

                    <b className='hover:underline cursor-pointer' onClick={item.onClick}>{item.count}</b>
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-card p-3 ring-1 ring-border/30 lg:col-span-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold leading-none">Pending Payments</p>
                <p className="mt-1 text-xs text-muted-foreground">Total Payables</p>
              </div>
              <Button onClick={() => setSelectedData(data?.pos_stats?.pending || null)} size="sm">
                <Eye /> View All
              </Button>
            </div>
            <h3 className="mt-3 text-xl font-bold leading-none text-red-600">
              <CurrencyFormatter amount={data?.pos_stats?.pending?.total || 0} />
            </h3>


          </div>
        </section>

        <section className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          <div className="rounded-md border bg-card p-2.5 ring-1 ring-border/30">
            <div className="mb-2 flex items-center justify-between">
              <div className='flex items-center gap-2'>  <Sun className='h-4 w-4 text-yellow-400' /> <h3 className="text-sm font-bold leading-none">Plan your day </h3></div>
              <AddTaskDialog
                onRefresh={fetchData}
                user_id={userID}
                placeholder="Add Plan"
              />
            </div>

            <PageTable
              disableInput={true}
              height="min-h-[190px]"
              columns={taskColumns}
              data={data?.today_tasks?.data || []}
              onRowClick={(val, e) => {
                setSelectedTask(val);
              }}
            />

          </div>

          <div className="rounded-md border bg-card p-2.5 ring-1 ring-border/30">
            <div className="mb-2 flex items-center justify-between">
              <div className='flex gap-2 items-center'>
                <ListCheck className='h-4 w-4 text-blue-500' />
                <h3 className="text-sm font-bold leading-none">Machines List</h3>
              </div>
              <Button size="sm" onClick={() => setSelectedMachines(getAllStoreStockItems(data?.available_stock || null))}>
                <Eye />  View All
              </Button>
            </div>


            <PageTable
              height="min-h-[210px]"
              disableInput={true}
              data={data?.available_stock?.groups?.slice(0, 5) || []}
              columns={machineColumns} />
          </div>
        </section>
      </div>

      <SearchResultModal
        total={selectedData?.total || 0}
        showSelect={false}
        data={selectedData?.data || []}
        onClose={() => setSelectedData(null)}
        onselect={() => { }}
        visible={!!selectedData} />

      <ShowMachines visible={selectedMachines.length > 0} onClose={() => setSelectedMachines([])} data={selectedMachines} />

      <TaskDetail
        user_id={userID}
        detail={selectedTask}
        visible={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onMark={async () => await fetchData()}
      />



      <EngineerModal
        allEngineersData={allEngineersData}
        engineersModal={engineersModal}
        setEngineersModal={setEngineersModal}
        onRefresh={async () => {
          await handleEngineerItems();
          fetchData();
        }}
      />

      <AddExpensesDialog
        visible={expense}
        onClose={setExpense}
        user_id={userID}
        onRefresh={async () => {
          await fetchData()
        }
        }
      />

      <LowStockModal visible={lowStock} onClose={() => setLowStock(false)} data={data?.low_stock?.data} />

      <Dialog onOpenChange={setGatePass} open={gatePass}>
        <DialogContent className='w-full sm:max-w-4xl'>
          <VisuallyHidden>
            <DialogHeader>
              <DialogTitle>Gate Pass</DialogTitle>
            </DialogHeader>
          </VisuallyHidden>
          <ScrollArea className='h-[95dvh]'>

            <GatePassSlip />

          </ScrollArea>
        </DialogContent>
      </Dialog>

    </div>


  );
}

const LowStockModal = ({ visible, onClose, data }: { visible: boolean, onClose: () => void, data?: StoreLowStockData[] }) => {
  const [view, setView] = useState<"list" | "cards">("list")
  const items = data || []

  return (
    <Dialog onOpenChange={onClose} open={visible}>
      <DialogContent className='max-h-[92vh] w-full overflow-hidden rounded-md p-0 sm:max-w-5xl'>
        <DialogHeader className="border-b bg-muted/30 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Low Stock Items
              </DialogTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {items.length} item{items.length === 1 ? "" : "s"} below threshold
              </p>
            </div>

            <div className="flex w-fit rounded-md border bg-background p-1">
              <Button
                type="button"
                size="sm"
                variant={view === "list" ? "default" : "ghost"}
                className="h-7 rounded-md px-2 text-xs"
                onClick={() => setView("list")}
              >
                <List className="h-3.5 w-3.5" />
                List
              </Button>
              <Button
                type="button"
                size="sm"
                variant={view === "cards" ? "default" : "ghost"}
                className="h-7 rounded-md px-2 text-xs"
                onClick={() => setView("cards")}
              >
                <Grid2X2 className="h-3.5 w-3.5" />
                Cards
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className='h-[76vh]'>
          <div className="p-3">
            {items.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-orange-500/10 text-orange-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-bold">No low stock items</p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Items below threshold will appear here when stock needs attention.
                </p>
              </div>
            ) : view === "list" ? (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[680px] text-xs">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold">Name</th>
                      <th className="px-3 py-2 text-right font-bold">In Stock Qty</th>
                      <th className="px-3 py-2 text-right font-bold">Price</th>
                      <th className="px-3 py-2 text-right font-bold">Threshold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b last:border-b-0 odd:bg-muted/20 hover:bg-muted/40">
                        <td className="px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{item.name || "-"}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{item.category || item.type || "-"}</p>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-orange-600">{item.qty}</td>
                        <td className="px-3 py-2 text-right font-semibold">{item.price || "-"}</td>
                        <td className="px-3 py-2 text-right font-semibold">{item.threshold ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-md border bg-card ring-1 ring-border/30">
                    <div className="relative h-28 bg-muted">
                      {item.img ? (
                        <MyImgZooming img={`products/${item.img}`} fill={true} />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <Package className="h-8 w-8" />
                        </div>
                      )}
                      <span className="absolute right-2 top-2 rounded-md bg-orange-500 px-2 py-1 text-[11px] font-bold text-white">
                        Low stock
                      </span>
                    </div>

                    <div className="p-3">
                      <p className="line-clamp-1 text-sm font-bold">{item.name || "-"}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.category || item.type || "-"}</p>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <LowStockMetric label="In Stock" value={String(item.qty)} tone="orange" />
                        <LowStockMetric label="Price" value={String(item.price || "-")} />
                        <LowStockMetric label="Threshold" value={String(item.threshold ?? "-")} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

const LowStockMetric = ({ label, value, tone = "default" }: { label: string, value: string, tone?: "default" | "orange" }) => {
  return (
    <div className="rounded-md border bg-muted/20 px-2 py-1.5">
      <p className="text-[10px] uppercase leading-none text-muted-foreground">{label}</p>
      <p className={`mt-1 truncate text-sm font-bold leading-none ${tone === "orange" ? "text-orange-600" : ""}`}>
        {value}
      </p>
    </div>
  )
}

const ShowMachines = ({ visible, data, onClose }: { visible: boolean, data: StoreStockItem[], onClose: () => void }) => {

  const columns: ColumnDef<StoreStockItem>[] = [
    {
      accessorKey: "machine_serial",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Serial
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div className="ml-2">{row.getValue("machine_serial")}</div>,
    },
    {
      accessorKey: "machine_model",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Model
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div className="ml-2">{row.getValue("machine_model")}</div>,
    },
    {
      accessorKey: "machine_power",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Power
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("machine_power")}</div>,
    },
  ];

  return (
    <Dialog open={visible} onOpenChange={() => onClose()}>
      <DialogContent className="w-full sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Machines
          </DialogTitle>
        </DialogHeader>

        <PageTable
          data={data}
          columns={columns}
        />

      </DialogContent>
    </Dialog>
  )
}


