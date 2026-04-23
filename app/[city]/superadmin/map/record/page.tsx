"use client";
import { Button } from "@/components/ui/button";
import Heading from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import FilterSheet from "@/components/users/filterSheet";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { UserMap } from "@/lib/types";
import { MapProvider } from "@/providers/map-provider";
import {
  GoogleMap,
  InfoWindow,
  Marker,
  Polyline,
  MarkerClusterer
} from "@react-google-maps/api";
import { Filter } from "lucide-react";
import moment from "moment";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const containerStyle = {
  width: "100%",
  height: "100%",
};

export default function Page() {
  const [maps, setMaps] = useState<UserMap[]>([]);
  const { theme } = useTheme();
  const [filterVisible, setFilterVisible] = useState(false);
  const { userID } = useUserDetail();
  const PAGE_SIZE = 20;

  const [page, setPage] = useState(0);

  const paginatedData = useMemo(() => {
    return filterClosePoints(maps, 100)
  }, [maps]);

  const filteredData = paginatedData.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  const [defaultMapOptions, setDefaultMapOptions] = useState({
    zoomControl: true,
    tilt: 0,
    gestureHandling: "auto",
    mapTypeId: "roadmap",
    colorScheme: "DARK",
  });

  useEffect(() => {
    if (theme === "dark") {
      setDefaultMapOptions((prevState) => ({
        ...prevState,
        colorScheme: "DARK",
      }));
    } else {
      setDefaultMapOptions((prevState) => ({
        ...prevState,
        colorScheme: "LIGHT",
      }));
    }
  }, [theme]);

  async function fetchData(start: string, end: string, user?: number) {
    if (!start || !end || !user) {
      toast.info("User is required");
      return;
    }
    return new Promise<void>((resolve) => {
      axios
        .get(
          `/${userID}/locations?start_date=${start}&end_date=${end}&user=${user}`
        )
        .then((response) => {
          setMaps(response.data);
        })
        .finally(() => {
          resolve();
        });
    });
  }

  const MapWithPath = useCallback(
    ({ data }: { data: UserMap[] }) => {
      const [selected, setSelected] = useState<number | null>(null);

      if (!data.length) return <p>No data to show</p>;

      const path = data.map((item) => ({
        lat: item.location[0],
        lng: item.location[1],
      }));

      const center = path[0];

      return (
        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
          <MapProvider>
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={center}
              zoom={12}
              options={defaultMapOptions}
            >

              <Polyline
                path={path}
                options={{ strokeColor: "#2F9C9C", strokeWeight: 1 }}
              />

              <MarkerClusterer>
                {(clusterer) =>
                  <>
                    {data.map((item, index) => (
                      <Marker
                        key={index}
                        clusterer={clusterer}
                        position={{ lat: item.location[0], lng: item.location[1] }}
                        label={{
                          text:
                            index === 0
                              ? "Start"
                              : index === data.length - 1
                                ? "End"
                                : `${index + 1}`,
                          color: "white",
                        }}
                        onClick={() => setSelected(index)}
                      />
                    ))}
                  </>
                }
              </MarkerClusterer>

              {selected !== null && (
                <InfoWindow
                  options={{
                    headerDisabled: true,
                  }}
                  position={{
                    lat: data[selected].location[0],
                    lng: data[selected].location[1],
                  }}
                  onCloseClick={() => setSelected(null)}
                >
                  <div className="text-sm rounded-md bg-white text-gray-800 shadow-md dark:text-black">
                    <strong>{data[selected].user_name}</strong>
                    <br />
                    Time: {new Date(data[selected].created_at).toLocaleString()}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </MapProvider>
          <ScrollArea className="flex flex-col w-full h-[500px] sm:w-[400px] sm:h-[80vh] pr-2">
            {data.map((item, index) => {
              const label =
                index === 0
                  ? "Start"
                  : index === data.length - 1
                    ? "End"
                    : `#${index + 1}`;

              return (
                <div
                  key={index}
                  onClick={() => setSelected(index)}
                  className={`mb-2 cursor-pointer rounded-md px-3 py-2 border transition hover:opacity-70 ${theme === "dark"
                    ? "bg-gray-900 border-gray-800"
                    : "bg-gray-100 border-gray-200"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-500">
                      {label}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {moment(item.created_at).format("YYYY-MM-DD hh:mm A")}
                    </span>
                  </div>

                  <div className="text-sm font-medium truncate">
                    {item.user_name}
                  </div>
                </div>
              );
            })}
          </ScrollArea>
        </div>
      );
    },
    [filteredData, defaultMapOptions]
  );

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex  flex-row justify-between items-center flex-wrap gap-2">
        <Heading title="Map record" description="View user locations record" />
        <div>
          {userID && (
            <div className="flex gap-2">

              <Button onClick={() => { setFilterVisible(true) }}>
                <Filter /> Filter user and date
              </Button>
              {filteredData.length > 0 &&
                <div className="flex items-center gap-4">
                  <Button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>

                  <span className="text-sm">
                    Page {page + 1} of {Math.ceil(paginatedData.length / PAGE_SIZE)}
                  </span>

                  <Button
                    disabled={(page + 1) * PAGE_SIZE >= paginatedData.length}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              }
            </div>
          )}
        </div>
      </div>

      {maps.length > 0 && <MapWithPath data={filteredData} />}

      <FilterSheet
        user_disable={false}
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await fetchData(val.start, val.end, val.user);
        }}
      />
    </div>
  );
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) *
    Math.cos(φ2) *
    Math.sin(Δλ / 2) *
    Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // meters
}

function filterClosePoints(data: UserMap[], threshold = 20) {
  if (!data.length) return [];

  const filtered = [data[0]];

  for (let i = 1; i < data.length; i++) {
    const prev = filtered[filtered.length - 1];
    const curr = data[i];

    const dist = getDistance(
      prev.location[0],
      prev.location[1],
      curr.location[0],
      curr.location[1]
    );

    if (dist > threshold) {
      filtered.push(curr);
    }
  }

  return filtered;
}