import { MapComponent } from "@/components/mapComponent";
import { MapProvider } from "@/providers/map-provider";

export default function Page(){
    return (
        <MapProvider>
            <MapComponent />
        </MapProvider>
    )
}