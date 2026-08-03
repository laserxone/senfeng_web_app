import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GetProfileImage } from "@/lib/getProfileImage"
import { cn } from "@/lib/utils"

export const ProfilePicture = ({
  img,
  name,
  className = "",
}: {
  img?: string
  name?: string
  className?: string
}) => {
  const [localImage, setLocalImage] = useState<string | null>(null)

  useEffect(() => {
    async function fetchImage() {
      if (img?.includes("http")) {
        setLocalImage(img)
      } else {
        const imgResult = await GetProfileImage(img)
        setLocalImage(imgResult)
      }
    }

    if (img) {
      fetchImage()
    } else {
      setLocalImage(null)
    }
  }, [img])

  return (
    <Avatar className={cn("mr-4 h-24 w-24", className)}>
      {localImage && (
        <AvatarImage src={localImage || ""} alt="Profile Picture" />
      )}
      <AvatarFallback>{name?.substring(0, 2)}</AvatarFallback>
    </Avatar>
  )
}
