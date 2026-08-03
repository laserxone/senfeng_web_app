import { MyImgZooming } from "@/components/shared/media/img-zooming"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useIsMobile } from "@/hooks/use-mobile"
import { PartsProps } from "@/lib/types"
import { Scrollbar } from "@radix-ui/react-scroll-area"
import { ChevronDown, CreditCard, Package, ReceiptText } from "lucide-react"
import moment from "moment"

export default function InvoiceDetails({ invoice }: { invoice: PartsProps }) {
  const isMobile = useIsMobile()

  function calculatePartStatus(data: PartsProps) {
    const itemsTotal = (data.fields || []).reduce(
      (sum: number, item: any) => sum + Number(item.total || 0),
      0
    )

    const totalPaid = (data.payments || []).reduce(
      (sum: number, payment: any) => sum + Number(payment.amount || 0),
      0
    )

    const finalAmount = itemsTotal - Number(data.discount || 0)

    let status = "NA"

    if (itemsTotal === 0) {
      status = "Paid"
    } else if (totalPaid === 0) {
      status = "Pending"
    } else if (finalAmount - totalPaid !== 0) {
      status = "Partial"
    } else {
      status = "Paid"
    }

    return {
      itemsTotal,
      totalPaid,
      finalAmount,
      status,
    }
  }

  const stats = calculatePartStatus(invoice)

  return (
    <Collapsible className="overflow-hidden rounded-xl bg-background shadow-sm ring-1 ring-black/5">
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/35">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ReceiptText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold">
                Invoice #{invoice.invoicenumber}
              </span>
              {stats?.status === "Paid" ? (
                <Badge className="h-5 rounded-full px-2 text-[10px]">
                  {stats?.status}
                </Badge>
              ) : (
                <Badge
                  variant="destructive"
                  className="h-5 rounded-full px-2 text-[10px]"
                >
                  {stats?.status}
                </Badge>
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                {invoice.fields.length} products
              </span>
              <span className="inline-flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5" />
                {invoice.payments.length} payments
              </span>
            </div>
          </div>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-sm font-semibold">{stats?.finalAmount}</p>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <ScrollArea
          className={`overflow-x-auto ${isMobile && "max-w-[calc(100vw-64px)]"}`}
        >
          <Card className="rounded-none border-0 bg-muted/10 shadow-none">
            <CardHeader className="px-3 py-2">
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg bg-background px-3 py-2 shadow-sm ring-1 ring-black/5">
                  <p className="text-xs text-muted-foreground">Invoice Total</p>
                  <p className="text-sm font-semibold">{stats?.finalAmount}</p>
                </div>
                <div className="rounded-lg bg-background px-3 py-2 shadow-sm ring-1 ring-black/5">
                  <p className="text-xs text-muted-foreground">Received</p>
                  <p className="text-sm font-semibold">{stats?.totalPaid}</p>
                </div>
                <div className="rounded-lg bg-background px-3 py-2 shadow-sm ring-1 ring-black/5">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-sm font-semibold">
                    {stats?.finalAmount - stats?.totalPaid}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-3 pb-3 text-sm">
              <div className="rounded-lg bg-background p-2 shadow-sm ring-1 ring-black/5">
                <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <Package className="h-3.5 w-3.5" />
                  Products
                </Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.fields.map((item, ind) => (
                      <TableRow key={ind}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>{item.price}</TableCell>
                        <TableCell>{item.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="rounded-lg bg-background p-2 shadow-sm ring-1 ring-black/5">
                <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <CreditCard className="h-3.5 w-3.5" />
                  Payments
                </Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Received By</TableHead>
                      <TableHead>Transaction Date</TableHead>
                      <TableHead>Clearance Date</TableHead>
                      <TableHead>Image</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.payments.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell>{p.amount}</TableCell>
                        <TableCell>{p.mode}</TableCell>
                        <TableCell>{p.received_by}</TableCell>
                        <TableCell>
                          {moment(p.transaction_date).format("YYYY-MM-DD")}
                        </TableCell>
                        <TableCell>
                          {p.clearance_date
                            ? moment(p.clearance_date).format("YYYY-MM-DD")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {p.image ? <MyImgZooming img={p.image} /> : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <Scrollbar orientation="horizontal" />
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  )
}
