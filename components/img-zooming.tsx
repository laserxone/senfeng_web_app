"use client"

import { storage } from "@/config/firebase"
import { getDownloadURL, ref } from "firebase/storage"
import { useEffect, useState } from "react"
import Zoom from "react-medium-image-zoom"
import "react-medium-image-zoom/dist/styles.css"
import Spinner from "./ui/spinner"
import Image from "next/image"
import { cn } from "@/lib/utils"

export const MyImgZooming = ({
  img,
  compact = false,
  className = undefined
}: {
  img: string
  compact?: boolean
  className ?: string
}) => {
  const [remoteImage, setRemoteImage] = useState<{
    key: string
    url: string
    error: boolean
  } | null>(null)

  useEffect(() => {
    if (!img || img.includes("http")) {
      return
    }

    let active = true

    getDownloadURL(ref(storage, img))
      .then((url) => {
        if (active) {
          setRemoteImage({ key: img, url, error: false })
        }
      })
      .catch((e) => {
        console.log("error loading image", e)
        if (active) {
          setRemoteImage({ key: img, url: "", error: true })
        }
      })

    return () => {
      active = false
    }
  }, [img])

  const localImage = img?.includes("http")
    ? img
    : remoteImage?.key === img
      ? remoteImage.url
      : ""
  const error =
    !img?.includes("http") && remoteImage?.key === img && remoteImage.error
  const loading = !!img && !img.includes("http") && remoteImage?.key !== img

  if (loading) return <Spinner />
  if (!img || !localImage) return <p>No image</p>
  if (error) return <p>Failed to load image</p>

  return (
    <Zoom>
      <Image
        alt="image"
        src={localImage}
        width={compact ? 96 : 180}
        height={compact ? 48 : 100}
        unoptimized
        className={cn(
          "w-auto object-contain",
          compact ? "h-12 max-w-full" : "h-[100px]",
          className
        )}
      />
    </Zoom>
  )
}