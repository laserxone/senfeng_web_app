"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import useUserDetail from "@/hooks/use-user-detail"
import {
  CRMTeamProgress,
  CRMTeamProgressDataCustomer,
  CRMTeamProgressDataSale,
} from "@/lib/types"
import { useEffect, useState } from "react"
import Link from "next/link"

const chartConfig = {
  customers_assigned: {
    label: "Assigned Customers",
    color: "var(--chart-1)",
  },
  sale_produced_customers: {
    label: "Conversions",
    color: "var(--chart-2)",
  },
  repeated_customers: {
    label: "Repeated Customers",
    color: "var(--chart-3)",
  },
}

type ProgressMetric =
  | "customers_assigned"
  | "sale_produced_customers"
  | "repeated_customers"

type ChartRow = Omit<
  CRMTeamProgress,
  | "name"
  | "customers_assigned"
  | "sale_produced_customers"
  | "repeated_customers"
  | "customer_to_member_conversion"
> & {
  full_name: string
  name: string
  customers_assigned: number
  sale_produced_customers: number
  repeated_customers: number
  customer_to_member_conversion: number
}

type SelectedProgressDetail = {
  metric: ProgressMetric
  member: ChartRow
}

const metricLabels: Record<ProgressMetric, string> = {
  customers_assigned: "Assigned Customers",
  sale_produced_customers: "Conversions",
  repeated_customers: "Repeated Customers",
}

export default function SalesTeamProgressChartCRM({
  passingData,
}: {
  passingData: CRMTeamProgress[]
}) {
  const [data, setData] = useState<ChartRow[]>([])
  const [selectedDetail, setSelectedDetail] =
    useState<SelectedProgressDetail | null>(null)

  useEffect(() => {
    if (!Array.isArray(passingData)) return

    const updatedData = passingData.map((item) => ({
      ...item,
      full_name: item.name,
      name: item.name?.split(" ").slice(0, 2).join(" "),
      customers_assigned: Number(item.customers_assigned) || 0,
      sale_produced_customers: Number(item.sale_produced_customers) || 0,
      repeated_customers: Number(item.repeated_customers) || 0,
      customer_to_member_conversion:
        Number(item.customer_to_member_conversion) || 0,
    }))

    setData(updatedData)
  }, [passingData])

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-wrap justify-between gap-2 px-6 py-5 sm:py-6">
          <div className="flex flex-col justify-center gap-1">
            <CardTitle>Sales Team Progress</CardTitle>
            <CardDescription>
              Showing assigned customers, conversions, and repeated customers
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        <RenderBarChart
          data={data}
          onSelect={(member, metric) => setSelectedDetail({ member, metric })}
        />
      </CardContent>

      <ProgressDetailDialog
        selectedDetail={selectedDetail}
        onClose={() => setSelectedDetail(null)}
      />
    </Card>
  )
}

const RenderBarChart = ({
  data,
  onSelect,
}: {
  data: ChartRow[]
  onSelect: (member: ChartRow, metric: ProgressMetric) => void
}) => {
  const handleBarClick = (metric: ProgressMetric) => (entry: unknown) => {
    const payload = (entry as { payload?: ChartRow })?.payload
    if (payload) onSelect(payload, metric)
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[320px] w-full"
    >
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />

        <ChartTooltip
          content={
            <ChartTooltipContent
              className="w-[240px]"
              formatter={(value, name, item) => {
                const label =
                  chartConfig[name as keyof typeof chartConfig]?.label || name

                return (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                )
              }}
            />
          }
        />

        <Bar
          dataKey="customers_assigned"
          fill="var(--color-customers_assigned)"
          name="customers_assigned"
          radius={[4, 4, 0, 0]}
          className="cursor-pointer"
          onClick={handleBarClick("customers_assigned")}
        />

        <Bar
          dataKey="sale_produced_customers"
          fill="var(--color-sale_produced_customers)"
          name="sale_produced_customers"
          radius={[4, 4, 0, 0]}
          className="cursor-pointer"
          onClick={handleBarClick("sale_produced_customers")}
        />

        <Bar
          dataKey="repeated_customers"
          fill="var(--color-repeated_customers)"
          name="repeated_customers"
          radius={[4, 4, 0, 0]}
          className="cursor-pointer"
          onClick={handleBarClick("repeated_customers")}
        />
      </BarChart>
    </ChartContainer>
  )
}

