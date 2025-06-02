"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, Filter, Loader2, Trash } from "lucide-react";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import ConfimationDialog from "@/components/alert-dialog";
import PageTable from "@/components/app-table";
import AppCalendar from "@/components/appCalendar";
import Dropzone from "@/components/dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Spinner from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { UserSearch } from "@/components/user-search";
import FilterSheet from "@/components/users/filterSheet";
import { storage } from "@/config/firebase";
import axios from "@/lib/axios";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import exportToExcel from "@/lib/exportToExcel";
import { UploadImage } from "@/lib/uploadFunction";
import { UserContext } from "@/store/context/UserContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { getDownloadURL, ref } from "firebase/storage";
import moment from "moment";
import { useForm } from "react-hook-form";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { z } from "zod";
import { getStoragePathFromUrl } from "@/components/customer-components/machine/machine-component";
import { TIMEZONE } from "@/constants/data";
import momentT from "moment-timezone";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CustomerSearchWithData } from "@/components/customer-search-with-data";
import { RequiredStar } from "@/components/RequiredStar";
import { Badge } from "@/components/ui/badge";
import { CustomerSearch } from "@/components/customer-search";

export default function Page() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [data, setData] = useState([]);
  const [filterValues, setFilterValues] = useState(null);
  const [imageURL, setImageURL] = useState(null);
  const [visible, setVisible] = useState(false);
   const [visibleSell, setVisibleSell] = useState(false);
  const [reimbursementVisible, setReimbursementVisible] = useState(false);
  const [total, setTotal] = useState(0);
  const { state: UserState } = useContext(UserContext);
  const [resetLoading, setResetLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMachine, setSelectedMachine] = useState({});

  useEffect(() => {
    if (UserState.value.data?.id) {
      fetchData();
    }
  }, [UserState]);

  async function fetchData() {
    return new Promise((resolve, reject) => {
      axios
        .get(`/machine-bookings`)
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
                  setVisibleSell(true);
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
        user_id={UserState.value.data?.id}
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

  function handleClose(val) {
    onClose(val);
  }

  async function handleSelection() {
    if (!selectedCustomer || !user_id || !machine_id) return;

    setLoading(true);

    axios
      .put(`machine-bookings/${machine_id}`, {
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
