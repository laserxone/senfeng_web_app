import { storage } from "@/config/firebase";
import { getDownloadURL, ref } from "firebase/storage";


export async function GetProfileImage(imgLink : string | null | undefined) {
    if (!imgLink) return null;

    try {
        const url = await getDownloadURL(ref(storage, imgLink));
        return url;
    } catch (error) {
        console.log("Error fetching profile image:", error);
        return null;
    }
}