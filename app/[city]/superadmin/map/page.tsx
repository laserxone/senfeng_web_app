"use client";
import { MapComponent } from "@/components/page-compositions/general/map-component";
import { Button } from "@/components/ui/button";
import useUserDetail from "@/hooks/use-user-detail";
import { MapProvider } from "@/providers/map-provider";
import Link from "next/link";

export default function Page() {
  const { base_route } = useUserDetail();

  return (
    <div className="relative flex h-[calc(100dvh-80px)] flex-1">
      <MapProvider>
        <MapComponent />
      </MapProvider>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 transform">
        {base_route && (
          <Link href={`/${base_route}/map/record`}>
            <Button className={"w-[300px]"}>View Record</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
