import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import {
    pdf
} from "@react-pdf/renderer";
import { useEffect, useState } from "react";
import { Label } from "../ui/label";
import Spinner from "../ui/spinner";
import { Switch } from "../ui/switch";
import InvoicePDFGatepass from "./invoice-pdf-gatepass";
import StockSearch from "./stock-search";

const emptyItem = {
    name: "",
    qty: "",
    unit: "",
    remarks: "",
    isExisting: true,
    inventory_id: null,
};

const InwardModal = ({ visible, onClose, data = [], onRefresh }) => {

    const [items, setItems] = useState([emptyItem]);
    const [loading, setLoading] = useState(false)
    const { userID } = useUserDetail()

    const stock = data.length > 0 ? data.slice(0, -2) : [];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true)

        const formData = {
            from: e.target.from.value,
            vehicle_no: e.target.vehicle_no.value,
            driver_name: e.target.driver_name.value,
            manager: e.target.manager.value,
            received_by: e.target.received_by.value,
            items: items,
        };

        try {
            const response = await axios.post(`/${userID}/pos/inward`, formData)
            const blob = await pdf(
                <InvoicePDFGatepass
                    from={formData.from}
                    vehicle_no={formData.vehicle_no}
                    driver_name={formData.driver_name}
                    received_by={formData.received_by}
                    manager={formData.manager}
                    gatepass={response.data.id}
                    gatepassType={"Inward Gate Pass"}
                    items={items}
                />
            ).toBlob();

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
        index,
        field,
        value
    ) => {
        if (field === "isExisting") {
            const copy = [...items];
            copy[index] = { ...copy[index], [field]: value, name: "", qty: "", remarks: "", unit: "", inventory_id: null };
            setItems(copy);
        } else {
            const copy = [...items];
            copy[index] = { ...copy[index], [field]: value };
            setItems(copy);
        }

    };

    const addItem = () => setItems([...items, emptyItem]);
    const removeItem = (index) =>
        items.length > 1 ? setItems(items.filter((_, i) => i !== index)) : null;

    return (
        <Dialog open={visible} onOpenChange={onClose}>
            <DialogContent className="p-4 max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Inward Gatepass</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[90vh] w-full pr-2">
                    <form onSubmit={handleSubmit} className="space-y-4 ">
                        {/* Top Fields */}
                        <div className="grid grid-cols-2 gap-4 px-2">
                            <div>
                                <label className="text-sm font-medium">From</label>
                                <Input name="from" placeholder="Enter From" required />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Vehicle No</label>
                                <Input name="vehicle_no" placeholder="Enter Vehicle No" required />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Driver Name</label>
                                <Input name="driver_name" placeholder="Enter Driver Name" required />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Manager</label>
                                <Input name="manager" placeholder="Enter Manager" required />
                            </div>
                            <div className="col-span-2">
                                <label className="text-sm font-medium">Received By</label>
                                <Input name="received_by" placeholder="Enter Receiver Name" required />
                            </div>
                        </div>

                        <div className="space-y-6">
                            {items.map((item, index) => (
                                <div key={index} className="border rounded-md p-4 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label>Item #{index + 1}</Label>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            disabled={items.length === 1}
                                            onClick={() => removeItem(index)}
                                        >
                                            Remove
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={item.isExisting}
                                            onCheckedChange={(val) => {
                                                handleItemChange(index, "isExisting", val)
                                            }
                                            }
                                        />
                                        <Label>
                                            {item.isExisting ? "Existing Item" : "New Item"}
                                        </Label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">

                                        {item.isExisting ?
                                            <div>
                                                <Label>Inventory</Label>
                                                <StockSearch
                                                    value={item.inventory_id}
                                                    passingData={stock}
                                                    onReturnData={(val) => {
                                                        const copy = [...items];
                                                        copy[index] = {
                                                            ...copy[index],
                                                            inventory_id: Number(val.id),
                                                            name: val.name,
                                                            unit: val.unit
                                                        };
                                                        setItems(copy);
                                                    }}
                                                />
                                            </div>
                                            :
                                            <div>
                                                <Label>Name</Label>
                                                <Input
                                                    value={item.name}
                                                    onChange={(e) =>
                                                        handleItemChange(index, "name", e.target.value)
                                                    }
                                                />
                                            </div>
                                        }

                                        <div>
                                            <Label>Quantity</Label>
                                            <Input
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
                                            <Label>Unit</Label>
                                            <Input
                                                value={item.unit}
                                                onChange={(e) =>
                                                    handleItemChange(index, "unit", e.target.value)
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label>Remarks</Label>
                                            <Input
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

                        <Button type="button" variant="outline" onClick={addItem}>
                            + Add Row
                        </Button>

                        <Button disabled={loading} type="submit" className="w-full">
                            {loading && <Spinner />} Submit
                        </Button>
                    </form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};





export default InwardModal;
