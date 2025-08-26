"use client";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { useContext, useEffect, useState } from "react";

import PageTable from "@/components/app-table";
import { CustomerSearch } from "@/components/customer-search";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { UserContext } from "@/store/context/UserContext";
import "react-medium-image-zoom/dist/styles.css";

export default function Page() {
  const [data, setData] = useState([]);
  const [visible, setVisible] = useState(false);
  const { userID } = useUserDetail();
  const [loading, setLoading] = useState(true);
  const [selectedMachine, setSelectedMachine] = useState({});

  useEffect(() => {
    if (userID) {
      fetchData();
    }
  }, [userID]);

  async function fetchData() {
    return new Promise((resolve, reject) => {
      axios
        .get(`/${userID}/machine-bookings`)
        .then((response) => {
          const apiData = response.data;
          const enriched = apiData.map((item) => {
            return { ...item, name: item.name || item.owner };
          });
          setData(enriched);
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

  const columns = [
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
      cell: ({ row }) => (
        <div className="ml-2">{row.getValue("machine_model")}</div>
      ),
    },

    {
      accessorKey: "machine_source",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Source
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="ml-2">{row.getValue("machine_source")}</div>
      ),
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
      cell: ({ row }) => (
        <div className="ml-2">{row.getValue("machine_power")}</div>
      ),
    },

    {
      accessorKey: "booked_by_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Booked By
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="ml-2">
          {row.getValue("booked_by_name")
            ? row.getValue("booked_by_name")
            : "NIL"}
        </div>
      ),
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
            Booked for
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="ml-2">
          {row.getValue("customer_name")
            ? row.getValue("customer_name")
            : "NIL"}
        </div>
      ),
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
        <Badge className="ml-2">{row.getValue("status")}</Badge>
      ),
    },

    {
      id: "actions",
      cell: ({ row }) => {
        const currentItem = row.original;

        return (
          <div className="flex flex-row gap-2">
            {!currentItem?.customer_id ? (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMachine(currentItem);
                  setVisible(true);
                }}
              >
                Book customer
              </Button>
            ) : currentItem?.order_status === "Delivered" ? (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMachine(currentItem);
                }}
              >
                Sell Machine
              </Button>
            ) : (
              <p>No action required</p>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex justify-between flex-wrap">
        <Heading title="Machines" description="Book machines" />
      </div>

      <div className="flex flex-1 min-h-[600px]">
        <PageTable
          loading={loading}
          columns={columns}
          data={data}
          totalItems={data.length}
          searchItem={"title"}
          searchName={"Search bill..."}
          onRowClick={(val) => {}}
        />
      </div>
      <CustomerSelectionDialog
        user_id={userID}
        machine_id={selectedMachine?.id}
        onClose={setVisible}
        visible={visible}
        onRefresh={async () => await fetchData()}
      />
    </div>
  );
}

const CustomerSelectionDialog = ({
  visible,
  onClose,
  onRefresh,
  user_id,
  machine_id,
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const {userID} = useUserDetail()

  function handleClose(val) {
    onClose(val);
  }

  async function handleSelection() {
    if (!selectedCustomer || !user_id || !machine_id) return;

    setLoading(true);

    axios
      .put(`/${userID}/machine-bookings/${machine_id}`, {
        customer_id: selectedCustomer,
        status: "Booked",
        booked: true,
        booking_date: new Date(),
        booked_by: user_id,
      })
      .then(async () => {
        await onRefresh();
        handleClose(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Customer</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-2">
          <Label>Select Customer</Label>
          <CustomerSearch
            value={selectedCustomer}
            onReturn={setSelectedCustomer}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSelection}>
            {loading && <Spinner />}Select
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
