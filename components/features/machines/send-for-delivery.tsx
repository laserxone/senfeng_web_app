
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    useEffect,
    useState
} from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { RequiredStar } from "@/components/shared/common/RequiredStar";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { TriggerFirebaseForMachine } from "@/lib/triggerFirebase";
import { MachineResponse } from "@/lib/types";
import "pdfjs-dist/build/pdf.worker.mjs";



const SendForDeliveryDialog = ({ open, onClose, onRefresh, data }: { open: boolean, onClose: () => void, onRefresh: () => Promise<void>, data: MachineResponse | null }) => {
    const { userID } = useUserDetail();

    const formSchema = z.object({
        name: z.string().min(1, "Receiver name is required"),
        city: z.string().min(1, "City is required"),
        number: z.string().min(1, "Contact number is required"),
        address: z.string().min(1, "Address is required"),
        pin: z.string().min(1, "Google pin is required"),
        note: z.string().optional(),
        tod: z.string().min(1, "Delivery time is required"),
    });

    type FormValues = z.infer<typeof formSchema>;

    const [loading, setLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            city: "",
            number: "",
            address: "",
            pin: "",
            note: "",
            tod: "",
        },
    });

    useEffect(() => {
        if (data?.customer?.id) {
            form.reset({
                name: data?.customer?.owner || "",
                city: data?.customer?.location || "",
                number: data?.customer?.number?.[0] || "",
                address: data?.customer?.address || "",
                pin: data?.customer?.pin || "",
                note: "",
                tod: "",
            });
        }
    }, [data]);

    async function onSubmit(values: FormValues) {

        if (!data?.machine?.id) return;

        setLoading(true);
        try {
            await axios.put(`/${userID}/machine/${data.machine.id}/delivery`, {
                ready_for_delivery: true,
                delivery_information: { ...values, tod: new Date(values.tod) },
                delivery_request_date: new Date()
            });
            await TriggerFirebaseForMachine()
            await onRefresh();
            onClose();
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-full sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Sending for Delivery</DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={form.handleSubmit(onSubmit, (err) => {
                        console.log("Validation Errors", err);
                    })}
                >
                    <ScrollArea className="h-[calc(100dvh-160px)] pr-2">
                        <div className="grid gap-4 py-4 px-2">

                            <Controller
                                name="name"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>
                                            Receiver Name <RequiredStar />
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            placeholder="Enter receiver name"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />

                            <Controller
                                name="city"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>
                                            City <RequiredStar />
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            placeholder="Enter city"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />

                            <Controller
                                name="number"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>
                                            Contact No <RequiredStar />
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            placeholder="Enter contact number"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />

                            <Controller
                                name="tod"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>
                                            Time of Delivery <RequiredStar />
                                        </FieldLabel>
                                        <Input
                                            type="datetime-local"
                                            {...field}
                                            aria-invalid={fieldState.invalid}
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />

                            <Controller
                                name="address"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>
                                            Address <RequiredStar />
                                        </FieldLabel>
                                        <Textarea
                                            {...field}
                                            placeholder="Enter full address"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />

                            <Controller
                                name="pin"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>
                                            Google Pin <RequiredStar />
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            placeholder="Paste Google Maps link"
                                            aria-invalid={fieldState.invalid}
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
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>Note</FieldLabel>
                                        <Textarea
                                            {...field}
                                            placeholder="Additional instructions (optional)"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                        </div>

                        <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                            Make sure everything is ready and completed before sending for
                            delivery request.
                        </div>

                        <div className="mt-2 flex flex-1 gap-2">
                            <Button type="button" variant="outline" className="flex flex-1" onClick={onClose}>
                                Cancel
                            </Button>

                            <Button type="submit" disabled={loading} className="flex flex-1">
                                {loading && <Spinner />}
                                Yes
                            </Button>
                        </div>
                    </ScrollArea>


                </form>
            </DialogContent>
        </Dialog>
    );
};

export default SendForDeliveryDialog