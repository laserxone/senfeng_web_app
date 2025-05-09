"use client";

import { UserContext } from "@/store/context/UserContext";
import axios from "@/lib/axios";
import { GoogleMap, InfoWindow, Marker } from "@react-google-maps/api";
import moment from "moment";
import { useTheme } from "next-themes";
import { useCallback, useContext, useEffect, useState } from "react";


const MapComponent = () => {
  const { state: UserState } = useContext(UserContext);
  const [data, setData] = useState([]);
  const { theme } = useTheme();

  useEffect(() => {
    async function fetchData() {
      axios.get(`/locations`).then((response) => {
        setData(response.data);
      });
    }

    if (UserState.value.data?.id) {
      fetchData();
    }
  }, [UserState?.value?.data]);

  const defaultMapContainerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "15px 0px 0px 15px",
  };

  const defaultMapCenter = {
    lat: 31.4868877,
  lng: 74.3129694
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
              <Marker
                key={index}
                onClick={() => setSelectedMarker(item?.id == selectedMarker?.id ? null : item)}
                position={{
                  lat: parseFloat(item.location[0]),
                  lng: parseFloat(item.location[1]),
                }}
              >
                {selectedMarker && selectedMarker.id === item.id && (
                  <InfoWindow
                  
                    options={{
                      headerDisabled : true
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
                      <div>Last update: {moment(selectedMarker?.created_at).format("YYYY-MM-DD hh:mm A") }</div>
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            );
          })}
        </GoogleMap>
      );
    },
    [defaultMapOptions]
  );


  return (
    <div className="w-full">
      <RenderMap list={data}/>
    </div>
  );
};

export { MapComponent };
