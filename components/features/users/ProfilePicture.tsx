"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { storage } from "@/config/firebase";
import { getDownloadURL, ref } from "firebase/storage";
import { useEffect, useState } from "react";

const ProfilePictureTeam = ({
  img = "",
  name = "",
  loading,
}: {
  img?: string;
  name?: string;
  loading?: boolean;
}) => {
  const [localImage, setLocalImage] = useState<string | null>(null);

  useEffect(() => {
    if (img) {
      if (img.includes("http")) {
        setLocalImage(img);
      } else {
        fetchImage(img);
      }
    }
  }, [img]);

  async function fetchImage(img: string) {
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
          <Avatar className="h-[100px] w-[100px]">
            {localImage && <AvatarImage src={localImage || ""} />}
            <AvatarFallback>{name?.substring(0, 2)}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </>
  );
};

export default ProfilePictureTeam;
