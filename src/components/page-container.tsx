"use client";
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
type Props = {
  children: React.ReactNode;
  scrollable?: boolean;
  className?: string;
};
export default function PageContainer({
  children,
  scrollable = true,
  className,
}:Props) {
  const isMobile = useIsMobile();
  const effectiveScrollable = isMobile ? true : scrollable;
  return (
    <>
      {effectiveScrollable ? (
        <ScrollArea className="h-[calc(100dvh-70px)] w-full">
          <div className={`flex flex-1 px-4 pb-4 md:px-6 ${className}`}>
            {children}
          </div>
        </ScrollArea>
      ) : (
        <div className={`flex flex-1 px-4 pb-4 md:px-6 ${className}`}>
          {children}
        </div>
      )}
    </>
  );
}