const ProgressDetailDialog = ({
  selectedDetail,
  onClose,
}: {
  selectedDetail: SelectedProgressDetail | null
  onClose: () => void
}) => {
  const member = selectedDetail?.member
  const metric = selectedDetail?.metric
  const assignedCustomers = member?.customers_assigned_data || []
  const saleGroups =
    metric === "sale_produced_customers"
      ? member?.sale_produced_data || []
      : member?.repeated_customers_data || []

  return (
    <Dialog open={!!selectedDetail} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-hidden rounded-md p-0 sm:max-w-5xl">
        <DialogHeader className="border-b bg-muted/30 px-4 py-3">
          <DialogTitle className="text-base font-bold">
            {member?.full_name || member?.name || "Sales Member"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {metric ? metricLabels[metric] : "Progress Details"}
          </p>
        </DialogHeader>

        <div className="grid gap-2 border-b px-4 py-3 sm:grid-cols-4">
          <SummaryTile
            label="Assigned"
            value={member?.customers_assigned || 0}
          />
          <SummaryTile
            label="Conversions"
            value={member?.sale_produced_customers || 0}
          />
          <SummaryTile
            label="Repeated"
            value={member?.repeated_customers || 0}
          />
          <SummaryTile
            label="Member Conversion"
            value={member?.customer_to_member_conversion || 0}
          />
        </div>

        <ScrollArea className="h-[65vh]">
          <div className="p-4">
            {metric === "customers_assigned" ? (
              <CustomerDetailList customers={assignedCustomers} />
            ) : (
              <SaleGroupDetailList groups={saleGroups} />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

const SummaryTile = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-md border bg-background px-3 py-2">
    <p className="text-[11px] text-muted-foreground uppercase">{label}</p>
    <p className="mt-1 text-lg leading-none font-bold">{value}</p>
  </div>
)

const CustomerDetailList = ({
  customers,
}: {
  customers: CRMTeamProgressDataCustomer[]
}) => {
  if (customers.length === 0) return <EmptyDetailState />

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {customers.map((customer) => (
        <CustomerCard key={customer.id} customer={customer} />
      ))}
    </div>
  )
}

const SaleGroupDetailList = ({
  groups,
}: {
  groups: {
    customer: CRMTeamProgressDataCustomer
    sales: CRMTeamProgressDataSale[]
  }[]
}) => {
  const { base_route } = useUserDetail()
  if (groups.length === 0) return <EmptyDetailState />

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.customer.id} className="rounded-md border bg-card p-3">
          <CustomerCard customer={group.customer} compact />

          <div className="mt-3 overflow-x-auto rounded-md border">
            <table className="w-full min-w-[620px] text-xs">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-bold">Order No.</th>
                  <th className="px-3 py-2 text-left font-bold">Serial</th>
                  <th className="px-3 py-2 text-left font-bold">Power</th>
                  <th className="px-3 py-2 text-left font-bold">
                    Contract Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b last:border-b-0 odd:bg-muted/20"
                  >
                    <td className="px-3 py-2 font-semibold">
                      <Link
                        className="hover:underline"
                        href={`/${base_route}/member/${group.customer.id}/${sale.id}`}
                      >
                        {sale.order_no_arr?.join(", ") || "-"}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{sale.serial_no || "-"}</td>
                    <td className="px-3 py-2">{sale.power || "-"}</td>
                    <td className="px-3 py-2">{sale.contract_date || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

const CustomerCard = ({
  customer,
  compact = false,
}: {
  customer: CRMTeamProgressDataCustomer
  compact?: boolean
}) => {
  const phone = Array.isArray(customer.phone)
    ? customer.phone.join(", ")
    : customer.phone || "-"
  const { base_route } = useUserDetail()

  return (
    <div
      className={`rounded-md border bg-background ${compact ? "p-2" : "p-3"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            className="hover:underline"
            href={`/${base_route}/${customer.member ? "member" : "customer"}/${customer.id}`}
          >
            <p className="truncate text-sm font-bold">
              {customer.owner || customer.name || "-"}
            </p>
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {customer.name || "-"}
          </p>
        </div>
        <span className="rounded-md bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary">
          {customer.member ? "Member" : "Customer"}
        </span>
      </div>

      <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
        <p className="truncate">Phone: {phone}</p>
        <p className="truncate">Location: {customer.location || "-"}</p>
      </div>
    </div>
  )
}

const EmptyDetailState = () => (
  <div className="flex min-h-[220px] flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 px-4 text-center">
    <p className="text-sm font-bold">No detail data found</p>
    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
      Detail records will appear here when this metric has saved data.
    </p>
  </div>
)
