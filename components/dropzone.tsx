"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { GetProfileImage } from "@/lib/getProfileImage";
import Spinner from "./ui/spinner";
type DropzoneProps = {
  onDrop: (file: any) => void;
  title: string;
  subheading: string;
  description: string;
  drag: string;
  borderColor?: string;
  noImage?: boolean;
  value: any;
  className?: string;
  dbImage?: any;
};
const Dropzone = ({
  onDrop,
  title,
  subheading,
  description,
  drag,
  borderColor,
  noImage = false,
  value,
  className = "",
  dbImage = null,
}:DropzoneProps) => {


  const onDropAccepted = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      onDrop(URL.createObjectURL(file));
    },
    [onDrop],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted,
    accept: "image/*",
  });

  useEffect(() => {
    const handlePaste = (event) => {
      const items = event.clipboardData.items;
      for (let item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          const imageUrl = URL.createObjectURL(file);

          onDrop(imageUrl);
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  async function handleDelete() {
    onDrop("");
  }

  return (
    <div
      {...getRootProps()}
      className={`w-[300px] flex flex-col items-center justify-center py-2 border rounded-sm ${className}`}
      style={{ borderColor }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "5px",
          borderRadius: "50px",
        }}
      >
        {isDragActive ? (
          <Label>{drag}</Label>
        ) : value ? (
          <>
            {!noImage && dbImage ? (
              <RenderImage img={dbImage} />
            ) : (
              <img
                src={value}
                alt="Selected"
                className="cursor-pointer w-20 h-20 object-cover"
              />
            )}
            <div className="mt-2 flex space-x-2 ml-2">
              <button
                onClick={() => {
                  handleDelete();
                }}
                className="text-red-500 text-sm"
              >
                Delete
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <Image
              src="/upload-cloud-02.png"
              height={20}
              width={20}
              alt="Cloud image"
            />
            <div className="flex flex-col">
              <div className="flex">
                <div className="text-gray-300 dark:text-gray-300 font-medium text-[14px]">
                  {title}
                </div>
                <div className="text-gray-300 dark:text-gray-300 ml-1 text-[14px]">
                  {subheading}
                </div>
              </div>
              <div className="text-gray-300 dark:text-gray-300 text-[11px] text-center">
                {`(${description})`}
              </div>
            </div>
            <Input
              {...getInputProps()}
              id="image-input"
              style={{ display: "none" }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const RenderImage = ({ img }) => {
  const [localImage, setLocalImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchImage() {
      if (img?.includes("http")) {
        setLocalImage(img);
      } else {
        const imgResult = await GetProfileImage(img);
        setLocalImage(imgResult);
      }
      setLoading(false);
    }

    if (img) {
      setLoading(true);
      fetchImage();
    }
  }, [img]);

  if (loading) {
    return (
      <div className="w-20 h-20 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <img
      src={localImage}
      alt="nameplate"
      className="cursor-pointer w-20 h-20 object-cover"
    />
  );
};

export default Dropzone;
