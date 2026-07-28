import { InventorySearch } from "@/components/shared/search/inventory-select";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { StockProps } from "@/lib/types";
import { FileText, PackageCheck, Plus, Trash2, Truck } from "lucide-react";
import { useEffect, useState } from "react";

type EmptyType = {
    name: string
    qty: string
    unit?: string
    isExisting: boolean
    inventory_id: null | number
    remarks: string
}
const emptyItem: EmptyType = {
    name: "",
    qty: "",
    unit: "",
    remarks: "",
    isExisting: true,
    inventory_id: null,
};

const InwardModal = ({ visible, onClose, data = [], onRefresh }: {
    visible: boolean, onClose: (val: boolean) => void, data: StockProps[], onRefresh: () => Promise<void>
}) => {

    const [items, setItems] = useState([emptyItem]);
    const [loading, setLoading] = useState(false)
    const { userID } = useUserDetail()

    const stock = data;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true)
        const formData = new FormData(e.currentTarget);
        const data = {
            from: formData.get("from") as string,
            vehicle_no: formData.get("vehicle_no") as string,
            driver_name: formData.get("driver_name") as string,
            manager: formData.get("manager") as string,
            received_by: formData.get("received_by") as string,
            items: items,
        };

        try {
            const response = await axios.post(`/${userID}/pos/inward`, data)
            const PDFData = {
                from: data.from,
                vehicle_no: data.vehicle_no,
                driver_name: data.driver_name,
                received_by: data.received_by,
                manager: data.manager,
                gatepass: response.data.id,
                gatepassType: "Inward Gate Pass",
                items: items,
            }
            const pdfRes = await axios.post(
                `/${userID}/pos/inward/pdf`,
                {
                    data: PDFData,
                },
                {
                    responseType: "blob",
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            const blob = new Blob([pdfRes.data], {
                type: "application/pdf",
            });

            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
            setTimeout(() => URL.revokeObjectURL(url), 600000);

        } catch (e) {
            console.log(e)
        }

        setLoading(false)
        onRefresh()
        onClose(false)
    };

    useEffect(() => {
        resetData()
    }, [visible])

    function resetData() {
        setItems([emptyItem]);
        setLoading(false)
    }


    const handleItemChange = (
        index: number,
        field: string,
        value: string | boolean | number
    ) => {
        if (field === "isExisting") {
            const copy = [...items];
            copy[index] = { ...copy[index], [field as string]: value, name: "", qty: "", remarks: "", unit: "", inventory_id: null };
            setItems(copy);
        } else {
            const copy = [...items];
            copy[index] = { ...copy[index], [field]: value };
            setItems(copy);
        }

    };

    const addItem = () => setItems([...items, emptyItem]);
    const removeItem = (index: number) =>
        items.length > 1 ? setItems(items.filter((_, i) => i !== index)) : null;

    return (
        <Dialog open={visible} onOpenChange={onClose}>
            <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-2xl">
                <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                            <Truck className="h-4 w-4" />
                        </span>
                        <div>
                            <DialogTitle className="text-sm font-semibold text-foreground">Inward Gatepass</DialogTitle>
                            <p className="text-xs text-muted-foreground">Record received items and generate inward gate pass PDF.</p>
                        </div>
                    </div>
                </DialogHeader>
                <ScrollArea className="max-h-[calc(100dvh-132px)] w-full">
                    <form onSubmit={handleSubmit} className="space-y-3 p-3.5 pb-4 [&_input]:rounded-lg [&_label]:text-[11px] [&_label]:font-semibold [&_label]:uppercase [&_label]:tracking-wide [&_label]:text-muted-foreground">
                        <section className="rounded-md border bg-card p-3">
                            <div className="mb-3 flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                    <FileText className="h-4 w-4" />
                                </span>
                                <div>
                                    <p className="text-sm font-bold">Gatepass details</p>
                                    <p className="text-xs text-muted-foreground">Sender, vehicle and receiving information</p>
                                </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">From</label>
                                    <Input className="h-8 rounded-md text-sm" name="from" placeholder="Enter From" required />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Vehicle No</label>
                                    <Input className="h-8 rounded-md text-sm" name="vehicle_no" placeholder="Enter Vehicle No" required />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Driver Name</label>
                                    <Input className="h-8 rounded-md text-sm" name="driver_name" placeholder="Enter Driver Name" required />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Manager</label>
                                    <Input className="h-8 rounded-md text-sm" name="manager" placeholder="Enter Manager" required />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Received By</label>
                                    <Input className="h-8 rounded-md text-sm" name="received_by" placeholder="Enter Receiver Name" required />
                                </div>
                            </div>
                        </section>

                        <section className="rounded-md border bg-card p-3">
                            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                                        <PackageCheck className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold">Received items</p>
                                        <p className="text-xs text-muted-foreground">{items.length} row{items.length === 1 ? "" : "s"} added</p>
                                    </div>
                                </div>
                                <Button type="button" size="sm" variant="outline" className="h-8 rounded-md text-xs" onClick={addItem}>
                                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Row
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {items.map((item, index) => (
                                    <div key={index} className="rounded-md border bg-muted/10 p-3">
                                        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-background text-xs font-bold ring-1 ring-border">
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <Label className="text-sm font-bold">Item #{index + 1}</Label>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.isExisting ? "Select from stock inventory" : "Enter a new item manually"}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="h-8 rounded-md text-xs text-destructive hover:text-destructive"
                                                disabled={items.length === 1}
                                                onClick={() => removeItem(index)}
                                            >
                                                <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                                            </Button>
                                        </div>

                                        <div className="mb-3 flex items-center justify-between rounded-md border bg-background px-3 py-2">
                                            <div>
                                                <Label className="text-xs font-bold">
                                                    {item.isExisting ? "Existing Item" : "New Item"}
                                                </Label>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Toggle source for this item row
                                                </p>
                                            </div>
                                            <Switch
                                                checked={item.isExisting}
                                                onCheckedChange={(val) => {
                                                    handleItemChange(index, "isExisting", val)
                                                }
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">

                                            {item.isExisting ?
                                                <div className="xl:col-span-2">
                                                    <Label className="mb-1 block text-xs font-semibold text-muted-foreground">Inventory</Label>
                                                    <InventorySearch value={item.inventory_id} data={stock} onReturn={(val) => {
                                                        const copy = [...items];
                                                        copy[index] = {
                                                            ...copy[index],
                                                            inventory_id: Number(val.id),
                                                            name: val.name ?? "",
                                                            unit: val.unit
                                                        };
                                                        setItems(copy);
                                                    }} />
                                                </div>
                                                :
                                                <div className="xl:col-span-2">
                                                    <Label className="mb-1 block text-xs font-semibold text-muted-foreground">Name</Label>
                                                    <Input
                                                        className="h-8 rounded-md text-sm"
                                                        value={item.name}
                                                        onChange={(e) =>
                                                            handleItemChange(index, "name", e.target.value)
                                                        }
                                                    />
                                                </div>
                                            }

                                            <div>
                                                <Label className="mb-1 block text-xs font-semibold text-muted-foreground">Quantity</Label>
                                                <Input
                                                    className="h-8 rounded-md text-sm"
                                                    type="number"
                                                    value={item.qty ? item.qty : ""}
                                                    onChange={(e) => {
                                                        if (!isNaN(Number(e.target.value)))
                                                            handleItemChange(
                                                                index,
                                                                "qty",
                                                                Number(e.target.value)
                                                            );
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Label className="mb-1 block text-xs font-semibold text-muted-foreground">Unit</Label>
                                                <Input
                                                    className="h-8 rounded-md text-sm"
                                                    value={item.unit}
                                                    onChange={(e) =>
                                                        handleItemChange(index, "unit", e.target.value)
                                                    }
                                                />
                                            </div>
                                            <div className="md:col-span-2 xl:col-span-4">
                                                <Label className="mb-1 block text-xs font-semibold text-muted-foreground">Remarks</Label>
                                                <Input
                                                    className="h-8 rounded-md text-sm"
                                                    value={item.remarks}
                                                    onChange={(e) =>
                                                        handleItemChange(index, "remarks", e.target.value)
                                                    }
                                                />
                                            </div>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        </section>


                        <Button disabled={loading} type="submit" className="h-9 w-full rounded-md text-sm">
                            {loading && <Spinner />} Submit Inward Gatepass
                        </Button>

                    </form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};





export default InwardModal;
