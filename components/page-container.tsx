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
    <ScrollArea className="h-[calc(100dvh-62px)] flex flex-1">
      <div className="flex flex-1 justify-center">
        <div className="flex flex-col flex-1 px-4">
          <div className={`flex flex-1 ${className}`}>
            {children}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
