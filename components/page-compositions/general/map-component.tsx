"use client";

import { storage } from "@/config/firebase";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { UserMap } from "@/lib/types";
import { GoogleMap, InfoWindow, OverlayView } from "@react-google-maps/api";
import { getDownloadURL, ref } from "firebase/storage";
import moment from "moment";
import { useTheme } from "next-themes";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MapComponent = () => {
  const { userID } = useUserDetail();
  const [data, setData] = useState<UserMap[]>([]);
  const { theme } = useTheme();
  const { city } = useParams();

  useEffect(() => {
    if (userID) {
      fetchData();
    }
  }, [userID]);

  async function fetchData() {
    const response = await axios.get(`/${userID}/locations`);

    const resolvedData = await Promise.all(
      response.data.map(async (item: UserMap) => {
        if (item?.user_dp && !item.user_dp?.includes("http")) {
          const storageRef = ref(storage, item?.user_dp);
          const url = await getDownloadURL(storageRef);
          return { ...item, user_dp: url };
        }
        return item;
      })
    );

    setData(resolvedData);
  }


  const defaultMapContainerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "15px 0px 0px 15px",
  };

  const defaultMapCenter = useMemo(() => {
    switch (city) {
      case "lahore":
        return { lat: 31.4868877, lng: 74.3129694 };
      case "karachi":
        return { lat: 24.8607, lng: 67.0011 };
      case "islamabad":
        return { lat: 33.6844, lng: 73.0479 };
      default:
        return { lat: 31.4868877, lng: 74.3129694 };
    }
  }, [city]);
  const defaultMapZoom = 11.65;

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

  const RenderMap = useCallback(
    ({ list }: { list: UserMap[] }) => {
      const [selectedMarker, setSelectedMarker] = useState<UserMap | null>(null);
      return (
        <GoogleMap
          mapContainerStyle={defaultMapContainerStyle}
          center={defaultMapCenter}
          zoom={defaultMapZoom}
          options={defaultMapOptions}
        >
          {list?.map((item, index) => {
            return (
              <OverlayView
                key={index}
                position={{
                  lat: item.location[0],
                  lng: item.location[1],
                }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  {selectedMarker && selectedMarker.id === item.id && (
                    <InfoWindow
                      options={{
                        headerDisabled: true,
                      }}
                      position={{
                        lat: selectedMarker.location[0],
                        lng: selectedMarker.location[1],
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: `white`,
                          padding: `5px`,
                          borderRadius: 5,
                        }}
                      >
                        <div>{selectedMarker?.user_name}</div>
                        <div>
                          Last update:{" "}
                          {moment(selectedMarker?.created_at).format(
                            "YYYY-MM-DD hh:mm A"
                          )}
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                  <Avatar
                    onClick={() =>
                      setSelectedMarker(
                        item?.id == selectedMarker?.id ? null : item
                      )
                    }
                    className="h-10 w-10 cursor-pointer"
                  >
                  {item.user_dp &&  <AvatarImage src={item.user_dp || ""} alt={"User-dp"} />}
                    <AvatarFallback className="rounded-lg bg-gray-700 text-white dark:bg-gray-100 dark:text-black">
                      {item?.user_name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </OverlayView>
            );
          })}
        </GoogleMap>
      );
    },
    [defaultMapOptions]
  );

  return (
    <div className="w-full">
      <RenderMap list={data} />
    </div>
  );
};

export { MapComponent };
