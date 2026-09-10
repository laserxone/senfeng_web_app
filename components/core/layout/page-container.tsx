"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";
type Props = {
  children: React.ReactNode;
  scrollable?: boolean;
  className?: string;
};
export default function PageContainer({ children, className }: Props) {
  return (
    <ScrollArea className="min-h-0 w-full flex-1">
      <div className="flex min-w-0 justify-center">
        <div className="flex w-full min-w-0 flex-col px-4">
          <div className={`flex flex-1 ${className}`}>{children}</div>
        </div>
      </div>
    </ScrollArea>
  );
}
