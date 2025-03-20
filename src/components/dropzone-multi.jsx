"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

const DropzoneMulti = ({ onDrop, title, subheading, description, drag, borderColor, value }) => {
  const updateRefs = useRef({});

  const onDropAccepted = useCallback(
    (acceptedFiles) => {
      const newImageUrls = acceptedFiles.map((file) => URL.createObjectURL(file));
      onDrop([...value, ...newImageUrls]);
    },
    [onDrop, value]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted,
    accept: "image/*",
    multiple: true, 
  });

  const handlePaste = useCallback((event) => {
    const items = event.clipboardData.items;
    const pastedImages = [];

    for (let item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        const imageUrl = URL.createObjectURL(file);
        pastedImages.push(imageUrl);
      }
    }

    if (pastedImages.length > 0) {
      onDrop([...value, ...pastedImages]);
    }
  }, [onDrop, value]);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleFileChange = (event, index) => {
    if (event.target.files && event.target.files[0]) {
      const newFile = event.target.files[0];
      const newImageUrl = URL.createObjectURL(newFile);

      onDrop(value.map((imgUrl, idx) => (idx === index ? newImageUrl : imgUrl)));
    }
  };

  const handleDelete = (index) => {
    onDrop(value.filter((_, idx) => idx !== index));
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
        ) : value.length === 0 ? (
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
          <div className="grid grid-cols-3 gap-4 mt-4">
            {value.map((imageUrl, index) => (
              <div key={index} className="relative flex flex-col items-center">
                <img
                  src={imageUrl} // Using the URL directly
                  alt={`Selected ${index}`}
                  className="w-24 h-24 object-cover rounded-md shadow-md"
                />
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={() => handleDelete(index)}
                    className="text-red-500 text-sm"
                  >
                    Delete
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    ref={(el) => (updateRefs.current[index] = el)}
                    onChange={(e) => handleFileChange(e, index)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DropzoneMulti;
