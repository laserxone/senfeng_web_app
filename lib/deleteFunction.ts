import { storage } from "@/config/firebase";
import { deleteObject, ref } from "firebase/storage";
import { toast } from "sonner";

export async function DeleteFromStorage(name: string) {
  try {
    const deleteRef = ref(storage, name);
    await deleteObject(deleteRef);
    return "done";
  } catch (error: any) {
    if (error?.message?.includes("object-not-found")) return "done";
    toast.success(error?.message || "Error");
    throw new Error("Error deleting file from storage");
  }
}
