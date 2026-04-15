"use client";
import PageTable from "@/components/app-table-without-pagination";
import AppCalendar from "@/components/appCalendar";
import { CustomerSearch } from "@/components/customer-search";
import { RequiredStar } from "@/components/RequiredStar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import  Heading  from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { UserSearch } from "@/components/user-search";
import { useDebounce } from "@/hooks/use-debounce";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { TOMORROW, YESTERDAY, yesterday } from "@/lib/utils";
import { OfficeContext } from "@/store/context/OfficeContext";
import { ArrowUpDown, Trash2 } from "lucide-react";
import moment from "moment";
import { useContext, useEffect, useState } from "react";
import ConfimationDialog from "./alert-dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function MainRepairingLab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const { userID } = useUserDetail();
  const debouncedUserId = useDebounce(userID, 1000);
  const [assignTask, setAssignTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filter, setFilter] = useState("all");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedTaskDelete, setSelectedTaskDelete] = useState(null);

  useEffect(() => {
    if (debouncedUserId) {
      fetchData();
    }
  }, [debouncedUserId]);

  function fetchData() {
    setLoading(true);
    axios
      .get(`/${debouncedUserId}/lab`)
      .then((response) => {
        setData(response.data);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const columns = [
    {
      accessorKey: "assign_date",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Assigned Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex gap-2 items-center">
          <div
            className={`${
              row.original.status === "pending" ? "bg-red-500" : "bg-green-500"
            } border border-white h-3 w-3`}
          />{" "}
          <div>
            {moment(new Date(row.getValue("assign_date"))).format("YYYY-MM-DD")}
          </div>
        </div>
      ),
    },

    {
      accessorKey: "user_name",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Assigned To
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("user_name")}</div>,
    },

    {
      accessorKey: "deliver_date",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Delivery Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          {moment(new Date(row.getValue("deliver_date"))).format("YYYY-MM-DD")}
        </div>
      ),
    },

    {
      accessorKey: "customer_name",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("customer_name")}</div>,
    },

    {
      accessorKey: "owner_name",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Sale Person
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("owner_name")}</div>,
    },

    {
      accessorKey: "remarks",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Remarks
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("remarks")}</div>,
    },

    {
      accessorKey: "remarks_other",
      filterFn: "includesString",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Engineer Remarks
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("remarks_other")}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const currentItem = row.original;

        return (
          <Button
            size="icon"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              if (currentItem?.id) setSelectedTaskDelete(currentItem?.id);
              // setSelectedCustomer(currentItem);
              // setShowFeedback(true);
            }}
          >
            <Trash2 />
          </Button>
        );
      },
    },
  ];

  async function handleDelete(labID) {
    setDeleteLoading(true);
    axios
      .delete(`/${userID}/lab/${labID}`)
      .then(() => {
        fetchData();
        setSelectedTaskDelete(null);
      })
      .finally(() => {
        setDeleteLoading(false);
      });
  }

  const filteredData =
    filter === "all"
      ? data
      : data.filter((item) => item.status?.includes(filter));

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <Heading title="Repair and Maintenance" description="" />
        <div className="flex gap-2">
          <Button onClick={() => setAssignTask(true)}>Assign Tasks</Button>
        </div>
      </div>

      <PageTable
        onRowClick={(val) => setSelectedTask(val)}
        loading={loading}
        columns={columns}
        data={filteredData}
      >
        <div className="w-[200px]">
          <Select onValueChange={setFilter} value={filter}>
            <SelectTrigger>
              <SelectValue placeholder="Select office" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Cleared</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </PageTable>

      <AssignTasksModal
        open={assignTask}
        onChange={setAssignTask}
        userID={debouncedUserId}
        onRefresh={fetchData}
      />

      <UpdateTaskModal
        open={!!selectedTask}
        onChange={() => setSelectedTask(null)}
        userID={debouncedUserId}
        task_id={selectedTask?.id}
        onRefresh={fetchData}
      />

      <ConfimationDialog
        loading={deleteLoading}
        open={!!selectedTaskDelete}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove this item from the system"}
        onPressYes={() => handleDelete(selectedTaskDelete)}
        onPressCancel={() => setSelectedTaskDelete(null)}
      />
    </div>
  );
}

