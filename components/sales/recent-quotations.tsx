import { ArrowUpRight, FileText } from "lucide-react";
import moment from "moment";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import useUserDetail from "@/hooks/use-user-detail";
import { QuotationData } from "@/lib/types";
import Link from "next/link";

export default function RecentQuotations({ data = [] }: { data?: QuotationData[] }) {
    const quotations = data.slice(0, 10);
    const { base_route } = useUserDetail()

    return (
        <Card className="flex h-full w-full flex-col overflow-hidden border border-slate-200/80 bg-gradient-to-br from-background via-slate-50 to-amber-50/25 shadow-sm ring-1 ring-black/5 xl:h-full">
            <CardContent className="flex min-h-0 flex-1 flex-col p-4">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold sm:text-base">Recent Quotations</p>
                            <p className="text-xs text-muted-foreground">Latest quoted machines</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">

                        <Link
                            href={`/${base_route}/quotation`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            View All
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                        <Badge variant="secondary" className="rounded-md">
                            {quotations.length}
                        </Badge>
                    </div>
                </div>

                {quotations.length ? (
                    <div className="mt-3 min-h-0 flex-1 overflow-auto rounded-md border border-slate-200/80 bg-background/80">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-100 hover:bg-slate-100">
                                    <TableHead className="h-9 w-[80px] px-4 text-xs">
                                        ID
                                    </TableHead>
                                    <TableHead className="h-9 min-w-[190px] text-xs">
                                        Customer
                                    </TableHead>
                                    <TableHead className="h-9 min-w-[130px] text-xs">
                                        Amount
                                    </TableHead>
                                    <TableHead className="h-9 min-w-[120px] text-xs">
                                        Date
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>

                                {quotations.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-muted/30">
                                        <TableCell className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                                            #{item.id || "-"}
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            <div className="min-w-0">
                                                <p className="max-w-[220px] truncate text-sm font-medium">
                                                    {item.customer_name || "-"}
                                                </p>
                                                <p className="max-w-[220px] truncate text-xs text-muted-foreground">
                                                    {item.machine_model || item.contact_person || "-"}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2.5 text-sm font-semibold tabular-nums">
                                            {formatPrice(item.price)}
                                        </TableCell>
                                        <TableCell className="py-2.5 text-sm text-muted-foreground">
                                            {formatDate(item.date)}
                                        </TableCell>
                                    </TableRow>
                                ))}

                            </TableBody>

                        </Table>
                    </div>
                ) : (
                    <div className="flex h-full min-h-[300px] items-center justify-center text-sm text-muted-foreground">
                        No recent quotations found
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function formatDate(date?: Date | string | null) {
    if (!date) return "-";

    const value = moment(date);
    return value.isValid() ? value.format("YYYY-MM-DD") : "-";
}

function formatPrice(price?: string | number | null) {
    if (price === undefined || price === null || price === "") return "-";

    const number = Number(String(price).replace(/[^\d.-]/g, ""));

    if (Number.isNaN(number)) {
        return String(price);
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PKR",
        maximumFractionDigits: 0,
    }).format(number);
}
