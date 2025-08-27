"use client";
import { ArrowUpDown, Frown, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import PageTable from "@/components/app-table";
import { Heading } from "@/components/ui/heading";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import moment from "moment";
import Link from "next/link";

const tableHeader = [
  {
    value: "customer_name",
    label: "Client",
  },
  {
    value: "note",
    label: "Feedback",
  },
  {
    value: "status",
    label: "Status",
  },
];

export default function Page() {
  const [data, setData] = useState([]);
  const { userID, base_route } = useUserDetail();

  useEffect(() => {
    async function fetchData() {
      axios.get(`/${userID}/feedback`).then((response) => {
        const temp = response.data.map((item) => {
          return {
            ...item,
            customer_name: item.customer_name || item.customer_owner,
          };
        });
        setData([...temp]);
      });
    }
    if (userID) fetchData();
  }, [userID]);

  const columns = [
    {
      accessorKey: "customer_name",
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
        const item = row.original;
        return (
          <Link
            className="hover:underline"
            href={`/${base_route}/customer${item.customer_id}`}
          >
            <div className="ml-2">{row.getValue("customer_name")}</div>
          </Link>
        );
      },
    },
    {
      accessorKey: "feedback",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Feedback
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("feedback")}</div>,
    },

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
        <div>
          {row.getValue("status") === "Satisfactory" ? (
            <div className="flex items-center gap-2">
              <Smile size={"20px"} color="green" /> {" Satisfactory"}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Frown size={"20px"} color="red" /> {" Unsatisfactory"}
            </div>
          )}
        </div>
      ),
    },

    {
      accessorKey: "user_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Taken By
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("user_name")}</div>,
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
            Date
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div>
          {row.getValue("created_at")
            ? moment(new Date(row.getValue("created_at"))).format("YYYY-MM-DD")
            : ""}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading title="Feedback" description="Manage Feedback from clients" />
      </div>

      <PageTable
        columns={columns}
        data={data}
        totalItems={data.length}
        tableHeader={tableHeader}
        onRowClick={() => {}}
      ></PageTable>
    </div>
  );
}
