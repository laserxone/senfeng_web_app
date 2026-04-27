"use client";
import Image from "next/image";
import { ChangeEventHandler, useCallback, useEffect, useRef, useState } from "react";
import { Accept, useDropzone } from "react-dropzone";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

type DropzoneProps = {
  onDrop: (val: File | null) => void,
  title: string
  subheading: string
  description: string
  drag: string,
  borderColor?: string,
  value: string | null
}
const Dropzone = ({ onDrop, title, subheading, description, drag, borderColor, value }: DropzoneProps) => {
  const updateRef = useRef<HTMLInputElement | null>(null);

  const onDropAccepted = useCallback(
    (acceptedFiles: File[]) => {

      onDrop(acceptedFiles[0]);
    },
    [onDrop]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted,
    accept: {
      "image/*": [],
    },
    multiple: false,
  });

  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = event?.clipboardData?.items;
    if (!items) return
    for (let item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        onDrop(file);
        break;
      }
    }
  }, [onDrop]);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleUpdate = () => {
    if (updateRef.current) {
      updateRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const newFile = event.target.files[0];

      onDrop(newFile);
    }
  };

  const handleDelete = () => {
    onDrop(null);
  };

  return (
    <div
      {...getRootProps()}
      className="w-full flex flex-col items-center justify-center py-8 border rounded-md"
      style={{ borderColor }}
    >
      <div className="flex flex-col items-center">
        {isDragActive ? (
          <Label>{drag}</Label>
        ) : !value ? (
          <div className="flex flex-col items-center">
            <Image src="/upload-cloud-02.png" height={20} width={20} alt="Cloud upload" />
            <div className="flex flex-col text-center">
              <span className="text-gray-500 font-medium text-[14px]">{title}</span>
              <span className="text-gray-500 text-[14px]">{subheading}</span>
              <span className="text-gray-400 text-[11px]">({description})</span>
            </div>
            <Input {...getInputProps()} id="image-input" style={{ display: "none" }} />
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <img
              src={value}
              alt="Selected"
              className="w-24 h-24 object-cover rounded-md shadow-md"
            />
            <div className="mt-2 flex space-x-2">
              <button onClick={handleDelete} className="text-red-500 text-sm">
                Delete
              </button>
              <button onClick={handleUpdate} className="text-blue-500 text-sm">
                Update
              </button>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                ref={updateRef}
                onChange={handleFileChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dropzone;
