"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import Spinner from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import useUserDetail from "@/hooks/use-user-detail"
import axios from "@/lib/axios"
import { UploadImage } from "@/lib/uploadFunction"
import moment from "moment"
import { RequiredStar } from "@/components/shared/common/RequiredStar"
import Dropzone from "@/components/shared/uploads/dropzone"

export const backupPartSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  power: z.string().min(1, { message: "Power is required." }),
  size: z.string().min(1, { message: "Size is required." }),
  serial_no: z.string().min(1, { message: "Serial number is required." }),
  image: z.string().min(1, { message: "Image is required" }),
  remarks: z.string().optional(),
})

export type BackupPartFormValues = z.infer<typeof backupPartSchema>

export type CreatedBackupPart = BackupPartFormValues & {
  id?: number
  status?: string
}

type AddBackupPartDialogProps = {
  visible: boolean
  onClose: (value: boolean) => void
  onRefresh?: () => Promise<void>
}

export default function AddBackupPartDialog({
  visible,
  onClose,
  onRefresh,
}: AddBackupPartDialogProps) {
  const [loading, setLoading] = useState(false)
  const { userID } = useUserDetail()

  const form = useForm<BackupPartFormValues>({
    resolver: zodResolver(backupPartSchema),
    defaultValues: {
      name: "",
      power: "",
      size: "",
      serial_no: "",
      remarks: "",
    },
  })

  async function onSubmit(values: BackupPartFormValues) {
    if (!userID) {
      toast.error("User is missing.")
      return
    }

    setLoading(true)
    try {
      const name = `Backup-Inventory/${moment().valueOf().toString()}.png`

      await UploadImage(values.image, name, "image/png")

      const payload = {
        name: values.name.trim(),
        power: values.power?.trim() || "",
        size: values.size?.trim() || "",
        serial_no: values.serial_no.trim(),
        remarks: values.remarks?.trim() || "",
        image: name,
      }

      await axios.post(`/${userID}/backup-parts`, payload)
      await onRefresh?.()
      toast.success("Backup part added successfully.")
      handleClose(false)
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to add backup part."
      )
      setLoading(false)
    }
  }

  function handleClose(value: boolean) {
    form.reset()
    setLoading(false)
    onClose(value)
  }

  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-xl">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground">
                Add Backup Part
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Add a backup part with serial, power, size, and remarks.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100dvh-132px)]">
          <div className="p-3.5">
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-3 [&_input]:rounded-lg [&_label]:text-[11px] [&_label]:font-semibold [&_label]:tracking-wide [&_label]:text-muted-foreground [&_label]:uppercase"
            >
              <FieldSet className="gap-3 rounded-xl border border-border bg-muted/20 p-3">
                <FieldLegend className="px-1 text-sm font-semibold text-foreground">
                  Part Details
                </FieldLegend>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Controller
                    name="name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>
                          Name <RequiredStar />
                        </FieldLabel>
                        <Input placeholder="Enter part name" {...field} />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="serial_no"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>
                          Serial No <RequiredStar />
                        </FieldLabel>
                        <Input placeholder="Enter serial no" {...field} />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="power"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>
                          Power <RequiredStar />
                        </FieldLabel>
                        <Input placeholder="Enter power" {...field} />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="size"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>
                          Size <RequiredStar />
                        </FieldLabel>
                        <Input placeholder="Enter size" {...field} />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="image"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>
                        Nameplate / Parts Image <RequiredStar />
                      </FieldLabel>
                      <Dropzone value={field.value} onDrop={field.onChange} />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="remarks"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Remarks</FieldLabel>
                      <Textarea
                        rows={4}
                        placeholder="Add remarks or condition details"
                        {...field}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldSet>

              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => handleClose(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Spinner />}
                  Save Part
                </Button>
              </div>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