const AssignTasksModal = ({ open, onChange, userID, onRefresh }) => {
  const [form, setForm] = useState({
    assign_date: null,
    deliver_date: null,
    user_id: null,
    customer_id: null,
    charges: 0,
    remarks: "",
    managing_office: ""
  });
  const [loading, setLoading] = useState(false);
  const { state: OfficeState } = useContext(OfficeContext);

  const updateForm = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Placeholder function for API call
  const handleSaveTask = async () => {
    setLoading(true);

    axios
      .post(`/${userID}/lab`, form)
      .then(() => {
        onRefresh();
        setForm({
          assign_date: null,
          deliver_date: null,
          user_id: null,
          customer_id: null,
          charges: 0,
          remarks: "",
          managing_office: OfficeState.value.data || "lahore",
        });
        onChange(false);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Dialog open={open} onOpenChange={onChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Task</DialogTitle>
          <div className="flex flex-1 flex-col gap-4">
            {/* Assign Date */}
            <div>
              <h1>
                Assign Date <RequiredStar />
              </h1>
              <AppCalendar
                date={form.assign_date}
                onChange={(date) => updateForm("assign_date", date)}
                min={YESTERDAY}
               
              />
            </div>

            {/* Delivery Date */}
            <div>
              <h1>
                Delivery Date <RequiredStar />
              </h1>
              <AppCalendar
                date={form.deliver_date}
                onChange={(date) => updateForm("deliver_date", date)}
                min={YESTERDAY}
              />
            </div>

            {/* Assigned To */}
            <div>
              <h1>
                Assigned To <RequiredStar />
              </h1>
              <UserSearch
                value={form.user_id}
                onReturn={(e) => updateForm("user_id", e)}
              />
            </div>

            {/* Customer */}
            <div>
              <h1>
                Customer <RequiredStar />
              </h1>
              <CustomerSearch
                value={form.customer_id}
                onReturn={(e) => updateForm("customer_id", e)}
              />
            </div>

            {/* Charges */}
            <div>
              <h1>
                Charges <RequiredStar />
              </h1>
              <Input
                type="number"
                placeholder="Enter charges"
                value={form.charges}
                onChange={(e) => updateForm("charges", Number(e.target.value))}
              />
            </div>

            {/* Remarks */}
            <div>
              <h1>Remarks</h1>
              <Textarea
                placeholder="Enter remarks"
                value={form.remarks}
                onChange={(e) => updateForm("remarks", e.target.value)}
              />
            </div>

            {/* Save Button */}
            <Button
              disabled={
                !form.assign_date ||
                !form.deliver_date ||
                !form.user_id ||
                !form.customer_id ||
                !form.charges
              }
              onClick={handleSaveTask}
            >
              {loading && <Spinner />} Save
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

const UpdateTaskModal = ({ open, onChange, userID, onRefresh, task_id }) => {
  useEffect(() => {
    if (open) {
      setForm({ status: null, remarks_other: "" });
      setLoading(false);
    }
  }, [open]);
  const [form, setForm] = useState({
    status: null,
    remarks_other: "",
  });
  const [loading, setLoading] = useState(false);

  const updateForm = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Placeholder function for API call
  const handleSaveTask = async () => {
    setLoading(true);

    axios
      .put(`/${userID}/lab/${task_id}`, form)
      .then(() => {
        onRefresh();
        setForm({
          status: null,
          remarks_other: "",
        });
        onChange(false);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Dialog open={open} onOpenChange={onChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Task</DialogTitle>
          <div className="flex flex-1 flex-col gap-4">
            {/* Status Buttons */}
            <div>
              <h1>
                Status <RequiredStar />
              </h1>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={form.status === "pending" ? "default" : "outline"}
                  onClick={() => updateForm("status", "pending")}
                >
                  Pending
                </Button>
                <Button
                  variant={form.status === "completed" ? "default" : "outline"}
                  onClick={() => updateForm("status", "completed")}
                >
                  Completed
                </Button>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <h1>Remarks</h1>
              <Textarea
                placeholder="Enter remarks"
                value={form.remarks_other}
                onChange={(e) => updateForm("remarks_other", e.target.value)}
              />
            </div>

            {/* Save Button */}
            <Button disabled={!form.status} onClick={handleSaveTask}>
              {loading && <Spinner />} Save
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
