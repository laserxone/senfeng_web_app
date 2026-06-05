"use client";
import { TIMEZONE } from "@/constants/data";
import { ArrowUpDown, BadgeCheck, CircleDashed, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import PageTable from "@/components/app-table-without-pagination";
import { CustomerSearch } from "@/components/customer-search";
import Heading from "@/components/ui/heading";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { TaskProps } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import moment from "moment";
import momentT from "moment-timezone";
import { toast } from "sonner";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import Spinner from "../ui/spinner";
import FilterSheet from "./filterSheet";
import TaskDetail from "./taskDetail";


export default function TaskEmployee({ id }: { id: number }) {
  const { userID } = useUserDetail();
  const [data, setData] = useState<TaskProps[]>([]);
  const [visible, setVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskProps | null>(null);
  const [addTaskVisible, setAddTaskVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  useEffect(() => {
    if (id) {
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
      fetchData(id, startDate, endDate);
    }
  }, [id]);

  const columns: ColumnDef<TaskProps>[] = [
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
        <div className="flex ml-2 gap-1 items-center">
          <div>
            {row.getValue("status") === "Completed" ? (
              <BadgeCheck color="green" size={"15px"} />
            ) : (
              <CircleDashed color="red" size={"15px"} />
            )}
          </div>
          <div>{row.getValue("status")}</div>
        </div>
      ),
    },
    {
      accessorKey: "task_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Task Name
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("task_name")}</div>,
    },

    {
      accessorKey: "assigned_to_name",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Assigned To
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("assigned_to_name")}</div>,
    },

    {
      accessorKey: "created_at_time",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Assign Time
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div>
          {new Date(row.getValue("created_at_time")).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      ),
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
            Assign Date
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div>
          {moment(new Date(row.getValue("created_at"))).format("YYYY-MM-DD")}
        </div>
      ),
    },

    // {
    //   id: "actions",
    //   enableHiding: false,
    //   cell: ({ row }) => {
    //     return (
    //       <ChevronsRight
    //         onClick={() => {
    //           setSelectedTask(row.original);
    //           setVisible(true);
    //         }}
    //         className="cursor-pointer"
    //       />
    //     );
    //   },
    // },
  ];

  async function fetchData(id: number | string, start_date: string, end_date: string) {
    return new Promise((resolve, reject) => {
      axios
        .get(`/${id}/task?start_date=${start_date}&end_date=${end_date}`)
        .then((response) => {
          const apiData = response.data.map((item: TaskProps) => {
            return { ...item, created_at_time: item.created_at };
          });

          setData(apiData);
        })
        .catch((e) => {
          console.log(e);
        })
        .finally(() => {
          resolve(true);
        });
    });
  }


  async function handleUpdateMark() {
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
    fetchData(userID, startDate, endDate);
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading title="Task Management" description="Manage tasks" />

        <Button
          onClick={() => {
            setAddTaskVisible(true);
          }}
        >
          Add Task
        </Button>

        <AddTask
          onRefresh={async () => {
            const startDate = momentT
              .tz(TIMEZONE)
              .subtract(2, "months")
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

            fetchData(userID, startDate, endDate);
          }}
          user_id={userID}
          visible={addTaskVisible}
          onClose={setAddTaskVisible}
        />
      </div>

      <PageTable
        columns={columns}
        data={data}

        onRowClick={(val, e) => {
          setSelectedTask(val);
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
      </PageTable>

      <TaskDetail
        user_id={userID}
        detail={selectedTask}
        visible={visible}
        onClose={setVisible}
        onMark={async () => handleUpdateMark()}
      />

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await fetchData(id, val.start, val.end);
        }}
      />
    </div>
  );
}

export const TaskRadio = ({ onSelection, value }: { onSelection: (val: string) => void, value: string }) => {
  return (
    <RadioGroup
      defaultValue={value}
      onValueChange={onSelection}
      className="flex"
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="office" id="r1" />
        <Label htmlFor="r1">Office</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="client" id="r2" />
        <Label htmlFor="r2">Client</Label>
      </div>
    </RadioGroup>
  );
};




const formSchema = z
  .object({
    radio: z.enum(["office", "client"]),
    task: z.string().min(5, {
      message: "Task must be at least 5 characters.",
    }),
    client: z.number().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.radio === "client" && !data.client) {
      ctx.addIssue({
        path: ["client"],
        code: z.ZodIssueCode.custom,
        message: "Client is required.",
      });
    }
  });

type TaskFormValues = z.infer<typeof formSchema>;

const AddTask = ({ visible, onClose, onRefresh, user_id }: { visible: boolean, onClose: (val: boolean) => void, onRefresh: () => Promise<void>, user_id: number | string }) => {
  const [loading, setLoading] = useState(false);


  const form = useForm<TaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      radio: "office",
      task: "",
      client: null,
    },
  });

  const { watch, reset, handleSubmit, control, getValues } = form;

  const selectedRadio = watch("radio");



  const onSubmit = (values: TaskFormValues) => {
    setLoading(true);
    axios
      .post(`/${user_id}/task`, {
        task_name: values.task,
        type: values.radio == "office" ? "Office Task" : "Client Visit",
        client: values.client,
        status: "Pending",
        assigned_to: user_id,
      })
      .then(() => {
        onRefresh();
        handleClose(false);

        toast.success("Task created successfully");
      })

      .finally(() => {
        setLoading(false);
      });
  };

  function handleClose(val: boolean) {
    reset({
      radio: "office",
      task: "",
      client: null,
    });
    onClose(val);
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add new task</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <form onSubmit={handleSubmit(onSubmit, (e) => {
            console.log(e)
          })} className="space-y-4">
            <FieldGroup>

              <Controller
                name="radio"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Type</FieldLabel>

                    <TaskRadio
                      value={field.value}
                      onSelection={(val) => {
                        field.onChange(val);
                      }}
                    />

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="task"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Task</FieldLabel>

                    <Input placeholder="Enter task" {...field} />

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {selectedRadio === "client" && (
                <Controller
                  name="client"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Client</FieldLabel>

                      <CustomerSearch
                        value={field.value}
                        onReturn={field.onChange}
                      />

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}

              {/* Submit */}
              <Button className="w-full" type="submit" disabled={loading}>
                {loading && <Spinner />} Submit
              </Button>

            </FieldGroup>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
