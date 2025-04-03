"use client"

import { storage } from "@/config/firebase";
import { getDownloadURL, ref } from "firebase/storage";
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const ProfilePicture = ({ img = "", name = "", loading }) => {
  const [localImage, setLocalImage] = useState(null);
  

  useEffect(() => {
    if (img) {
      if (img.includes("http")) {
        setLocalImage(img);
      
      } else {
        fetchImage(img);
      }
    }
  }, [img]);

  async function fetchImage(img) {
    try {
      const storageRef = ref(storage, img);
      const url = await getDownloadURL(storageRef);
      setLocalImage(url);
    } catch (error) {
      console.log(error);
    } 
  }


  return (
    <>
      <div className="flex items-center space-x-4">
        {loading ? (
          <Skeleton className="h-[100px] w-[100px]" />
        ) : (
          <Avatar
            className="h-[100px] w-[100px]"
          >
            <AvatarImage src={localImage} />
            <AvatarFallback>{name?.substring(0, 2)}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </>
  );
};

export default ProfilePicture
