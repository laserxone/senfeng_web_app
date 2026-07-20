"use client";
import { Button } from "@/components/ui/button";
import {
    ArrowUpDown,
    Filter,
    Loader2,
    Trash
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useState
} from "react";

import PageTable from "@/components/shared/tables/app-table";
import Heading from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import Spinner from "@/components/ui/spinner";
import FilterSheet from "@/components/features/users/filter-sheet";
import { TIMEZONE } from "@/constants/data";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { UserReimbursementType } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import moment from "moment";
import momentT from "moment-timezone";
import Link from "next/link";
import { MyImgZooming } from "@/components/shared/media/img-zooming";

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

                return (
                    <div>
                        <Button
                            disabled={selectedItem === currentItem?.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleVerify(currentItem?.id);
                            }}
                        >
                            {selectedItem === currentItem?.id ? (
                                <Spinner />
                            ) : (
                                "Verify"
                            )}
                        </Button>

                        <Button
                            variant={"destructive"}
                            disabled={deleteItem === currentItem?.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(currentItem?.id);
                            }}
                        >
                            {deleteItem === currentItem?.id ? (
                                <Spinner />
                            ) : (
                                "Delete"
                            )}
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
            <div className="flex justify-between flex-wrap">
                <Heading title="Reimbursement" description="Manage reimbursements" />

            </div>

            <div className="flex flex-1 min-h-[600px]">
                <PageTable
                    loading={loading}
                    columns={columns}
                    data={data}
                    onRowClick={(val) => {
                        setImageURL(val);
                        setVisible(true);
                    }}
                >
                    <Button
                        onClick={() => setFilterVisible(true)}
                        variant="ghost"
                        className="p-0 w-8"
                    >
                        <Filter />
                    </Button>

                    <Button
                        variant="destructive"
                        onClick={async () => {
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
                    >
                        {resetLoading && <Spinner />} Reset
                    </Button>

                </PageTable>
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

