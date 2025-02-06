"use client";

//Map component Component from library
import { GoogleMap } from "@react-google-maps/api";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";

//Map's styling

const MapComponent = () => {
  const { theme } = useTheme();
  const defaultMapContainerStyle = {
    width: "100%",
    height: "80vh",
    borderRadius: "15px 0px 0px 15px",
  };

  const defaultMapCenter = {
    lat: 35.8799866,
    lng: 76.5048004,
  };
  const defaultMapZoom = 10;

  const [defaultMapOptions, setDefaultMapOptions] = useState({
    zoomControl: true,
    tilt: 0,
    gestureHandling: "auto",
    mapTypeId: "roadmap",
    colorScheme: "DARK",
  });

  useEffect(() => {
    console.log(theme);
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

  const RenderMap = useCallback(() => {
    return (
      <GoogleMap
        mapContainerStyle={defaultMapContainerStyle}
        center={defaultMapCenter}
        zoom={defaultMapZoom}
        options={defaultMapOptions}
      />
    );
  }, [defaultMapOptions]);

  return (
    <div className="w-full">
      <RenderMap />
    </div>
  );
};

export { MapComponent };
