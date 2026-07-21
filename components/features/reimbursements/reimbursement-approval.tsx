"use client";
import { Button } from "@/components/ui/button";
import {
    ArrowUpDown,
    Banknote,
    CircleCheck,
    Clock3,
    Loader2,
    ReceiptText,
    Trash
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useState
} from "react";

import FilterSheet from "@/components/features/users/filter-sheet";
import { MyImgZooming } from "@/components/shared/media/img-zooming";
import PageTable from "@/components/shared/tables/app-table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import Spinner from "@/components/ui/spinner";
import { TIMEZONE } from "@/constants/data";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { UserReimbursementType } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import moment from "moment";
import momentT from "moment-timezone";
import Link from "next/link";

export default function ReimbursementApproval() {
    const [filterVisible, setFilterVisible] = useState(false);
    const [data, setData] = useState<UserReimbursementType[]>([]);
    const [imageURL, setImageURL] = useState<UserReimbursementType | null>(null);
    const [visible, setVisible] = useState(false);
    const { base_route, userID, reimbursement_approval } = useUserDetail();
    const [resetLoading, setResetLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<number | null>(null)
    const [deleteItem, setDeleteItem] = useState<number | null>(null)

    useEffect(() => {
        if (userID && reimbursement_approval) {
            const startDate = momentT
                .tz(TIMEZONE)
                .startOf("month")
                .startOf("day")
                .utc()
                .toISOString();
            const endDate = momentT
                .tz(TIMEZONE)
                .endOf("month")
                .endOf("day")
                .utc()
                .toISOString();
            fetchData(startDate, endDate);
        }
    }, [userID]);

    async function fetchData(startDate: string, endDate: string, user: null | number = null) {
        return new Promise((resolve, reject) => {
            axios
                .get(
                    `/${userID}/reimbursementapproval?start_date=${startDate}&end_date=${endDate}&user=${user || ""
                    }`,
                )
                .then((response) => {
                    setData(response.data);
                    resolve(true);
                })
                .catch((e) => {
                    console.log(e);
                    reject(null);
                })
                .finally(() => {
                    setLoading(false);
                });
        });
    }

    const columns: ColumnDef<UserReimbursementType>[] = [
        {
            accessorKey: "date",
            filterFn: "includesString",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Date
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => (
                <div>
                    {row.getValue("date")
                        ? moment(new Date(row.getValue("date"))).format("YYYY-MM-DD")
                        : ""}
                </div>
            ),
        },

        {
            accessorKey: "title",
            filterFn: "includesString",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Purpose
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => {
                return <div className="ml-2">{row.getValue("title")}</div>;
            },
        },

        {
            accessorKey: "customer",
            filterFn: "includesString",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Customer
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const currentItem = row.original;
                if (currentItem.customer_id)
                    return (
                        <Link
                            href={`/${base_route}/${currentItem.customer_member ? "member" : "customer"
                                }/${currentItem.customer_id}`}
                            target="blank"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="ml-2 hover:underline">
                                {row.getValue("customer")}
                            </div>
                        </Link>
                    );
            },
        },

        {
            accessorKey: "ownership_name",
            filterFn: "includesString",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Manager
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const currentItem = row.original;
                if (currentItem.ownership_id)
                    return <div className="ml-2">{row.getValue("ownership_name")}</div>;
            },
        },

        {
            accessorKey: "submitted_by_name",
            filterFn: "includesString",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Submitted By
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => (
                <div className="ml-2">{row.getValue("submitted_by_name")}</div>
            ),
        },

        {
            accessorKey: "city",
            filterFn: "includesString",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        City
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => <div className="ml-2">{row.getValue("city")}</div>,
        },
        {
            accessorKey: "amount",
            filterFn: "includesString",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Amount
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => <div>{row.getValue("amount")}</div>,
        },

        {
            accessorKey: "description",
            filterFn: "includesString",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Description
                        <ArrowUpDown />
                    </Button>
                );
            },
            cell: ({ row }) => <div>{row.getValue("description")}</div>,
        },

        {
            id: "actions",
            header: "Action",
            cell: ({ row }) => {
                const currentItem = row.original;
                const isVerifying = selectedItem === currentItem?.id;
                const isDeleting = deleteItem === currentItem?.id;

                return (
                    <div className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-1 shadow-sm">
                        <Button
                            size="xs"
                            variant="outline"
                            className="border-emerald-500/25 bg-background px-2.5 text-emerald-700 shadow-none hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                            disabled={isVerifying || isDeleting}
                            aria-label="Verify reimbursement"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleVerify(currentItem?.id);
                            }}
                        >
                            {isVerifying ? (
                                <Spinner className="size-3" />
                            ) : (
                                <CircleCheck className="size-3.5" />
                            )}
                            Verify
                        </Button>

                        <Button
                            size="xs"
                            variant="ghost"
                            className="px-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/15"
                            disabled={isDeleting || isVerifying}
                            aria-label="Delete reimbursement"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(currentItem?.id);
                            }}
                        >
                            {isDeleting ? (
                                <Spinner className="size-3" />
                            ) : (
                                <Trash className="size-3.5" />
                            )}
                            Delete
                        </Button>
                    </div>
                );
            },
        },

    ];

    async function handleVerify(id: number) {
        if (!id) return

        setSelectedItem(id)
        try {
            await axios.put(`/${userID}/reimbursement/${id}`, {
                verified: true
            })
            const startDate = momentT
                .tz(TIMEZONE)
                .startOf("month")
                .startOf("day")
                .utc()
                .toISOString();
            const endDate = momentT
                .tz(TIMEZONE)
                .endOf("month")
                .endOf("day")
                .utc()
                .toISOString();
            await fetchData(startDate, endDate);
        } finally {
            setSelectedItem(null)
        }
    }

    async function handleDelete(id: number) {
        if (!id) return

        setDeleteItem(id)
        try {
            await axios.delete(`/${userID}/reimbursement/${id}`)
            const startDate = momentT
                .tz(TIMEZONE)
                .startOf("month")
                .startOf("day")
                .utc()
                .toISOString();
            const endDate = momentT
                .tz(TIMEZONE)
                .endOf("month")
                .endOf("day")
                .utc()
                .toISOString();
            await fetchData(startDate, endDate);
        } finally {
            setDeleteItem(null)
        }
    }



    return (
        <div className="flex flex-1 flex-col space-y-4">
            <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="flex min-w-0 items-center gap-3 px-4 py-4 sm:px-5">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                        <ReceiptText className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Reimbursement</h1>
                            <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold tracking-wide text-muted-foreground uppercase sm:inline-flex">Approval workspace</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">Review and manage reimbursement requests.</p>
                    </div>
                </div>
                <div className="grid border-t bg-muted/20 sm:grid-cols-3 sm:divide-x">
                    <ApprovalMetric icon={<ReceiptText className="size-4 text-violet-600 dark:text-violet-400" />} label="Requests" value={data.length} />
                    <ApprovalMetric icon={<Clock3 className="size-4 text-amber-600 dark:text-amber-400" />} label="Pending" value={data.filter((item) => !item.verified).length} />
                    <ApprovalMetric icon={<Banknote className="size-4 text-emerald-600 dark:text-emerald-400" />} label="Total amount" value={data.reduce((sum, item) => sum + Number(item.amount || 0), 0).toLocaleString()} />
                </div>
            </section>

            <div className="flex flex-1 min-h-[600px]">
                <PageTable
                    loading={loading}
                    columns={columns}
                    data={data}
                    onRowClick={(val) => {
                        setImageURL(val);
                        setVisible(true);
                    }}
                    filter
                    reset
                    resetLoading={resetLoading}
                    onResetPress={async () => {
                        setResetLoading(true);
                        const startDate = momentT
                            .tz(TIMEZONE)
                            .startOf("month")
                            .startOf("day")
                            .utc()
                            .toISOString();
                        const endDate = momentT
                            .tz(TIMEZONE)
                            .endOf("month")
                            .endOf("day")
                            .utc()
                            .toISOString();
                        await fetchData(startDate, endDate);
                        setResetLoading(false);
                    }}
                    onFilterPress={() => setFilterVisible(true)}
                />

            </div>
            <FilterSheet
                user_disable={false}
                visible={filterVisible}
                onClose={() => setFilterVisible(false)}
                onReturn={async (val) => {
                    await fetchData(val.start, val.end, val.user);
                }}
            />
            <ImageSheet
                visible={visible}
                onClose={() => setVisible(false)}
                img={imageURL?.image || null}
                description={imageURL?.description || null}
                submittedBy={imageURL?.submitted_by_name || null}
                id={imageURL?.id || null}
                onRefresh={async (id) => {
                    const tempData = [...data.filter((item) => item.id !== id)];
                    setData([...tempData]);
                    return true;
                }}
            />
        </div>
    );
}

function ApprovalMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
    return <div className="flex items-center gap-3 border-t px-4 py-3 first:border-t-0 sm:border-t-0 sm:px-5">{icon}<div className="flex min-w-0 items-baseline gap-2"><span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</span><span className="truncate text-sm font-bold">{value}</span></div></div>;
}
const ImageSheet = ({
    visible,
    onClose,
    img,
    submittedBy,
    description,
    id,
    onRefresh,
}: {
    visible: boolean,
    onClose: () => void,
    img: string | null,
    submittedBy: string | null,
    description: string | null,
    id: number | null
    onRefresh: (id: number) => void
}) => {

    const [deleteLoading, setDeleteLoading] = useState(false);
    const { userID } = useUserDetail();


    const handleClose = useCallback(() => {

        onClose();

    }, [onClose]);



    async function handleDelete() {
        axios.delete(`/${userID}/reimbursement/${id}`).then(async () => {
            if (id)
                onRefresh(id);
            setDeleteLoading(false);
            handleClose();
        });
    }

    return (
        <Sheet open={visible} onOpenChange={handleClose}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Bill Detail</SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex flex-1 h-[80vh] px-4">
                    <div className="flex flex-col">
                        <Button
                            className="mb-2"
                            variant="destructive"
                            size="icon"
                            onClick={(e) => {
                                // e.stopPropagation()
                                // setSelectedCustomerId(currentItem?.id);
                                // setShowConfirmation(true);
                                if (!id) return;
                                setDeleteLoading(true);
                                handleDelete();
                            }}
                        >
                            {deleteLoading ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <Trash size={16} />
                            )}
                        </Button>

                        <strong>Submitted by</strong>
                        <p>{submittedBy || "N/A"}</p>

                        <strong>Description</strong>
                        <p>{description || "No description available"}</p>

                        <MyImgZooming img={img} />
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};

