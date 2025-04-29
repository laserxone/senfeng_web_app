import { storage } from "@/config/firebase";
import { getDownloadURL, ref } from "firebase/storage";


export async function GetProfileImage(imgLink) {
    if (!imgLink) return null;

    try {
        const url = await getDownloadURL(ref(storage, imgLink));
        return url;
    } catch (error) {
        console.error("Error fetching profile image:", error);
        return null;
    }
}