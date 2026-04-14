import { storage } from "@/config/firebase";
import { ref, uploadString } from "firebase/storage";

export default async function UploadImageForMobile(image, fileName) {
    const base64 = image.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
    return new Promise(async (resolve, reject) => {
        try {

            const storageRef = ref(storage, fileName);

            await uploadString(storageRef, base64, "base64", { contentType: "image/png" });
            resolve(true);
        } catch (error) {
            console.log(error)
            reject(null)
        }

    })

}