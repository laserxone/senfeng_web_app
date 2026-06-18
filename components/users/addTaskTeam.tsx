

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { CustomerSearch } from "@/components/customer-search";
import Spinner from "@/components/ui/spinner";
import { UserSearch } from "@/components/user-search";

import { RequiredStar } from "@/components/RequiredStar";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { TaskRadio } from "@/components/users/task";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { ScrollArea } from "../ui/scroll-area";


const formSchema = z
  .object({
    radio: z.enum(["office", "client"]),
    task: z.string().min(5, {
      message: "Task must be at least 5 characters.",
    }),
    client: z.number().nullable().optional(),
    user: z.number({ error: "User is required" }),
    problem: z.string().optional(),
    solution: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.radio === "client" && !data.client) {
      ctx.addIssue({
        path: ["client"],
        code: z.ZodIssueCode.custom,
        message: "Client is required.",
      });

       ctx.addIssue({
        path: ["problem"],
        code: z.ZodIssueCode.custom,
        message: "Problem is required.",
      });

       ctx.addIssue({
        path: ["solution"],
        code: z.ZodIssueCode.custom,
        message: "Solution is required.",
      });
    }
  });

type TaskFormValues = z.infer<typeof formSchema>;

export const AddTaskTeam = ({ visible, onClose, onRefresh, assigned_by }: { visible: boolean, onClose: (val: boolean) => void, onRefresh: () => Promise<void>, assigned_by: number | string }) => {
  const [loading, setLoading] = useState(false);


  const form = useForm<TaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      radio: "office",
      task: "",
      client: null,
      user: undefined,
      problem: "",
      solution: ""
    },
  });



  const { watch, reset, handleSubmit, control, getValues } = form;

  const selectedRadio = watch("radio");

  const onSubmit = (values: TaskFormValues) => {
    setLoading(true);
    axios
      .post(`${assigned_by}/task`, {
        task_name: values.task,
        type: values.radio == "office" ? "Office Task" : "Client Task",
        client: values.client,
        status: "Assigned",
        assigned_to: values.user,
        assigned_by: assigned_by,
        problem: values.problem,
        solution: values.solution,
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
      user: undefined,
      problem: "",
      solution: ""
    });
    onClose(val);
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="w-full sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add new task</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-160px)]">
        <div className="py-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>

              {/* Type */}
              <Controller
                name="radio"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Type <RequiredStar /></FieldLabel>

                    <TaskRadio
                      value={field.value}
                      onSelection={(e) => {
                        field.onChange(e);
                      }}
                    />

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Task */}
              <Controller
                name="task"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Task <RequiredStar /></FieldLabel>

                    <Input placeholder="Enter task" {...field} />

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* User */}
              <Controller
                name="user"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Select Employee <RequiredStar /></FieldLabel>

                    <UserSearch
                      value={field.value}
                      onReturn={field.onChange}
                    />

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {selectedRadio === "client" && (
                <>
                  {/* Client */}
                  <Controller
                    name="client"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Client <RequiredStar /></FieldLabel>

                        <CustomerSearch
                          value={field.value}
                          onReturn={(val) => field.onChange(val)}
                        />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  {/* Problem */}
                  <Controller
                    name="problem"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Problem <RequiredStar /></FieldLabel>

                        <Input
                          placeholder="Describe the problem"
                          {...field}
                        />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="solution"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Solution <RequiredStar /></FieldLabel>

                        <Input
                          placeholder="Proposed solution"
                          {...field}
                        />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </>
              )}

              {/* Submit */}
              <Button disabled={loading} className="w-full" type="submit">
                {loading && <Spinner />} Submit
              </Button>

            </FieldGroup>
          </form>
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};