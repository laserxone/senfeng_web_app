import { toast } from "@/hooks/use-toast";
import { ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "../config/firebase";

export function UploadImage(image, name, contentType = "image/png") {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(image);
      const blob = await response.blob();

      const metadata = {
        contentType: contentType,
      };

      const storageRef = ref(storage, name);
      const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload is " + progress + "% done");

          if (snapshot.state === "paused") {
            console.log("Upload is paused");
          } else if (snapshot.state === "running") {
            console.log("Upload is running");
          }
        },
        (error) => reject(error), // Reject on error
        async () => {
          try {
            console.log(uploadTask.snapshot.ref)
            resolve(uploadTask.snapshot.ref); // Resolve with the file URL
          } catch (error) {
            reject(error);
          }
        }
      );
    } catch (error) {
      toast({
        variant : "destructive",
        title : "Error",
        description : error?.message || "Unabe to upload image"
      })
      reject(error);
    }
  });
}
