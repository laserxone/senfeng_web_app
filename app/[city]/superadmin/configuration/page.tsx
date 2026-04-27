"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
    const [lateFine, setLateFine] = useState("");
    const [ttRate, setTtRate] = useState("");
    const [loading, setLoading] = useState(false);
    const [settings, setSetting] = useState<{ id: number } | null>(null);
    const { userID } = useUserDetail();


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


    const handleSave = async () => {
        setLoading(true);
        try {
            await axios.put(`/${userID}/settings`, {
                id: settings?.id,
                industry_list: industries.map((i) => i.value),
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
            <Card >
                <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                    <CardDescription>Manage your industry list & late fine</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                    <div className="flex flex-wrap gap-2">
                        {industries.map((item) => (
                            <Badge
                                key={item.value}
                                variant="secondary"
                                className="flex items-center gap-1 px-3 py-1"
                            >
                                {item.label}
                                <X
                                    className="w-3 h-3 cursor-pointer"
                                    onClick={() => handleRemove(item.value)}
                                />
                            </Badge>
                        ))}
                        {industries.length === 0 && (
                            <p className="text-sm text-muted-foreground">No industries added yet.</p>
                        )}
                    </div>


                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter new industry"
                            value={newIndustry}
                            onChange={(e) => setNewIndustry(e.target.value)}
                        />
                        <Button onClick={handleAdd}>Add</Button>
                    </div>

                        <div className="flex gap-4 flex-wrap">

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Late Fine</label>
                        <Input
                            type="number"
                            placeholder="Enter late fine"
                            value={lateFine}
                            onChange={(e) => setLateFine(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">USD rate</label>
                        <Input
                            type="number"
                            placeholder="Enter USD rate"
                            value={ttRate}
                            onChange={(e) => setTtRate(e.target.value)}
                        />
                    </div>
                    </div>


                    <Button className="w-full" onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
