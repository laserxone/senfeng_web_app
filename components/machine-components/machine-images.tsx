
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Hash,
    MessageSquareText,
    ReceiptText,
    ShieldCheck,
    Trash
} from "lucide-react";
import {
    memo,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import DropzoneMulti from "@/components/dropzone-multi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import Spinner from "@/components/ui/spinner";
import { UserSearch } from "@/components/user-search";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useIsMobile } from "@/hooks/use-mobile";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import { MachineProps } from "@/lib/types";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import {
    FileText,
    Images,
    UploadCloud
} from "lucide-react";
import moment from "moment";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import { toast } from "sonner";

import { MyImgZooming } from "@/components/img-zooming";


type RenderImageProps = {

    img: string;
    type?: string;
    onDelete?: (img: string, imageType: string, imageIndex: number) => Promise<void> | void;
    imageType?: string;
    imageIndex?: number;
};

type ImageSheetProps = {
    payment_lock: boolean | undefined,
    visible: boolean,
    onClose: () => void,
    img: string | null,
    note: string | null,
    remarks: string | null,
    id: number | undefined,
    onRefresh: () => Promise<void>,
    editAllowed: boolean,
    cheque_id: string | null,
    override: boolean
}

type FormValues = {
    note: string;
    images: string[];
    handover_user_id?: number | null;
};

const formSchema = z
    .object({
        note: z.string().min(1, { message: "Type is required." }),
        images: z.array(z.string()).min(1, { message: "one image is required" }),
        handover_user_id: z.number().nullable().optional(),
    })
    .refine(
        (data) =>
            data.note !== "handover" ||
            (data.handover_user_id !== null && data.handover_user_id !== undefined),
        {
            message: "Handover User ID is required",
            path: ["handover_user_id"],
        }
    );


