import admin from "./firebaseAdmin";


export default async function DeleteStorageBackend(img: string | null) {
    if (!img || img.includes("http")) return
    try {
        const bucket = admin.storage().bucket()
        await bucket.file(img).delete()
    } catch (error) {
        console.log(error)
    }
} 