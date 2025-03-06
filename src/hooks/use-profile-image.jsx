"use client";
import { storage } from "@/config/firebase";
import { UserContext } from "@/store/context/UserContext";
import { getDownloadURL, ref } from "firebase/storage";
import { useContext, useEffect, useState } from "react";

export const useProfileImage = () => {
  const [profileImage, setProfileImage] = useState(null);
  const { state: UserState } = useContext(UserContext);
  const userDp = UserState?.value?.data?.dp; // Extract `dp` to avoid redundant lookups

  useEffect(() => {
    if (!userDp) {
      setProfileImage(null); // Reset when `dp` is missing
      return;
    }

    if (userDp.includes("http")) {
      setProfileImage(userDp);
    } else {
      getDownloadURL(ref(storage, userDp))
        .then((url) => setProfileImage(url))
        .catch((error) => {
          console.error("Error fetching profile image:", error);
          setProfileImage(null);
        });
    }
  }, [userDp]); // Optimized dependency array

  return profileImage;
};
