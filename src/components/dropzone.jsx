
import Image from "next/image";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

const Dropzone = ({ onDrop, title, subheading, description, drag, loading, colorMode, borderColor }) => {
    const onDropAccepted = useCallback(
        (acceptedFiles) => {
            onDrop(acceptedFiles[0]);
        },
        [onDrop]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDropAccepted,
        accept: "image/*",
    });

  
    return (
    
            <div
                {...getRootProps()}
                className="w-[300px] flex flex-col items-center justify-center py-8 border rounded-sm"
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
                    <Image
                        src="/upload-cloud-02.png"
                        height={20}
                        width={20}
                    />
                </div>
                <Input {...getInputProps()} />
                {isDragActive ? (
                    <Label> {drag}</Label>
                ) : (
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
                  
                )}
            </div>
    );
};

export default Dropzone;
