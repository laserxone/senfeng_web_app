import { storage } from "@/config/firebase";
import { deleteObject, ref } from "firebase/storage";


export async function DeleteFromStorage(name) {
    try {
        const deleteRef = ref(storage, name)
        const response = await deleteObject(deleteRef)
      
        return ("done")
    } catch (error) {
        console.log(error)
    }

} 