"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";
type Props = {
  children: React.ReactNode;
  scrollable?: boolean;
  className?: string;
};
export default function PageContainer({
  children,
  className,
}: Props) {
  return (
    <ScrollArea className="h-[calc(100dvh-62px)] w-full">
      <div className="w-full flex justify-center">
        <div className="flex flex-col w-full max-w-[1600px] p-6 pt-0 pb-0 gap-6">
          <div className={`flex flex-1 ${className}`}>
            {children}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
