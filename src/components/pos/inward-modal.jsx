import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import StockSearch from "./stock-search";
import axios from "@/lib/axios";
import useUserDetail from "@/hooks/use-user-detail";
import Spinner from "../ui/spinner";

const InwardModal = ({ visible, onClose, data = [], onRefresh }) => {
    const [rows, setRows] = useState([{ sr: 1, existing: null, quantity: "", remarks: "", }]);
    const [loading, setLoading] = useState(false)
    const { userID } = useUserDetail()

    const stock = data.length > 0 ? data.slice(0, -2) : [];

    const handleRowChange = (index, field, value) => {
        const updatedRows = [...rows];
        updatedRows[index][field] = value;
        setRows(updatedRows);
    };

    const addRow = () => {
        setRows([
            ...rows,
            {
                sr: rows.length + 1,
                existing: null, quantity: "", remarks: "",
            },
        ]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true)

        const formData = {
            from: e.target.from.value,
            vehicle_no: e.target.vehicle_no.value,
            driver_name: e.target.driver_name.value,
            manager: e.target.manager.value,
            received_by: e.target.received_by.value,
            items: rows,
        };

        axios.post(`/${userID}/pos/inward`, formData).finally(() => {
            setLoading(false)

            onRefresh()
            onClose(false)
        })

        console.log("Form Data:", formData);
    };

    useEffect(() => {
        resetData()
    }, [visible])

    function resetData() {
        setRows([{ sr: 1, existing: null, quantity: "", remarks: "", }]);
    }

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

                        {/* Table for Items */}
                        <div className="border rounded-lg overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border p-2 w-12">Sr.</th>
                                        <th className="border p-2">Description</th>

                                        <th className="border p-2 w-32">Quantity</th>
                                        <th className="border p-2">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, index) => (
                                        <tr key={index}>
                                            <td className="border p-2 text-center">{row.sr}</td>
                                            <td className="border p-2">
                                                <StockSearch passingData={stock} value={row.existing} onReturn={(val) => handleRowChange(index, "existing", val)} />
                                            </td>

                                            <td className="border p-2">
                                                <Input
                                                    type="number"
                                                    value={row.quantity}
                                                    onChange={(e) => handleRowChange(index, "quantity", e.target.value)}
                                                    placeholder="Qty"
                                                />
                                            </td>
                                            <td className="border p-2">
                                                <Input
                                                    value={row.remarks}
                                                    onChange={(e) => handleRowChange(index, "remarks", e.target.value)}
                                                    placeholder="Remarks"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <Button type="button" variant="outline" onClick={addRow}>
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
