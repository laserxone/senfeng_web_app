"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, GripVertical, Users, ChevronRight, Building2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import axios from "@/lib/axios"
import useUserDetail from "@/hooks/use-user-detail"
import { UserSearch } from "@/components/shared/search/user-search"
import { ScrollArea } from "@/components/ui/scroll-area"
import Heading from "@/components/ui/heading"

type User = {
    id: number
    name: string
    email: string
    designation: string

}

type Approver = {
    id: number
    user_id: number
    approval_order: number
    user_name: string
    user_email: string
    user_designation: string
}

type Hierarchy = {
    id: number
    name: string
    hierarchy_type: string
    description: string | null
    is_active: boolean
    approvers: Approver[] | null
    created_at: string
}


export default function HierarchyPage() {


    const [hierarchies, setHierarchies] = useState<Hierarchy[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [hierarchyName, setHierarchyName] = useState("")
    const [hierarchyDescription, setHierarchyDescription] = useState("")
    const [selectedApprovers, setSelectedApprovers] = useState<number[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
    const [hierarchyType, setHierarchyType] = useState("loan")
    const { userID } = useUserDetail()

    useEffect(() => {

        if (userID) {
            fetchData()
            fetchUsers()
        }

    }, [userID])

    async function fetchData() {

        try {
            const res = await axios.get(`/${userID}/hierarchies`)
            setHierarchies(res.data)
        } finally {

        }
    }

    async function fetchUsers() {

        try {
            const res = await axios.get(`/${userID}/hierarchies/users`)
            setUsers(res.data)
        } finally {

        }
    }


    const handleAddApprover = (userId: string | null) => {
        if(!userId) return
        const id = parseInt(userId)
        if (!selectedApprovers.includes(id)) {
            setSelectedApprovers([...selectedApprovers, id])
        }
    }

    const handleRemoveApprover = (userId: number) => {
        setSelectedApprovers(selectedApprovers.filter((id) => id !== userId))
    }

    const handleDragStart = (index: number) => {
        setDraggedIndex(index)
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        if (draggedIndex === null || draggedIndex === index) return

        const newApprovers = [...selectedApprovers]
        const draggedItem = newApprovers[draggedIndex]
        newApprovers.splice(draggedIndex, 1)
        newApprovers.splice(index, 0, draggedItem)
        setSelectedApprovers(newApprovers)
        setDraggedIndex(index)
    }

    const handleDragEnd = () => {
        setDraggedIndex(null)
    }

    const handleSubmit = async () => {
        if (!hierarchyName || selectedApprovers.length === 0) return

        setIsSubmitting(true)
        try {
            await axios.post(`/${userID}/hierarchies`, {
                name: hierarchyName,
                description: hierarchyDescription,
                hierarchy_type: hierarchyType,
                approvers: selectedApprovers,
            })

            await fetchData()
            setIsDialogOpen(false)
            setHierarchyName("")
            setHierarchyDescription("")
            setSelectedApprovers([])

        } catch (error) {
            console.error("Error creating hierarchy:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteHierarchy = async (id: number) => {
        if (!confirm("Are you sure you want to delete this hierarchy?")) return

        try {
            await axios.delete(`/${userID}/hierarchies/${id}`)
            await fetchData()

        } catch (error) {
            console.error("Error deleting hierarchy:", error)
        }
    }

    const getSelectedUserDetails = (userId: number) => {
        return users?.find((user) => user.id === userId)
    }

    return (
        <div className="flex flex-1 flex-col space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                <Heading panel title="Approval Hierarchies" description="Create and manage approval workflows for loan applications" />
                <Button onClick={() => setIsDialogOpen(true)} >
                    <Plus className="size-4" />
                    Create Hierarchy
                </Button>
            </div>

            {!hierarchies ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="h-5 bg-muted rounded w-2/3" />
                                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="h-10 bg-muted rounded" />
                                    <div className="h-10 bg-muted rounded" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : hierarchies.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Users className="size-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-1">No hierarchies yet</h3>
                        <p className="text-muted-foreground text-center max-w-sm mb-4">
                            Create your first approval hierarchy to start processing loan applications.
                        </p>
                        <Button
                            onClick={() => setIsDialogOpen(true)}
                            className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                        >
                            <Plus className="size-4" />
                            Create Hierarchy
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {hierarchies.map((hierarchy) => (
                        <Card key={hierarchy.id} className="group relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{hierarchy.name}</CardTitle>
                                        <CardDescription className="mt-1">
                                            {hierarchy.description || "No description provided"}
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteHierarchy(hierarchy.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                                <Badge variant="secondary" className="w-fit mt-2">
                                    {hierarchy.hierarchy_type.charAt(0).toUpperCase() + hierarchy.hierarchy_type.slice(1)} Approval
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm font-medium text-muted-foreground mb-3">
                                    Approval Flow ({hierarchy.approvers?.length || 0} approvers)
                                </p>
                                <div className="space-y-2">
                                    {hierarchy.approvers?.map((approver, index) => (
                                        <div key={approver.id} className="flex items-center gap-2">
                                            <div className="flex items-center justify-center size-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium flex-shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0 flex items-center gap-2 p-2 rounded-md bg-muted/50">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{approver.user_name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span className="truncate">{approver.user_designation}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              
              
                    <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-xl">
                        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
                            <DialogTitle className="text-sm font-semibold text-foreground">Create Approval Hierarchy</DialogTitle>
                            <DialogDescription>
                                Set up a new approval workflow. The order of approvers determines the approval sequence.
                            </DialogDescription>
                        </DialogHeader>
                           <ScrollArea className="max-h-[calc(100dvh-132px)]">

                        <div className="space-y-3 p-3.5 pb-4">
                            <Field>
                                <FieldLabel>Hierarchy Name</FieldLabel>
                                <Input
                                    placeholder="e.g., Standard Loan Approval"
                                    value={hierarchyName}
                                    onChange={(e) => setHierarchyName(e.target.value)}
                                />
                            </Field>

                            {/* <Field>
                                <FieldLabel>Hierarchy Type</FieldLabel>
                                <Select
                                    onValueChange={setHierarchyType}
                                    value={hierarchyType}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>

                                        <SelectItem value={"loan"}>Loan
                                        </SelectItem>
                                        <SelectItem value={"reimbursement"}>Reimbursement
                                        </SelectItem>


                                    </SelectContent>
                                </Select>
                            </Field> */}

                            <Field>
                                <FieldLabel>Description (Optional)</FieldLabel>
                                <Input
                                    placeholder="Describe when this hierarchy should be used"
                                    value={hierarchyDescription}
                                    onChange={(e) => setHierarchyDescription(e.target.value)}
                                />
                            </Field>

                            <Field>
                                <FieldLabel>Add Approvers</FieldLabel>
                                <UserSearch onReturn={(val) => handleAddApprover(val?.toString() ?? null)} />
                            </Field>

                            {selectedApprovers.length > 0 && (
                                <div className="space-y-3">
                                    <FieldLabel className="flex items-center gap-2">
                                        <Users className="size-4 text-emerald-600" />
                                        Approval Order (Drag to reorder)
                                    </FieldLabel>
                                    <div className="space-y-2">
                                        {selectedApprovers.map((userId, index) => {
                                            const user = getSelectedUserDetails(userId)
                                            if (!user) return null
                                            return (
                                                <div
                                                    key={userId}
                                                    draggable
                                                    onDragStart={() => handleDragStart(index)}
                                                    onDragOver={(e) => handleDragOver(e, index)}
                                                    onDragEnd={handleDragEnd}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all cursor-move",
                                                        draggedIndex === index && "opacity-50 border-emerald-500"
                                                    )}
                                                >
                                                    <GripVertical className="size-5 text-muted-foreground flex-shrink-0" />
                                                    <div className="flex items-center justify-center size-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-medium flex-shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">{user.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {user.designation}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveApprover(userId)}
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Approver 1 will receive the application first. Once approved, it moves to Approver 2, and so on.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!hierarchyName || selectedApprovers.length === 0 || isSubmitting}
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                            >
                                {isSubmitting ? "Creating..." : "Create Hierarchy"}
                            </Button>
                        </div>
                        </ScrollArea>
                    </DialogContent>
               
            </Dialog>
        </div>
    )
}
