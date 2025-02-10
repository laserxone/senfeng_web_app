"use client";

//Map component Component from library
import { GoogleMap, InfoBox, InfoWindow, InfoWindowF, Marker } from "@react-google-maps/api";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";

//Map's styling

const CustomerMapComponent = ({ data }) => {
  const { theme } = useTheme();

  const defaultMapContainerStyle = {
    width: "100%",
    height: "80vh",
    borderRadius: "15px 0px 0px 15px",
  };

  const defaultMapCenter = {
    lat: 30.3016096,
    lng: 66.2531961,
  };
  const defaultMapZoom = 5.8;

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
                  lat: parseFloat(item.latitude),
                  lng: parseFloat(item.longitude),
                }}
              >
                {selectedMarker && selectedMarker.id === item.id && (
                  <InfoWindow
                  
                    options={{
                      headerDisabled : true
                    }}
                    onCloseClick={() => console.log("ub")}
                    position={{
                      lat: parseFloat(selectedMarker.latitude),
                      lng: parseFloat(selectedMarker.longitude),
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: `white`,
                        padding: `5px`,
                        borderRadius: 5,
                      }}
                    >
                      <div>{selectedMarker?.company}</div>
                      <div>{selectedMarker?.location}</div>
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
      <RenderMap list={data} />
    </div>
  );
};

export { CustomerMapComponent };
