"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
type DropzoneMultiProps = {
  onDrop: (files: string[]) => void;
  title: string;
  subheading: string;
  description: string;
  drag: string;
  borderColor?: string;
  value: string[];
};
const DropzoneMulti = ({ onDrop, title, subheading, description, drag, borderColor, value }: DropzoneMultiProps) => {
 const updateRefs = useRef<(HTMLInputElement | null)[]>([]);

  const onDropAccepted = useCallback(
    (acceptedFiles: File[]) => {
      const newImageUrls = acceptedFiles.map((file) => URL.createObjectURL(file));
      onDrop([...value, ...newImageUrls]);
    },
    [onDrop, value]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted,
    accept: {
      "image/*": [],
    },
    multiple: true,
  });

  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = event?.clipboardData?.items;
    if (!items) return
    const pastedImages = [];

    for (let item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        const imageUrl = URL.createObjectURL(file as Blob);
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

  const handleFileChange = (event : React.ChangeEvent<HTMLInputElement, HTMLInputElement>, index : number) => {
    if (event.target.files && event.target.files[0]) {
      const newFile = event.target.files[0];
      const newImageUrl = URL.createObjectURL(newFile);

      onDrop(value.map((imgUrl, idx) => (idx === index ? newImageUrl : imgUrl)));
    }
  };

  const handleDelete = (index : number) => {
    onDrop(value.filter((_, idx) => idx !== index));
  };

  return (
    <div
      {...getRootProps()}
      className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/15 px-3 py-6 transition hover:border-primary/40 hover:bg-muted/25 sm:px-4 sm:py-8"
      style={{ borderColor }}
    >
      <div className="flex w-full flex-col items-center">
        {isDragActive ? (
          <Label className="text-sm font-semibold text-primary">{drag}</Label>
        ) : value.length === 0 ? (
          <div className="flex flex-col items-center">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl border bg-background shadow-sm">
              <Image src="/upload-cloud-02.png" height={24} width={24} alt="Cloud upload" />
            </div>
            <div className="flex flex-col text-center">
              <span className="text-sm font-semibold text-foreground">{title}</span>
              <span className="text-sm text-muted-foreground">{subheading}</span>
              <span className="text-[11px] text-muted-foreground">({description})</span>
            </div>
            <Input {...getInputProps()} id="image-input" style={{ display: "none" }} />
          </div>
        ) : (
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {value.map((imageUrl, index) => (
              <div key={index} className="relative overflow-hidden rounded-xl border bg-background p-2 shadow-sm">
                <img
                  src={imageUrl} // Using the URL directly
                  alt={`Selected ${index}`}
                  className="aspect-square w-full rounded-lg object-cover"
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-medium text-muted-foreground">
                    Image {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(index)}
                    className="rounded-full border border-red-100 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    Delete
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    ref={(el) => {
                      if (updateRefs.current)
                        (updateRefs.current[index] = el)
                    }}
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
