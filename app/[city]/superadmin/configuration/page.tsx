"use client";

import { Button } from "@/components/ui/button";
import {
    CardContent
} from "@/components/ui/card";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import Heading from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";


export default function SettingsPage() {
    const [industries, setIndustries] = useState<{ value: string, label: string }[]>([]);
    const [newIndustry, setNewIndustry] = useState("");
    const [newModel, setNewModel] = useState("");
    const [lateFine, setLateFine] = useState("");
    const [ttRate, setTtRate] = useState("");
    const [loading, setLoading] = useState(false);
    const [settings, setSetting] = useState<{ id: number } | null>(null);
    const { userID } = useUserDetail();
    const [machineModels, setMachineModels] = useState<{ value: string, label: string }[]>([])


    useEffect(() => {
        if (userID) {
            axios.get(`/${userID}/settings`).then((response) => {
                setSetting(response.data);
                const list = response.data.industry_list.map((item: string) => ({
                    value: item,
                    label: item,
                }));
                setIndustries(list);
                setLateFine(response.data.late_fine || "");
                setTtRate(response.data.usd_rate || "")
                const modelList = response.data?.machine_models?.map((item: string) => ({
                    value: item,
                    label: item
                }))
                setMachineModels(modelList)
            });
        }
    }, [userID]);


    const handleRemove = (value: string) => {
        setIndustries((prev) => prev.filter((i) => i.value !== value));
    };


    const handleAdd = () => {
        if (!newIndustry.trim()) return;
        if (industries.some((i) => i.value.toLowerCase() === newIndustry.toLowerCase())) {
            toast.info("Industry already exists.")
            return;
        }
        setIndustries((prev) => [...prev, { value: newIndustry, label: newIndustry }]);
        setNewIndustry("");
    };

    const handleRemoveModel = (value: string) => {
        setMachineModels((prev) => prev.filter((i) => i.value !== value));
    };


    const handleAddModel = () => {
        if (!newModel.trim()) return;
        if (machineModels.some((i) => i.value.toLowerCase() === newModel.toLowerCase())) {
            toast.info("Machine model already exists.")
            return;
        }
        setMachineModels((prev) => [...prev, { value: newModel, label: newModel }]);
        setNewModel("");
    };



    const handleSave = async () => {
        setLoading(true);
        try {
            await axios.put(`/${userID}/settings`, {
                id: settings?.id,
                industry_list: industries.map((i) => i.value),
                machine_models: machineModels.map((i) => i.value),
                late_fine: lateFine,
                usd_rate: ttRate
            });

            toast.success("Settings saved successfully!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-1 flex-col space-y-4">
            <div className="flex items-start justify-between">
                <Heading title="Configuration" description="Configure your app settings" />
            </div>
            <CardContent className="space-y-5">
                <FieldSet className="rounded-lg border p-4">
                    <FieldLegend className="px-2 text-sm font-medium">
                        Industries
                    </FieldLegend>

                    <div className="mt-3 space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {industries.map((item) => (
                                <RenderEachItem key={item.value} item={item} onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(item.value);
                                }} />
                            ))}

                            {industries.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No industries added yet.
                                </p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter new industry"
                                value={newIndustry}
                                onChange={(e) => setNewIndustry(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleAdd();
                                }}
                            />

                            <Button onClick={handleAdd}>Add</Button>
                        </div>
                    </div>
                </FieldSet>

                <FieldSet className="rounded-lg border p-4">
                    <FieldLegend className="px-2 text-sm font-medium">
                        Machine Models
                    </FieldLegend>

                    <div className="mt-3 space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {machineModels.map((item) => (
                                <RenderEachItem key={item.value} item={item} onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveModel(item.value);
                                }} 
                                />
                            ))}

                            {machineModels.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No machine models added yet.
                                </p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter new model"
                                value={newModel}
                                onChange={(e) => setNewModel(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleAddModel();
                                }}
                            />

                            <Button onClick={handleAddModel}>Add</Button>
                        </div>
                    </div>
                </FieldSet>

                <FieldSet className="rounded-lg border p-4">
                    <FieldLegend className="px-2 text-sm font-medium">
                        Financial Settings
                    </FieldLegend>

                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Late Fine</label>
                            <Input
                                type="number"
                                placeholder="Enter late fine"
                                value={lateFine}
                                onChange={(e) => setLateFine(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">USD Rate</label>
                            <Input
                                type="number"
                                placeholder="Enter USD rate"
                                value={ttRate}
                                onChange={(e) => setTtRate(e.target.value)}
                            />
                        </div>
                    </div>
                </FieldSet>

                <Button className="w-full" onClick={handleSave} disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
            </CardContent>
        </div>
    );
}

const RenderEachItem = ({ item, onClick }: { item: { value: string, label: string }, onClick: (e: React.MouseEvent<HTMLButtonElement>) => void }) => {

    return (
        <div
            className="
    inline-flex items-center gap-2
    rounded-md border
    bg-muted/40
    px-3 py-1.5
    text-sm font-medium
    transition-colors
    hover:bg-muted
  "
        >
            <span>{item.label}</span>

            <button
                type="button"
                className="
      flex h-4 w-4 items-center justify-center
      rounded-sm
      transition-colors
      hover:bg-destructive/10
      hover:text-destructive
    "
                onClick={onClick}
               
            >
                <X className="h-3 w-3" />
            </button>
        </div>
    )
}