export const ImageSheet = ({
    payment_lock,
    visible,
    onClose,
    img,
    note,
    remarks,
    id,
    onRefresh,
    editAllowed,
    cheque_id,
    override
}: ImageSheetProps) => {

    const [deleteLoading, setDeleteLoading] = useState(false);
    const { userID } = useUserDetail();

    async function handleDelete(id: string | number) {
        try {
            if (img && !img.includes("https")) {
                await DeleteFromStorage(img);
            }
            await axios.delete(`/${userID}/payment/${id}`);
            await onRefresh();
            toast.success("Payment Deleted");
            onClose()
        } finally {
            setDeleteLoading(false);
        }
    }

    return (
        <Sheet open={visible} onOpenChange={onClose}>
            <SheetContent className="w-full overflow-hidden border-l-0 p-0 sm:max-w-xl sm:border-l">
                <div className="flex h-full flex-col bg-muted/20">
                    <SheetHeader className="border-b bg-background px-5 py-5 text-left sm:px-6">
                        <div className="flex items-start justify-between gap-4 pr-8">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                                    <ReceiptText className="h-5 w-5" />
                                </span>
                                <div className="min-w-0">
                                    <SheetTitle className="text-lg font-bold tracking-tight">
                                        Payment Receipt
                                    </SheetTitle>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Transaction proof and payment details
                                    </p>
                                </div>
                            </div>

                            {(!payment_lock || override) && (editAllowed || override) && (
                                <Button
                                    className="h-9 shrink-0 rounded-xl px-3 shadow-sm"
                                    variant="destructive"
                                    size="sm"
                                    disabled={deleteLoading}
                                    onClick={() => {
                                        if (!id) return;
                                        setDeleteLoading(true);
                                        handleDelete(id);
                                    }}
                                >
                                    {deleteLoading ? <Spinner /> : <Trash className="h-4 w-4" />}
                                    <span className="hidden sm:inline">Delete</span>
                                </Button>
                            )}
                        </div>
                    </SheetHeader>

                    <ScrollArea className="min-h-0 flex-1">
                        <div className="space-y-4 p-4 sm:p-6">
                            <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
                                <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                                    <div>
                                        <p className="text-sm font-semibold">Payment proof</p>
                                        <p className="text-xs text-muted-foreground">Select the image to inspect it closely</p>
                                    </div>
                                    <Badge variant="outline" className="rounded-full bg-background px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
                                        Receipt
                                    </Badge>
                                </div>
                                <div className="relative flex min-h-64 items-center justify-center bg-slate-50/80 p-3 dark:bg-zinc-950/40 sm:min-h-80 sm:p-4">
                                    <MyImgZooming img={img} fill />
                                </div>
                            </div>

                            <div className="rounded-2xl border bg-background p-4 shadow-sm">
                                <div className="mb-4 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                    <h3 className="text-sm font-semibold">Payment details</h3>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl border bg-muted/20 p-3">
                                        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                            <Hash className="h-3.5 w-3.5" />
                                            <span className="text-[10px] font-semibold uppercase tracking-wider">TID</span>
                                        </div>
                                        <Label className="block break-words text-sm font-semibold text-foreground">
                                            {note || "Not provided"}
                                        </Label>
                                    </div>

                                    {cheque_id && (
                                        <div className="rounded-xl border bg-muted/20 p-3">
                                            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                                <ReceiptText className="h-3.5 w-3.5" />
                                                <span className="text-[10px] font-semibold uppercase tracking-wider">Cheque #</span>
                                            </div>
                                            <Label className="block break-words text-sm font-semibold text-foreground">
                                                {cheque_id}
                                            </Label>
                                        </div>
                                    )}

                                    <div className="rounded-xl border bg-muted/20 p-3 sm:col-span-2">
                                        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                                            <MessageSquareText className="h-3.5 w-3.5" />
                                            <span className="text-[10px] font-semibold uppercase tracking-wider">Remarks</span>
                                        </div>
                                        <Label className="block whitespace-pre-wrap break-words text-sm font-medium leading-6 text-foreground">
                                            {remarks || "No remarks added"}
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export const ViewImagesSheet = ({
    editAllowed,
    visible,
    onClose,
    data,
    onRefresh,
    customer_id,
}: {
    editAllowed: boolean,
    visible: boolean,
    onClose: () => void
    onRefresh: () => Promise<void>
    data: MachineProps | undefined
    customer_id: number | undefined
}) => {

    if (!data) return null

    const [contractPdfImages, setContractPdfImages] = useState<string[]>([]);
    const [otherPdfImages, setOtherPdfImages] = useState<string[]>([]);
    const [addImageVisible, setAddImageVisible] = useState(false);

    const { userID } = useUserDetail();


    const contractImages = useMemo(() => data?.contract_images_png || [], [data]);
    const otherImages = useMemo(() => data?.other_images_png || [], [data]);
    const handshakeImages = useMemo(() => data?.handshake_images || [], [data]);
    const handoverImages = useMemo(
        () => data?.final_handover_images || [],
        [data],
    );
    const nameplateImages = useMemo(
        () => data?.machine_nameplate_images || [],
        [data],
    );
    const installationReport = useMemo(
        () => data?.installation_report || [],
        [data],
    );

    const prepareData = useCallback(async (pdfUrls: File[], condition: string) => {
        let localImages: string[] = [];
        await Promise.all(
            pdfUrls.map(async (pdfUrl) => {
                const pdfData = await fetchPdfData(pdfUrl);
                const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;

                for (let i = 1; i <= pdfDoc.numPages; i++) {
                    const page = await pdfDoc.getPage(i);
                    const scale = 2;
                    const viewport = page.getViewport({ scale });

                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    if (!ctx) return
                    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
                    const imgData = canvas.toDataURL("image/jpeg");

                    localImages.push(imgData);
                }
            }),
        );
        if (condition === "pdf") {
            setContractPdfImages((prevState) => [...prevState, ...localImages]);
        } else {
            setOtherPdfImages((prevState) => [...prevState, ...localImages]);
        }
    }, []);

    useEffect(() => {
        if (!visible) return;

        if (data?.contract_images_pdf?.length) {
            prepareData(data.contract_images_pdf, "pdf");
        }
        if (data?.other_images_pdf?.length) {
            prepareData(data.other_images_pdf, "other");
        }

        return () => {
            setContractPdfImages([]);
            setOtherPdfImages([]);
        };
    }, [visible, data?.contract_images_pdf, data?.other_images_pdf, prepareData]);

    const handleClose = useCallback(() => {

        onClose();

    }, [onClose]);

    const handleDeleteImage = async (imgUrl: string, typeKey: string, imageIndex: number) => {
        try {
            if (!imgUrl || !typeKey) return;
            const currentImages = data[typeKey as keyof MachineProps];
            if (!Array.isArray(currentImages)) return;

            const updatedImages = currentImages.filter((_: string, index: number) => index !== imageIndex);

            let storagePath = "";
            if (imgUrl.includes("https")) {
                storagePath = "";
            } else {
                storagePath = imgUrl;
            }

            if (storagePath && !updatedImages.includes(imgUrl)) {
                await DeleteFromStorage(storagePath);
            }

            let formData: Record<string, any> = {
                [typeKey]: updatedImages,
            };

            if (typeKey === "final_handover_images") {
                formData.handover_user_id = null;
            }

            await axios.put(`/${userID}/machine/${data.id}`, formData);

            toast.success("Image deleted successfully.");
            await onRefresh();
        } catch (error) {
            toast.error("Failed to delete image");
        }
    };

    const isMobile = useIsMobile()
    const maxwidth = isMobile ? "94vw" : "72vw"
    const totalImages =
        handshakeImages.length +
        nameplateImages.length +
        handoverImages.length +
        installationReport.length +
        contractImages.length +
        contractPdfImages.length +
        otherImages.length +
        otherPdfImages.length;

    type SheetImageGroup = {
        title: string
        description: string
        images: string[]
        imageType: string
        pdfImages?: string[]
        emptyText: string
    };

    const imageGroups: SheetImageGroup[] = [
        {
            title: "Handshake",
            description: "Customer handover and handshake proof",
            images: handshakeImages,
            imageType: "handshake_images",
            emptyText: "No handshake images found",
        },
        {
            title: "Nameplate",
            description: "Machine identity and serial plate",
            images: nameplateImages,
            imageType: "machine_nameplate_images",
            emptyText: "No nameplate images found",
        },
        {
            title: "Handover",
            description: "Final delivery and handover records",
            images: handoverImages,
            imageType: "final_handover_images",
            emptyText: "No handover images found",
        },
        {
            title: "Installation Report",
            description: "Installation report images",
            images: installationReport,
            imageType: "installation_report",
            emptyText: "No report found",
        },
        {
            title: "Contract",
            description: "Contract pages and converted PDFs",
            images: contractImages,
            imageType: "contract_images_png",
            pdfImages: contractPdfImages,
            emptyText: "No contract images found",
        },
        {
            title: "Additional",
            description: "Other supporting machine images",
            images: otherImages,
            imageType: "other_images_png",
            pdfImages: otherPdfImages,
            emptyText: "No additional images found",
        },
    ];

    const renderImageGroup = (group: SheetImageGroup) => {
        const count = group.images.length + (group.pdfImages?.length || 0);

        return (
            <Card key={group.title} className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-zinc-950 dark:ring-white/10 p-0">
                <CardHeader className="border-b bg-slate-50/80 px-3 py-2.5 dark:bg-zinc-900/70">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Images className="h-3.5 w-3.5" />
                                </span>
                                {group.title}
                            </CardTitle>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {group.description}
                            </p>
                        </div>
                        <Badge variant="outline" className="h-6 rounded-full bg-background px-2 text-[10px]">
                            {count} files
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-3">
                    {count > 0 ? (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                            {group.images.map((item, ind) => (
                                <RenderImage
                                    key={`${group.imageType}-${item}-${ind}`}
                                    img={item}
                                    imageIndex={ind}
                                    onDelete={(a, b, index) => {
                                        if (editAllowed) return handleDeleteImage(a, b, index);
                                    }}
                                    imageType={group.imageType}
                                />
                            ))}
                            {group.pdfImages?.map((item, ind) => (
                                <RenderImage
                                    key={`${group.imageType}-pdf-${ind}`}
                                    img={item}
                                    type="pdf"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed bg-slate-50 px-3 text-center text-sm text-muted-foreground dark:bg-zinc-900/50">
                            {group.emptyText}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <Sheet open={visible} onOpenChange={handleClose}>
            <SheetContent
                className="p-0"
                style={{ width: "100%", maxWidth: maxwidth }}
            >
                <SheetHeader className="border-b bg-slate-50/90 px-4 py-3 dark:bg-zinc-950">
                    <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Images className="h-4 w-4" />
                                </span>
                                <div>
                                    <SheetTitle className="text-lg font-semibold">
                                        Machine Images
                                    </SheetTitle>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Organized documents, proofs, and delivery records
                                    </p>
                                </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                                <span className="rounded-full bg-background px-2 py-1 ring-1 ring-border">
                                    {totalImages} total files
                                </span>
                                <span className="rounded-full bg-background px-2 py-1 ring-1 ring-border">
                                    {imageGroups.length} sections
                                </span>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            className="h-8 rounded-lg px-3"
                            onClick={() => {
                                if (editAllowed) {
                                    setAddImageVisible(true);
                                } else {
                                    toast.error("You are not allowed to perform this action");
                                }
                            }}
                        >
                            <Images className="h-3.5 w-3.5" />
                            Add Image
                        </Button>
                    </div>
                </SheetHeader>

                <AddImages
                    customer_id={customer_id}
                    machine={data}
                    visible={addImageVisible}
                    onClose={setAddImageVisible}
                    onRefresh={onRefresh}
                />

                <ScrollArea className="h-[calc(100vh-120px)]">
                    <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2">
                        {imageGroups.map(renderImageGroup)}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};


const RenderImage = memo(({ img, type, onDelete, imageType, imageIndex = -1 }: RenderImageProps) => {
    const [deleteLoading, setDeleteLoading] = useState(false);



    return (
        <div className="group relative overflow-hidden rounded-lg border bg-slate-50 shadow-sm transition-shadow hover:shadow-md dark:bg-zinc-900/70">
            <div className="flex aspect-[4/3] items-center justify-center p-2">
                <MyImgZooming img={img} />
            </div>
            {type && (
                <Badge className="absolute left-2 top-2 h-5 rounded-full bg-slate-900/80 px-2 text-[10px] text-white">
                    PDF
                </Badge>
            )}
            {onDelete && (
                <Button
                    variant="destructive"
                    size="icon-sm"
                    className="absolute right-2 top-2 h-7 w-7 rounded-full opacity-90 shadow-sm transition-opacity group-hover:opacity-100"
                    disabled={deleteLoading}
                    onClick={async () => {
                        if (deleteLoading || !imageType || imageIndex < 0) return;
                        setDeleteLoading(true);
                        try {
                            await onDelete(img, imageType, imageIndex);
                        } finally {
                            setDeleteLoading(false);
                        }
                    }}
                >
                    {deleteLoading ? <Spinner /> : <Trash size={16} />}
                </Button>
            )}
        </div>
    );
});

const AddImages = ({ customer_id, machine, visible, onClose, onRefresh }: { customer_id: number | undefined, machine: MachineProps, visible: boolean, onClose: (val: boolean) => void, onRefresh: () => Promise<void> }) => {
    const [loading, setLoading] = useState(false);
    const { userID } = useUserDetail();
    const { state: OfficeState } = useContext(OfficeContext)!;


    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            note: "",
            images: [],
            handover_user_id: null,
        },
    });

    async function onSubmit(values: FormValues) {
        setLoading(true);
        let allProcessedImages: string[] = [];
        await Promise.all(
            values.images.map(async (item) => {
                const name = `${OfficeState.value.data
                    }/customer/${customer_id}/machine/${machine.id}/${values.note
                    }/${moment().valueOf().toString()}.png`;
                const imageRefResult = await UploadImage(item, name);
                allProcessedImages.push(name);
            }),
        );
        let formData: Partial<MachineProps> = {};
        if (values.note === "contract") {
            formData.contract_images_png = [
                ...machine.contract_images_png,
                ...allProcessedImages,
            ];
        } else if (values.note === "additional") {
            formData.other_images_png = [
                ...machine.other_images_png,
                ...allProcessedImages,
            ];
        } else if (values.note === "handshake") {
            formData.handshake_images = [
                ...machine.handshake_images,
                ...allProcessedImages,
            ];
        } else if (values.note === "installation") {
            formData.installation_report = [
                ...machine.installation_report,
                ...allProcessedImages,
            ];
        } else if (values.note === "handover") {
            formData.final_handover_images = [
                ...machine.final_handover_images,
                ...allProcessedImages,
            ];
            formData.handover_user_id = values.handover_user_id;
        } else if (values.note === "nameplate") {
            formData.machine_nameplate_images = [
                ...machine.machine_nameplate_images,
                ...allProcessedImages,
            ];
        }

        await axios
            .put(`/${userID}/machine/${machine.id}`, formData)
            .then(async (response) => {
                await onRefresh();
                handleClose(false);
            })
            .finally(() => {
                setLoading(false);
            });
    }

    function handleClose(val: boolean) {
        form.reset();
        onClose(val);
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const files: File[] = Array.from(event.target.files);

            let localImages: any[] = [];

            await Promise.all(
                files.map(async (file) => {
                    const pdfData = await fetchPdfData(file);
                    const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;

                    for (let i = 1; i <= pdfDoc.numPages; i++) {
                        const page = await pdfDoc.getPage(i);
                        const scale = 2; // Increase for better quality
                        const viewport = page.getViewport({ scale });

                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;
                        if (!ctx) return
                        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
                        const imgData = canvas.toDataURL("image/jpeg");

                        localImages.push(imgData);
                    }
                }),
            );

            form.setValue("images", localImages);
        }
    };



    return (
        <Dialog open={visible} onOpenChange={handleClose}>
            <DialogTrigger asChild></DialogTrigger>
            <DialogContent className="w-full sm:max-w-4xl">
                <DialogHeader className="border-b bg-muted/20 px-4 py-4 sm:px-6">
                    <div className="flex items-start gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                            <Images className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <DialogTitle className="text-lg font-bold tracking-tight">
                                Add Machine Images
                            </DialogTitle>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Upload categorized machine documents, reports, and delivery photos.
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="h-[calc(92dvh-160px)]">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 sm:p-6">
                        <div className="rounded-2xl border bg-background p-3 shadow-sm sm:p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground">
                                        Image Category
                                    </h3>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Choose where these files should be saved.
                                    </p>
                                </div>
                                <Badge variant="outline" className="shrink-0">
                                    Required
                                </Badge>
                            </div>

                            <Controller
                                name="note"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <RadioGroup
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
                                        >
                                            {[
                                                { label: "Contract", value: "contract" },
                                                { label: "Handshake", value: "handshake" },
                                                { label: "Machine nameplate", value: "nameplate" },
                                                { label: "Final handover", value: "handover" },
                                                { label: "Installation report", value: "installation" },
                                                { label: "Additional", value: "additional" },
                                            ].map((item, i) => (
                                                <Label
                                                    key={i}
                                                    htmlFor={item.value}
                                                    className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition hover:border-primary/40 hover:bg-muted/30 ${field.value === item.value
                                                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                                                        : "border-border bg-background"
                                                        }`}
                                                >
                                                    <RadioGroupItem value={item.value} id={item.value} />
                                                    <span className="font-medium">{item.label}</span>
                                                </Label>
                                            ))}
                                        </RadioGroup>

                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                        </div>

                        {form.watch("note") === "handover" && (
                            <div className="rounded-2xl border bg-background p-3 shadow-sm sm:p-4">
                                <Controller
                                    name="handover_user_id"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel className="text-sm font-semibold">
                                                Handover User
                                            </FieldLabel>
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
                            </div>
                        )}

                        <div className="rounded-2xl border bg-background p-3 shadow-sm sm:p-4">
                            <div className="mb-3 flex items-start gap-3">
                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                                    <UploadCloud className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground">
                                        Upload Images
                                    </h3>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Add multiple PNG or JPG files. You can also paste images directly.
                                    </p>
                                </div>
                            </div>

                            <Controller
                                name="images"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <DropzoneMulti
                                            value={field.value || []}
                                            onDrop={(files) => field.onChange(files)}
                                            title="Click to upload"
                                            subheading="or drag and drop"
                                            description="PNG or JPG"
                                            drag="Drop the files here..."
                                        />

                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Separator className="flex-1" />
                            <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                                or convert PDF
                            </span>
                            <Separator className="flex-1" />
                        </div>

                        <div className="rounded-2xl border bg-muted/15 p-3 shadow-sm sm:p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <Label className="text-sm font-semibold">
                                            Select PDF
                                        </Label>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            Each page will be converted into an image preview.
                                        </p>
                                    </div>
                                </div>

                                <Input
                                    multiple
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleFileChange}
                                    className="h-auto w-full cursor-pointer rounded-xl border-dashed bg-background py-2 text-xs sm:max-w-xs"
                                />
                            </div>
                        </div>

                        <div className="flex flex-1 gap-2 flex-wrap">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleClose(false)}
                                disabled={loading}
                                className="flex-1 flex"
                            >
                                Cancel
                            </Button>
                            <Button className="flex-1 flex" type="submit" disabled={loading}>
                                {loading && <Spinner />} Submit Images
                            </Button>
                        </div>
                    </form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

const fetchPdfData = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    return new Uint8Array(arrayBuffer);
};
