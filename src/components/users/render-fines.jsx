import PageTable from "@/components/app-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TIMEZONE } from "@/constants/data";
import useUserDetail from "@/hooks/use-user-detail";
import { ArrowUpDown, Filter } from "lucide-react";
import moment from "moment";
import momentT from "moment-timezone";
import { useEffect, useState } from "react";
import FilterSheet from "./filterSheet";
import axios from "@/lib/axios";


const columns = [
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

  {
    accessorKey: "user_name",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Employee
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("user_name")}</div>,
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
          Customer
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("customer_name")}</div>,
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
    accessorKey: "reason",
    filterFn: "includesString",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Reason
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("reason")}</div>,
  },
];

const tableHeader = [
  {
    value: "customer_name",
    label: "Customer",
  },
  {
    value: "user_name",
    label: "Employee",
  },
  {
    value: "amount",
    label: "Amount",
  },
  {
    value: "reason",
    label: "Reason",
  },
];

const RenderFines = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const { userID } = useUserDetail();
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

  async function fetchData(startDate, endDate) {
    setLoading(true);
    return new Promise((resolve, reject) => {
      axios
        .get(`/${userID}/fine?start_date=${startDate}&end_date=${endDate}`)
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

  return (
    <Card className="flex flex-1">
      <CardContent className="pt-2 flex flex-1">
        <div className="flex flex-1 flex-col space-y-4">
          <div className="flex flex-1">
            <PageTable
              loading={loading}
              columns={columns}
              data={data}
              tableHeader={tableHeader}
            >
              <Button
                onClick={() => setFilterVisible(true)}
                variant="ghost"
                className="p-0 w-8"
              >
                <Filter />
              </Button>
            </PageTable>
          </div>
        </div>
      </CardContent>

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await fetchData(val.start, val.end);
        }}
      />
    </Card>
  );
};

export default RenderFines;
