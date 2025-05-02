import { storage } from "@/config/firebase";
import { toast } from "@/hooks/use-toast";
import { deleteObject, ref } from "firebase/storage";


export async function DeleteFromStorage(name) {
    try {
        const deleteRef = ref(storage, name)
        await deleteObject(deleteRef)

        return ("done")
    } catch (error) {
        toast({
            title: error.message || "Error",
            description: "Error deleting file from storage",
            variant: "destructive",
        })

        throw new Error("Error deleting file from storage")
    }

} 