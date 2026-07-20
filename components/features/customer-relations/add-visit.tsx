import Dropzone from "@/components/shared/uploads/dropzone";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { MyCustomer } from "@/lib/types";
import { UploadImage } from "@/lib/uploadFunction";
import { zodResolver } from "@hookform/resolvers/zod";
import moment from "moment";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import AppCalendar from "@/components/features/calendar/app-calendar";
import { CustomerSearchWithData } from "@/components/features/customers/components/customer-search-with-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/components/ui/spinner";

const formSchema = z.object({
    note: z.string().min(1, "Note cannot be empty"),
    image: z.string().min(1, "image cannot be empty"),
    next: z.date(),
    city: z.string().min(1, "City is required"),
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(1, "Phone is required"),
    company: z.string().min(1, "Company is required"),
})

type FormValues = z.infer<typeof formSchema>


export default function AddVisit({ onRefresh, open, onClose, id }: { id: string | null | number, open: boolean, onClose: () => void, onRefresh?: () => Promise<void> }) {

    const [selectedCustomer, setSelectedCustomer] = useState<MyCustomer | null>(
        null
    )
    const [loading, setLoading] = useState(false)
    const { route_branch } = useUserDetail()


    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            note: "",
            image: "",
            next: undefined,
            city: "",
            name: "",
            phone: "",
            company: "",
        },
    })

    const onSubmit = async (values: FormValues) => {
        setLoading(true)
        try {
            if (values.image) {
                const name = `${route_branch}/customer/${selectedCustomer?.id}/visit/${moment()
                    .valueOf()
                    .toString()}.png`
                await UploadImage(values.image, name)
                await axios.post(`/${id}/visit`, {
                    ...values,
                    user_id: id,
                    image: name,
                    customer_id: selectedCustomer?.id,
                })
                await onRefresh?.()
                form.reset()
                setSelectedCustomer(null)
                setLoading(false)
            } else {
                await axios.post(`/${id}/visit`, {
                    ...values,
                    user_id: id,
                    customer_id: selectedCustomer?.id,
                })
                await onRefresh?.()
                form.reset()
                setSelectedCustomer(null)
                setLoading(false)
            }
        } catch (error) {
            console.log(error)
            setLoading(false)
        }
    }

    function handleClose() {
        setSelectedCustomer(null)
        setLoading(false)
        onClose()
    }


    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="w-full sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        Add Visit
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[calc(100dvh-132px)]">
                    <form
                        onSubmit={form.handleSubmit(onSubmit, (err) => {
                            console.log("Validation Errors", err)
                        })}
                        className="space-y-2.5 p-3"
                    >


                        <div className="min-w-[260px] flex-1 space-y-1">
                            <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                Customer
                            </Label>
                            <CustomerSearchWithData
                                value={selectedCustomer}
                                onReturn={(val) => {
                                    setSelectedCustomer(val)
                                    form.setValue("city", val?.location || "")
                                    form.setValue("name", val?.owner || "")
                                    form.setValue(
                                        "phone",
                                        val.number ? val?.number?.join(", ") : ""
                                    )
                                    form.setValue("company", val?.name || "")
                                }}
                            />
                        </div>

                        <Controller
                            name="image"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field
                                    data-invalid={fieldState.invalid}
                                    className="gap-1.5"
                                >
                                    <FieldLabel className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Image
                                    </FieldLabel>
                                    <div className="flex items-center">
                                        <Dropzone
                                            value={field.value}
                                            onDrop={(file) => field.onChange(file)}
                                            title={"Click to upload"}
                                            subheading={"or drag and drop"}
                                            description={"PNG or JPG"}
                                            drag={"Drop the files here..."}
                                            className="min-h-20 w-full border-dashed bg-slate-50/70 dark:bg-zinc-900/70"
                                        />
                                    </div>
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        <Controller
                            name="next"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field
                                    data-invalid={fieldState.invalid}
                                    className="gap-1.5 xl:order-3"
                                >
                                    <FieldLabel className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Next follow up
                                    </FieldLabel>
                                    <AppCalendar
                                        date={field.value}
                                        onChange={field.onChange}
                                        min={new Date()}
                                        max={""}
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        <Controller
                            name="note"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field
                                    data-invalid={fieldState.invalid}
                                    className="gap-1.5 xl:order-2"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <FieldLabel className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            Remarks
                                        </FieldLabel>

                                    </div>
                                    <Textarea
                                        {...field}
                                        rows={3}
                                        placeholder="Write visit summary, decisions, and pending work..."
                                        aria-invalid={fieldState.invalid}
                                        className="min-h-20 resize-none rounded-lg bg-slate-50/70 text-sm shadow-inner dark:bg-zinc-900/70"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />


                        <Button
                            disabled={!selectedCustomer?.id || loading}
                            type="submit"
                            className="h-8 w-full rounded-lg"
                        >
                            {loading && <Spinner />} Post Visit
                        </Button>
                    </form>
                </ScrollArea>
            </DialogContent>

        </Dialog>
    )
}