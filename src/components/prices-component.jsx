"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { useEffect, useMemo, useState } from "react";
import Heading  from "./ui/heading";
import { Label } from "./ui/label";
import Spinner from "./ui/spinner";
import PageTable from "./app-table-without-pagination";
import { ArrowUpDown } from "lucide-react";

export default function PricesComponent() {

    const [loading, setLoading] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [data, setData] = useState([
    ]);

    const emptyForm = {
        model: "",
        power: "",
        ddp: "",
        fob: "",
        fob_bottom: "",
        ddp_bottom: "",
        description: ""
    };

    const [formData, setFormData] = useState(emptyForm);
    const [isEdit, setIsEdit] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);

    const { userID, isAdmin } = useUserDetail()

    useEffect(() => {
        if (userID) {
            fetchData()
        }
    }, [userID])

    async function fetchData() {
        axios.get(`/${userID}/prices`)
            .then((response) => {
                setData(response.data)
            })
    }


    const handleEditClick = (row) => {
        setFormData(row);
        setIsEdit(true);
        setOpenDialog(true);
    };

    const handleAddClick = () => {
        setFormData(emptyForm);
        setIsEdit(false);
        setOpenDialog(true);
    };

    const handleSave = () => {
        setLoading(true)
        if (isEdit) {
            axios.put(`/${userID}/prices/${formData.id}`, formData)
                .then(async () => { await fetchData() })
                .finally(() => {
                    setLoading(false)
                    setOpenDialog(false);
                })

        } else {
            axios.post(`/${userID}/prices`, formData)
                .then(async () => { await fetchData() })
                .finally(() => {
                    setLoading(false)
                    setOpenDialog(false);
                })
        }

    };


    const columns = useMemo(() => {
        const baseColumns = [
            {
                accessorKey: "model",
                filterFn: "includesString",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Model
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => <div>{row.getValue("model")}</div>,
            },

            {
                accessorKey: "power",
                filterFn: "includesString",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Power
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => <div>{row.getValue("power")}</div>,
            },

            {
                accessorKey: "ddp",
                filterFn: "includesString",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        DDP
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => <div>{row.getValue("ddp")}</div>,
            },
        ]

        const advancedColumns = showAdvanced
            ? [
                {
                    accessorKey: "fob",
                    header: "FOB",
                    cell: ({ row }) => <div>{row.getValue("fob")}</div>,
                },
                {
                    accessorKey: "fob_bottom",
                    header: "FOB Bottom",
                    cell: ({ row }) => <div>{row.getValue("fob_bottom")}</div>,
                },
                {
                    accessorKey: "ddp_bottom",
                    header: "DDP Bottom",
                    cell: ({ row }) => <div>{row.getValue("ddp_bottom")}</div>,
                },
                {
                    accessorKey: "description",
                    header: "Description",
                    cell: ({ row }) => <div>{row.getValue("description")}</div>,
                },
            ]
            : []

        const adminColumn = isAdmin
            ? [
                {
                    id: "actions",
                    header: "Actions",
                    cell: ({ row }) => (
                        <Button size="sm" onClick={() => handleEditClick(row.original)}>
                            Edit
                        </Button>
                    ),
                },
            ]
            : []

        return [...baseColumns, ...advancedColumns, ...adminColumn]
    },[userID, isAdmin, showAdvanced])

    return (
        <div className="flex flex-1 flex-col space-y-4">
            <div className="flex justify-between flex-wrap">
                <Heading title="Pricing" description="Manage machine pricings" />
            </div>
            {/* <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Price Table</h2>

                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowAdvanced((prev) => !prev)}
                    >
                        {showAdvanced ? "Hide Extra Columns" : "Show Extra Columns"}
                    </Button>
                    {isAdmin && <Button onClick={handleAddClick}>Add New Entry</Button>}
                </div>

            </div>

            <table className="w-full border text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border p-2">Model</th>
                        <th className="border p-2">Power</th>
                        <th className="border p-2">DDP</th>
                        {showAdvanced && (
                            <>
                                <th className="border p-2">FOB</th>
                                <th className="border p-2">FOB Bottom</th>
                                <th className="border p-2">DDP Bottom</th>
                                 <th className="border p-2">Description</th>
                            </>
                        )}
                        {isAdmin && <th className="border p-2">Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => (
                        <tr key={row.id}>
                            <td className="border p-2">{row.model}</td>
                            <td className="border p-2">{row.power}</td>
                            <td className="border p-2">{row.ddp}</td>
                            {showAdvanced && (
                                <>
                                    <td className="border p-2">{row.fob}</td>
                                    <td className="border p-2">{row.fob_bottom}</td>
                                    <td className="border p-2">{row.ddp_bottom}</td>
                                     <td className="border p-2">{row.description}</td>
                                </>
                            )}
                            {isAdmin &&
                                <td className="border p-2">
                                    <Button size="sm" onClick={() => handleEditClick(row)}>
                                        Edit
                                    </Button>
                                </td>
                            }
                        </tr>
                    ))}
                </tbody>
            </table> */}

            <div className="flex flex-1 min-h-[600px]">
                <PageTable
                    loading={loading}
                    columns={columns}
                    data={data}
                    // onRowClick={(val) => {
                    //     setImageURL(val);
                    //     setVisible(true);
                    // }}

                >
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowAdvanced((prev) => !prev)}
                        >
                            {showAdvanced ? "Hide Extra Columns" : "Show Extra Columns"}
                        </Button>
                        {isAdmin && <Button onClick={handleAddClick}>Add New Entry</Button>}
                    </div>
                </PageTable>
            </div>

            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {isEdit ? "Edit Entry" : "Add New Entry"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-3">
                        {Object.keys(emptyForm).map((field, i) => (
                            <div key={i}>
                                <Label className="uppercase">{field.replaceAll("_", " ")}</Label>
                                <Input
                                    placeholder={"Enter " + field.replaceAll("_", " ")}
                                    value={formData[field]}
                                    onChange={(e) =>
                                        setFormData({ ...formData, [field]: e.target.value })
                                    }
                                />
                            </div>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setOpenDialog(false)} variant="outline">
                            Cancel
                        </Button>
                        <Button disabled={loading} onClick={handleSave}>{loading && <Spinner />}Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}