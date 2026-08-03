"use client"
import { storage } from "@/config/firebase"
import { getDownloadURL, ref } from "firebase/storage"
import { useEffect, useState } from "react"
import useUserDetail from "./use-user-detail"

export const useProfileImage = () => {
  const [profileImage, setProfileImage] = useState("")
  const { userDp } = useUserDetail()

  useEffect(() => {
    if (!userDp) {
      setProfileImage("")
      return
    }

    if (userDp.includes("http")) {
      setProfileImage(userDp)
    } else {
      getDownloadURL(ref(storage, userDp))
        .then((url) => setProfileImage(url))
        .catch((error) => {
          console.error("Error fetching profile image:", error)
          setProfileImage("")
        })
    }
  }, [userDp])

  return profileImage
}
