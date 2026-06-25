"use client";

import axios from "@/lib/axios";
import { useCallback, useEffect, useState } from "react";

import Dropzone from "@/components/dropzone";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CustomerSearch } from "../customer-search";
import { FieldLegend, FieldSet } from "../ui/field";
import { ScrollArea } from "../ui/scroll-area";
import { UserSearch } from "../user-search";

type Props = {
    open: boolean;

    onClose: () => void;
    userId?: number;
    userDesignation?: string;
    fetchData: () => Promise<void>
};

const OFFICE_COORDS = { lat: 31.587590571462428, lon: 74.41925907140265 };
const KARACHI_OFFICE_COORDS = { lat: 24.902874916172255, lon: 67.00292730924929 };
const ALLOWED_DISTANCE = 200;

export default function RenderMarkAttendance({
    open,

    onClose,
    userId,
    userDesignation,
    fetchData
}: Props) {
    const [note, setNote] = useState("");
    const [task, setTask] = useState("");
    const [reason, setReason] = useState<"Office" | "Visit">("Office");

    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [mapsUrl, setMapsUrl] = useState("");
    const [imageFile, setImageFile] = useState<File | null | Blob>(null);
    const [imagePreview, setImagePreview] = useState("");
    const [selectedUser, setSelectedUser] = useState<number | null>(null)
    const [selectedCustomer, setSelectedCustomer] = useState<number | string | null>(null);
    const [saveLoading, setSaveLoading] = useState(false);
    const [mainError, setMainError] = useState("");
    const [office, setOffice] = useState(true);

    const [errors, setErrors] = useState({
        note: "",
        task: "",
        image: "",
        customer: "",
        latitude: "",
        longitude: "",
    });

    const validate = useCallback(() => {
        const nextErrors = {
            note: "",
            task: "",
            image: "",
            customer: "",
            latitude: "",
            longitude: "",
        };

        let hasError = false;

        if (!note.trim()) {
            nextErrors.note = "Note is required";
            hasError = true;
        }

        if (!task.trim()) {
            nextErrors.task = "Task is required";
            hasError = true;
        }

        if (!imageFile) {
            nextErrors.image = "Image is required";
            hasError = true;
        }

        if (!latitude.trim()) {
            nextErrors.latitude = "Latitude is required";
            hasError = true;
        }

        if (!longitude.trim()) {
            nextErrors.longitude = "Longitude is required";
            hasError = true;
        }

        if (reason === "Visit" && !selectedCustomer) {
            nextErrors.customer = "Customer is required";
            hasError = true;
        }

        setErrors(nextErrors);
        return !hasError;
    }, [note, task, imageFile, latitude, longitude, reason, selectedCustomer]);

    useEffect(() => {
        if (!latitude || !longitude) return;


        const nearMainOffice =
            calculateDistance(latitude, longitude, OFFICE_COORDS.lat, OFFICE_COORDS.lon) <= ALLOWED_DISTANCE;
        const nearKarachiOffice =
            calculateDistance(latitude, longitude, KARACHI_OFFICE_COORDS.lat, KARACHI_OFFICE_COORDS.lon) <= ALLOWED_DISTANCE;

        setOffice(nearMainOffice || nearKarachiOffice);
    }, [latitude, longitude]);

    const handleExtractCoordinates = useCallback(() => {
        setMainError("");

        const coords = extractCoordinatesFromGoogleMapsUrl(mapsUrl);

        if (!coords) {
            setMainError("Could not extract coordinates from this Google Maps URL");
            return;
        }

        setLatitude(coords.latitude);
        setLongitude(coords.longitude);

        setErrors((prev) => ({
            ...prev,
            latitude: "",
            longitude: "",
        }));
    }, [mapsUrl]);

    const clearForm = useCallback(() => {
        setNote("");
        setMapsUrl("")
        setTask("");
        setReason("Office");
        setLatitude("");
        setLongitude("");
        setImageFile(null);
        setImagePreview("");
        setSelectedCustomer(null);
        setMainError("");
        setErrors({
            note: "",
            task: "",
            image: "",
            customer: "",
            latitude: "",
            longitude: "",
        });
    }, []);

    const handleSubmit = async () => {

        if (!validate() || !imageFile || !selectedUser) return;

        setSaveLoading(true);
        setMainError("");

        console.log(imageFile)

        try {

            const base64 = await convertToBase64(imageFile as File);
            const form: {
                note: string,
                task: string
                image: string
                reason: string
                location: [number, number]
                customer_id?: number | string | null
            } = {
                "note": note,
                "task": task,
                "image": base64,
                "reason": reason,
                location: [parseFloat(latitude || "0"), parseFloat(longitude || "0")],
                customer_id: undefined
            }

            if (reason === "Visit") {
                form.customer_id = selectedCustomer
            }

            console.log(form)
            await axios.post(`/${selectedUser}/attendance`, form);
            clearForm();
            onClose();
            await fetchData()

        } catch (error: any) {
            console.log(error)
            setMainError(error?.message || error?.response?.data?.message || "Failed to submit attendance");
        } finally {
            setSaveLoading(false);
        }
    }

    const notAllowed = office ? reason !== "Office" : reason === "Office";

   console.log(office)
function handleClose(){
    clearForm()
    onClose()
}
    return (

        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="w-full sm:max-w-lg p-0">
                <DialogHeader className="px-6 pt-6 pb-3">
                    <DialogTitle>Mark Attendance</DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(100dvh-200px)] px-6 pb-6">
                    <div className="space-y-5">
                        {/* 1. Location */}
                        <FieldSet className="rounded-lg border p-4">
                            <FieldLegend className="px-2 text-sm font-medium">
                                Location
                            </FieldLegend>

                            <div className="mt-3 space-y-4">
                                <div className="space-y-2">
                                    <Label>Google Maps URL</Label>

                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <Input
                                            value={mapsUrl}
                                            onChange={(e) => setMapsUrl(e.target.value)}
                                            placeholder="Paste Google Maps URL"
                                            className="flex-1"
                                        />

                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={handleExtractCoordinates}
                                            className="sm:w-28"
                                        >
                                            Extract
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Latitude</Label>
                                        <Input
                                            value={latitude}
                                            readOnly
                                            placeholder="24.8607"
                                            className="bg-muted"
                                        />
                                        {errors.latitude && (
                                            <p className="text-xs text-destructive">
                                                {errors.latitude}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Longitude</Label>
                                        <Input
                                            value={longitude}
                                            readOnly
                                            placeholder="67.0011"
                                            className="bg-muted"
                                        />
                                        {errors.longitude && (
                                            <p className="text-xs text-destructive">
                                                {errors.longitude}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </FieldSet>

                        {/* 2. User */}
                        <FieldSet className="rounded-lg border p-4">
                            <FieldLegend className="px-2 text-sm font-medium">
                                User
                            </FieldLegend>

                            <div className="mt-3 space-y-2">
                                <Label>Select User</Label>
                                <UserSearch
                                    value={selectedUser}
                                    onReturn={(val) => setSelectedUser(val)}
                                />
                            </div>
                        </FieldSet>

                        {/* 3. Attendance Type */}
                        <FieldSet className="rounded-lg border p-4">
                            <FieldLegend className="px-2 text-sm font-medium">
                                Attendance Type
                            </FieldLegend>

                            <RadioGroup
                                value={reason}
                                onValueChange={(value) =>
                                    setReason(value as "Office" | "Visit")
                                }
                                className="mt-3 grid grid-cols-2 gap-3"
                            >
                                <Label
                                    htmlFor="office"
                                    className="flex cursor-pointer items-center gap-2 rounded-md border p-3"
                                >
                                    <RadioGroupItem value="Office" id="office" />
                                    Office
                                </Label>

                                <Label
                                    htmlFor="visit"
                                    className="flex cursor-pointer items-center gap-2 rounded-md border p-3"
                                >
                                    <RadioGroupItem value="Visit" id="visit" />
                                    Visit
                                </Label>
                            </RadioGroup>
                        </FieldSet>

                        {!longitude ? null :

                        notAllowed ? (
                            <div className="rounded-lg border border-dashed p-4">
                                <p className="text-sm italic text-muted-foreground">
                                    Attendance is not allowed outside office area
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* 4. Attendance Details */}
                                <FieldSet className="rounded-lg border p-4">
                                    <FieldLegend className="px-2 text-sm font-medium">
                                        Attendance Details
                                    </FieldLegend>

                                    <div className="mt-3 space-y-4">
                                        <div className="space-y-2">
                                            <Label>Note</Label>
                                            <Input
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                                placeholder="Enter a note"
                                            />
                                            {errors.note && (
                                                <p className="text-xs text-destructive">
                                                    {errors.note}
                                                </p>
                                            )}
                                        </div>

                                        {reason === "Visit" && (
                                            <div className="space-y-2">
                                                <Label>Customer</Label>
                                                <CustomerSearch
                                                    value={selectedCustomer}
                                                    onReturn={(val) =>
                                                        setSelectedCustomer(val)
                                                    }
                                                />
                                                {errors.customer && (
                                                    <p className="text-xs text-destructive">
                                                        {errors.customer}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label>Task</Label>
                                            <Input
                                                value={task}
                                                onChange={(e) => setTask(e.target.value)}
                                                placeholder="Enter task"
                                            />
                                            {errors.task && (
                                                <p className="text-xs text-destructive">
                                                    {errors.task}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </FieldSet>

                                {/* 5. Image Upload */}
                                <FieldSet className="rounded-lg border p-4">
                                    <FieldLegend className="px-2 text-sm font-medium">
                                        Image Upload
                                    </FieldLegend>

                                    <div className="mt-3 space-y-3 flex justify-center">
                                        <Dropzone
                                            value={imagePreview}
                                            onDrop={(file) => setImagePreview(file)}
                                            onDropFile={(file)=> setImageFile(file)}
                                            title="Click to upload"
                                            subheading="or drag and drop"
                                            description="PNG or JPG"
                                            drag="Drop the files here..."
                                        />

                                        {errors.image && (
                                            <p className="text-xs text-destructive">
                                                {errors.image}
                                            </p>
                                        )}
                                    </div>
                                </FieldSet>

                                {mainError && (
                                    <p className="text-sm text-destructive">
                                        {mainError}
                                    </p>
                                )}

                                <Button
                                    onClick={handleSubmit}
                                    disabled={saveLoading}
                                    className="w-full"
                                >
                                    {saveLoading ? "Submitting..." : "Submit"}
                                </Button>
                            </>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>

    );
}

const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.readAsDataURL(file);

        reader.onload = () => {
            resolve(reader.result as string);
        };

        reader.onerror = (error) => {
            reject(error);
        };
    });
};




const extractCoordinatesFromGoogleMapsUrl = (url: string) => {
    const patterns = [
        /@(-?\d+\.\d+),(-?\d+\.\d+)/,
        /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
        /q=(-?\d+\.\d+),(-?\d+\.\d+)/,
        /ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);

        if (match?.[1] && match?.[2]) {
            return {
                latitude: match[1],
                longitude: match[2],
            };
        }
    }

    return null;
};

function calculateDistance(lat1: any, lon1: any, lat2: any, lon2: any) {
    const earthRadius = 6371000; // Earth's radius in meters (approximately)

    // Convert latitude and longitude from degrees to radians
    const lat1Rad = (Math.PI / 180) * lat1;
    const lon1Rad = (Math.PI / 180) * lon1;
    const lat2Rad = (Math.PI / 180) * lat2;
    const lon2Rad = (Math.PI / 180) * lon2;

    // Haversine formula
    const dLat = lat2Rad - lat1Rad;
    const dLon = lon2Rad - lon1Rad;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Calculate the distance
    const distance = earthRadius * c;

    return distance;
}