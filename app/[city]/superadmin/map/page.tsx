"use client";
import { MapComponent } from "@/components/mapComponent";
import { Button } from "@/components/ui/button";
import useUserDetail from "@/hooks/use-user-detail";
import { MapProvider } from "@/providers/map-provider";
import Link from "next/link";

export default function Page() {

  const {base_route} = useUserDetail()
  
  return (
    <div className="flex flex-1 relative">
      <MapProvider>
        <MapComponent />
      </MapProvider>

      {/* Bottom Centered Button */}
      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 ">
        {base_route && (
          <Link href={`/${base_route}/map/record`}>
            <Button className={"w-[300px]"}>View Record</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
