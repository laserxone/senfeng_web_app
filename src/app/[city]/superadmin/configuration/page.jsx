"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { toast } from "@/hooks/use-toast";

export default function SettingsPage() {
    const [industries, setIndustries] = useState([]);
    const [newIndustry, setNewIndustry] = useState("");
    const [lateFine, setLateFine] = useState("");  // ✅ new state
      const [ttRate, setTtRate] = useState("");  // ✅ new state
    const [loading, setLoading] = useState(false);
    const [settings, setSetting] = useState(null);
    const { userID } = useUserDetail();

    // ✅ Fetch settings
    useEffect(() => {
        if (userID) {
            axios.get(`/${userID}/settings`).then((response) => {
                setSetting(response.data);
                const list = response.data.industry_list.map((item) => ({
                    value: item,
                    label: item,
                }));
                setIndustries(list);
                setLateFine(response.data.late_fine || ""); // ✅ set lateFine from backend
                setTtRate(response.data.usd_rate || "")
            });
        }
    }, [userID]);

    // ✅ Remove industry
    const handleRemove = (value) => {
        setIndustries((prev) => prev.filter((i) => i.value !== value));
    };

    // ✅ Add industry
    const handleAdd = () => {
        if (!newIndustry.trim()) return;
        if (industries.some((i) => i.value.toLowerCase() === newIndustry.toLowerCase())) {
            toast({ description: "Industry already exists." });
            return;
        }
        setIndustries((prev) => [...prev, { value: newIndustry, label: newIndustry }]);
        setNewIndustry("");
    };

    // ✅ Save to backend
    const handleSave = async () => {
        setLoading(true);
        try {
            await axios.put(`/${userID}/settings`, {
                id: settings?.id,
                industry_list: industries.map((i) => i.value),
                late_fine: lateFine, // ✅ send lateFine back
                usd_rate : ttRate
            });
            toast({ description: "Settings saved successfully!" });
        } catch (err) {
            console.error(err);
            toast({ description: "Failed to save settings." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <Card className="max-w-xl mx-auto">
                <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                    <CardDescription>Manage your industry list & late fine</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Existing industries */}
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

                    {/* Add new industry */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter new industry"
                            value={newIndustry}
                            onChange={(e) => setNewIndustry(e.target.value)}
                        />
                        <Button onClick={handleAdd}>Add</Button>
                    </div>

                    {/* Late Fine input */}
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

                    {/* Save button */}
                    <Button className="w-full" onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
