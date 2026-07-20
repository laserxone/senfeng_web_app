"use client"

import { storage } from "@/config/firebase";
import { cn } from "@/lib/utils";
import { getDownloadURL, ref } from "firebase/storage";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import "react-medium-image-zoom/dist/styles.css";

export const MyImgZooming = ({
  img,
  compact = false,
  className = undefined,
  fill = false,
}: {
  img: string | null;
  compact?: boolean;
  className?: string;
  fill?: boolean;
}) => {
  const [remoteImage, setRemoteImage] = useState<{
    key: string;
    url: string;
    error: boolean;
  } | null>(null);



  const [isZoomed, setIsZoomed] = useState(false);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!img || img.includes("http")) return;

    let active = true;

    getDownloadURL(ref(storage, img))
      .then((url) => {
        if (active) setRemoteImage({ key: img, url, error: false });
      })
      .catch((e) => {
        console.log("error loading image", e);
        if (active) setRemoteImage({ key: img, url: "", error: true });
      });

    return () => {
      active = false;
    };
  }, [img]);

  const localImage = img?.includes("http")
    ? img
    : remoteImage?.key === img
      ? remoteImage.url
      : "";

  const error =
    !img?.includes("http") && remoteImage?.key === img && remoteImage.error;

  const loading = !!img && !img.includes("http") && remoteImage?.key !== img;

  const handleZoomChange = useCallback((shouldZoom: boolean) => {
    setIsZoomed(shouldZoom);
  }, []);

  const rotateImageRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const rotateImageLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const onPressClose = () => {
    setIsZoomed(false);
  };

  if (loading) return <Spinner />;
  if (!img || !localImage) return <p>No image</p>;
  if (error) return <p>Failed to load image</p>;

  const normalImage = fill ? (
    <Image
      style={{ cursor: "zoom-in" }}
      alt="image"
      src={localImage}
      fill
      unoptimized
      className={cn(
        "w-auto cursor-zoom-in object-contain",
        compact ? "h-12 max-w-full" : "h-[100px]",
        className
      )}
    />
  ) : (
    <Image
      alt="image"
      style={{ cursor: "zoom-in" }}
      src={localImage}
      width={compact ? 96 : 180}
      height={compact ? 48 : 100}
      unoptimized
      className={cn(
        "w-auto cursor-zoom-in object-contain",
        compact ? "h-12 max-w-full" : "h-[100px]",
        className
      )}
    />
  );

  return (
    <ControlledZoom
      isZoomed={isZoomed}
      onZoomChange={handleZoomChange}
      ZoomContent={({ img }) =>
        isZoomed ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              width: "100vw",
              height: "100vh",
              overflow: "hidden",
              zIndex: 9999,
              pointerEvents: "auto",
            }}
          >
            <img
              src={localImage}
              alt="payment-img"
              style={{
                transform: `rotate(${rotation}deg)`,
                maxWidth: rotation % 180 === 0 ? "90vw" : "75vh",
                maxHeight: rotation % 180 === 0 ? "90vh" : "75vw",
                objectFit: "contain",
                pointerEvents: "auto",
                transition: "transform 0.2s ease",
              }}
            />

            <div className="absolute bottom-5 flex gap-3" style={{ pointerEvents: "auto" }}>
              <Button variant="outline" size="sm" onClick={rotateImageLeft}>
                Rotate Left
              </Button>
              <Button variant="outline" size="sm" onClick={rotateImageRight}>
                Rotate Right
              </Button>
              <Button variant="outline" size="sm" onClick={onPressClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          img ?? <></>
        )
      }
    >
      {normalImage}
    </ControlledZoom>
  );
};