"use client";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  Banknote,
  CalendarDays,
  FileText,
  Info,
  Loader2,
  Plus,
  ReceiptText,
  ShieldCheck,
  Trash,
  UserRound,
  WalletCards
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState
} from "react";

import AddReimbursementDialog from "@/components/features/reimbursements/add-reimbursement";
import FilterSheet from "@/components/features/users/filter-sheet";
import CurrencyFormatter from "@/components/shared/common/currency-formatter";
import { MyImgZooming } from "@/components/shared/media/img-zooming";
import PageTable from "@/components/shared/tables/app-table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TIMEZONE } from "@/constants/data";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import exportToExcel from "@/lib/exportToExcel";
import { UserReimbursementType } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import moment from "moment";
import momentT from "moment-timezone";
import Link from "next/link";

export default function Page() {
  const [filterVisible, setFilterVisible] = useState(false);
  const [data, setData] = useState<UserReimbursementType[]>([]);
  const [imageURL, setImageURL] = useState<UserReimbursementType | null>(null);
  const [visible, setVisible] = useState(false);
  const [reimbursementVisible, setReimbursementVisible] = useState(false);
  const [total, setTotal] = useState(0);
  const { base_route, userID } = useUserDetail();
  const [resetLoading, setResetLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userID) {
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
          `/${userID}/reimbursement?start_date=${startDate}&end_date=${endDate}&user=${user || ""
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
        <div className="flex items-center gap-2">

          {row.original?.verified ? (

            <Tooltip>
              <TooltipTrigger>

                <ShieldCheck className="text-green-600 h-5 w-5" />

              </TooltipTrigger>
              <TooltipContent className="bg-green-600 mr-2" arrowColor="bg-green-600 fill-green-600">
                <p className="text-white">verified</p>
              </TooltipContent>
            </Tooltip>
          ) : (

            <Tooltip>
              <TooltipTrigger>

                <Info className="text-orange-600 h-5 w-5 animate-pulse-opacity mr-2" />

              </TooltipTrigger>
              <TooltipContent className="bg-orange-600" arrowColor="bg-orange-600 fill-orange-600">
                <p className="text-white">Unverified</p>
              </TooltipContent>
            </Tooltip>

          )}

          <div>
            {row.getValue("date")
              ? moment(new Date(row.getValue("date"))).format("YYYY-MM-DD")
              : ""}
          </div>
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

  ];

  function handleDownload() {
    const headers = [
      "Date",
      "Customer",
      "Submitted By",
      "City",
      "Amount",
      "Description",
    ];

    const formattedData = data.map((item) => [
      moment(item.date).format("YYYY-MM-DD"),
      item?.title,
      item.submitted_by_name,
      item.city,
      Number(item.amount || 0),
      item.description,
    ]);
    exportToExcel(
      headers,
      formattedData,
      "Reimbursement.xlsx",
      false,
      "",
      false,
    );
  }

  useEffect(() => {
    let localTotal = 0;
    data.forEach((item) => {
      localTotal = localTotal + Number(item.amount);
    });
    setTotal(localTotal);
  }, [data]);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <WalletCards className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Reimbursement</h1>
                <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold tracking-wide text-muted-foreground uppercase sm:inline-flex">Superadmin</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Manage reimbursement claims and receipt proofs.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setReimbursementVisible(true)}
          >
            <Plus />
            Add Remibursement
          </Button>
        </div>

        <div className="grid bg-muted/20 sm:grid-cols-3 sm:divide-x">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <Banknote className="size-4 text-emerald-600 dark:text-emerald-400" />
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Total amount</span>
              <span className="truncate text-sm font-bold"><CurrencyFormatter amount={total} /></span>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t px-4 py-3 sm:border-t-0 sm:px-5">
            <ReceiptText className="size-4 text-violet-600 dark:text-violet-400" />
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Claims</span>
              <span className="text-sm font-bold">{data.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t px-4 py-3 sm:border-t-0 sm:px-5">
            <CalendarDays className="size-4 text-amber-600 dark:text-amber-400" />
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Period</span>
              <span className="text-sm font-bold">Monthly</span>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-1 overflow-hidden rounded-2xl border bg-background p-3 shadow-sm">
        <PageTable
          tableWidth="w-[calc(100dvw-30px)]"
          loading={loading}
          columns={columns}
          data={data}
          onRowClick={(val) => {
            setImageURL(val);
            setVisible(true);
          }}
          download
          filter
          reset
          resetLoading={resetLoading}
          onFilterPress={() => setFilterVisible(true)}
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
            setResetLoading(false)
          }}
        />
      </section>

      <AddReimbursementDialog
        open={reimbursementVisible}
        onClose={() => setReimbursementVisible(false)}
        onRefresh={async () => {
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
          setReimbursementVisible(false);
        }}

      />

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
    if (!id) return

    try {
      await axios.delete(`/${userID}/reimbursement/${id}`)
      onRefresh(id)
    } finally {
      setDeleteLoading(false);
      handleClose();
    }
  }

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent className="w-full overflow-hidden p-0 sm:max-w-md">
        <SheetHeader className="border-b bg-muted/20 px-5 py-5 text-left">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-xl font-bold tracking-tight">
                Bill Detail
              </SheetTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Review receipt proof, description, and submitter details.
              </p>
            </div>
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100dvh-150px)]">
          <div className="space-y-4 p-5">
            <div className="rounded-2xl border bg-background p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Submitted by
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold">
                    {submittedBy || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-background p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                  <FileText className="h-5 w-5" />
                </div>
                <p className="font-semibold">Description</p>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                {description || "No description available"}
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-muted/15 p-3">

              <MyImgZooming img={img} />

            </div>

            <Button
              className="w-full gap-2"
              variant="destructive"
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
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash className="h-4 w-4" />
              )}
              Delete
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
