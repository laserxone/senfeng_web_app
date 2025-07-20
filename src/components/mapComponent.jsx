"use client";

import { UserContext } from "@/store/context/UserContext";
import axios from "@/lib/axios";
import {
  GoogleMap,
  InfoWindow,
  Marker,
  OverlayView,
} from "@react-google-maps/api";
import moment from "moment";
import { useTheme } from "next-themes";
import { useCallback, useContext, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/config/firebase";

const MapComponent = () => {
  const { state: UserState } = useContext(UserContext);
  const [data, setData] = useState([]);
  const { theme } = useTheme();

  useEffect(() => {
    async function fetchData() {
      const response = await axios.get(
        `/${UserState.value.data?.id}/locations`
      );

      const resolvedData = await Promise.all(
        response.data.map(async (item) => {
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

    if (UserState.value.data?.id) {
      fetchData();
    }
  }, [UserState.value.data]);

  const defaultMapContainerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "15px 0px 0px 15px",
  };

  const defaultMapCenter = {
    lat: 31.4868877,
    lng: 74.3129694,
  };
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
    ({ list }) => {
      const [selectedMarker, setSelectedMarker] = useState(null);
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
                  lat: parseFloat(item.location[0]),
                  lng: parseFloat(item.location[1]),
                }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div className="flex flex-col items-center justify-center gap-2">
                   {selectedMarker && selectedMarker.id === item.id && (
                    <InfoWindow
                      options={{
                        headerDisabled: true,
                      }}
                      onCloseClick={() => console.log("ub")}
                      position={{
                        lat: parseFloat(selectedMarker.location[0]),
                        lng: parseFloat(selectedMarker.location[1]),
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
                    <AvatarImage  src={item.user_dp} alt={"User-dp"} />
                    <AvatarFallback  className="rounded-lg bg-gray-700 text-white dark:bg-gray-100 dark:text-black">
                      {item?.user_name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                 
                </div>
              </OverlayView>
            );
            // ) : (
            //   <Marker
            //     key={index}
            //     icon={null}
            //     onClick={() =>
            //       setSelectedMarker(
            //         item?.id == selectedMarker?.id ? null : item
            //       )
            //     }
            //     position={{
            //       lat: parseFloat(item.location[0]),
            //       lng: parseFloat(item.location[1]),
            //     }}
            //   >
            //     {selectedMarker && selectedMarker.id === item.id && (
            //       <InfoWindow
            //         options={{
            //           headerDisabled: true,
            //         }}
            //         onCloseClick={() => console.log("ub")}
            //         position={{
            //           lat: parseFloat(selectedMarker.location[0]),
            //           lng: parseFloat(selectedMarker.location[1]),
            //         }}
            //       >
            //         <div
            //           style={{
            //             backgroundColor: `white`,
            //             padding: `5px`,
            //             borderRadius: 5,
            //           }}
            //         >
            //           <div>{selectedMarker?.user_name}</div>
            //           <div>
            //             Last update:{" "}
            //             {moment(selectedMarker?.created_at).format(
            //               "YYYY-MM-DD hh:mm A"
            //             )}
            //           </div>
            //         </div>
            //       </InfoWindow>
            //     )}
            //   </Marker>
            // );
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
