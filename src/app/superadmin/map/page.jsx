"use client";
import { MapComponent } from "@/components/mapComponent";
import { Button } from "@/components/ui/button";
import { MapProvider } from "@/providers/map-provider";
import { UserContext } from "@/store/context/UserContext";
import Link from "next/link";
import { useContext } from "react";

export default function Page() {
  const { state: UserState } = useContext(UserContext);
  return (
    <div className="flex flex-1 relative">
      <MapProvider>
        <MapComponent />
      </MapProvider>

      {/* Bottom Centered Button */}
      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 ">
        {UserState.value.data?.base_route && (
          <Link href={`/${UserState.value.data?.base_route}/map/record`}>
            <Button className={"w-[300px]"}>View Record</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
