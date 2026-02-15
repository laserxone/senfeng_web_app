"use client";

import PageTable from "@/components/app-table-without-pagination";
import CurrencyFormatter from "@/components/currency-formatter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import  Heading  from "@/components/ui/heading";
import { Skeleton } from "@/components/ui/skeleton";
import FilterSheet from "@/components/users/filterSheet";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { ArrowUpDown, Filter } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Page() {
  const [filterVisible, setFilterVisible] = useState(false);
  const { userID, base_route } = useUserDetail();
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commulative, setCommulative] = useState({
    total: 0,
    pending: 0,
    received: 0,
  });
  const [commloading, setCommloading] = useState(false);
  const [filterDate, setFilterDate] = useState({ start: null, end: null });

  useEffect(() => {
    if (userID) fetchCommulative();
  }, [userID]);

  async function fetchCommulative() {
    setCommloading(true);
    axios
      .get(`/${userID}/finance/all`)
      .then((response) => {
        setCommulative(response.data.summary);
        setTableData(response.data.items);
      })
      .finally(() => {
        setCommloading(false);
      });
  }

  const data = tableData.reduce(
    (acc, item) => {
      const total = Number(item.total_generated || item.machine_price || 0);
      const received = Number(item.amount || item.total_payment_received || 0);
      const pending = total - received;

      acc.total += total;
      acc.received += received;
      acc.pending += pending;

      return acc;
    },
    {
      total: 0,
      received: 0,
      pending: 0,
    },
  );

  const columns = [
    {
      accessorKey: "customer_owner",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Owner
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("customer_owner")}</div>,
    },

    {
      accessorKey: "customer_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Company
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <Link
          target="blank"
          href={`/${base_route}/member/${row.original.customer_id}`}
          className="hover:underline"
        >
          <div>{row.getValue("customer_name")}</div>
        </Link>
      ),
    },
    {
      accessorKey: "machine_serial_no",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Machine
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <Link
          target="blank"
          href={`/${base_route}/member/${row.original.customer_id}/${row.original.machine_id}`}
          className="hover:underline"
        >
          <div>{row.getValue("machine_serial_no")}</div>
        </Link>
      ),
    },

    {
      accessorKey: "machine_contract_date",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Contract Date
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div>
          {row.getValue("machine_contract_date")
            ? moment(new Date(row.getValue("machine_contract_date"))).format(
                "YYYY-MM-DD",
              )
            : "-"}
        </div>
      ),
    },

    {
      accessorKey: "sell_by_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Sale Person
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("sell_by_name")}</div>,
    },

    {
      accessorKey: "total_generated",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Price
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("total_generated")}</div>,
    },

    {
      accessorKey: "total_payment_received",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Received
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("total_payment_received")}</div>,
    },

    {
      accessorKey: "total_balance",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Balance
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("total_balance")}</div>,
    },
  ];

  async function fetchData(startDate, endDate, user = null) {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `/${userID}/finance?start_date=${startDate}&end_date=${endDate}&user=${user || ""}`,
        )
        .then((response) => {
          setTableData(response.data);
        })
        .finally(() => {
          setLoading(false);
          resolve();
        });

      setFilterDate({
        start: startDate,
        end: endDate,
      });
    });
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <Heading
          className="my-2"
          title={"Finance"}
          description={"Manage finance"}
        />
      </div>
      <div className="flex flex-row justify-between flex-wrap gap-4">
        <Card className="w-full sm:w-auto sm:min-w-[350px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bill Generated
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            {commloading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                <CurrencyFormatter amount={commulative?.total} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full sm:w-auto sm:min-w-[350px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payment Received
            </CardTitle>
            {commulative?.received ? (
              <div>
                {`${((Number(commulative.received) * 100) / Number(commulative.total)).toFixed(0)}%`}{" "}
              </div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            )}
          </CardHeader>
          <CardContent>
            {commloading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <div className="text-2xl font-bold text-green-700">
                <CurrencyFormatter amount={commulative?.received} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full sm:w-auto sm:min-w-[350px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payment Pending
            </CardTitle>
            {commulative?.pending ? (
              <div>
                {`${((Number(commulative.pending) * 100) / Number(commulative.total)).toFixed(0)}%`}{" "}
              </div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            )}
          </CardHeader>
          <CardContent>
            {commloading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <div className="text-2xl font-bold text-red-700">
                <CurrencyFormatter amount={commulative?.pending} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-row justify-between flex-wrap gap-4">
        <Card className="w-full sm:w-auto sm:min-w-[350px] ">
          <CardContent className="p-0 px-4 py-2">
            {filterDate?.start && (
              <div className="flex gap-2 items-center flex-wrap">
                <p className="text-xs">From</p>
                <p className="font-bold text-blue-500 text-md">
                  {moment(filterDate.start).format("YYYY-MM-DD")}
                </p>
                <p className="text-xs">to</p>

                <p className="font-bold text-blue-500 text-md">
                  {moment(filterDate.end).format("YYYY-MM-DD")}
                </p>
              </div>
            )}
            <div className="text-sm">Total Bill Generated</div>
            <div className="font-bold">
              <CurrencyFormatter amount={data?.total} />
            </div>
          </CardContent>
        </Card>

        <Card className="w-full sm:w-auto sm:min-w-[350px]">
          <CardContent className="p-0 px-4 py-2">
            {filterDate?.start && (
              <div className="flex gap-2 items-center flex-wrap">
                <p className="text-xs">From</p>
                <p className="font-bold text-blue-500 text-md">
                  {moment(filterDate.start).format("YYYY-MM-DD")}
                </p>
                <p className="text-xs">to</p>

                <p className="font-bold text-blue-500 text-md">
                  {moment(filterDate.end).format("YYYY-MM-DD")}
                </p>
              </div>
            )}
            <div className="text-sm">Total Payment Received</div>
            <div className="font-bold text-green-400">
              <CurrencyFormatter amount={data?.received} />
            </div>
          </CardContent>
        </Card>

        <Card className="w-full sm:w-auto sm:min-w-[350px]">
          <CardContent className="p-0 px-4 py-2">
            {filterDate?.start && (
              <div className="flex gap-2 items-center flex-wrap">
                <p className="text-xs">From</p>
                <p className="font-bold text-blue-500 text-md">
                  {moment(filterDate.start).format("YYYY-MM-DD")}
                </p>
                <p className="text-xs">to</p>

                <p className="font-bold text-blue-500 text-md">
                  {moment(filterDate.end).format("YYYY-MM-DD")}
                </p>
              </div>
            )}
            <div className="text-sm">Total Payment Pending</div>
            <div className="font-bold text-red-400">
              <CurrencyFormatter amount={data?.pending} />
            </div>
          </CardContent>
        </Card>
      </div>

      <PageTable
        loading={loading}
        columns={columns}
        data={tableData}
        onRowClick={(val, e) => {}}
        // filter={true}
        // onFilterClick={() => setFilterVisible(true)}
      >
        <Button
          onClick={() => setFilterVisible(true)}
          variant="ghost"
          className="p-0 w-8"
        >
          <Filter />
        </Button>
      </PageTable>

      <FilterSheet
        user_disable={false}
        visible={filterVisible}
        onClose={setFilterVisible}
        onReturn={async (val) => {
          setLoading(true);
          await fetchData(val.start, val.end, val.user);
        }}
      />
    </div>
  );
}
