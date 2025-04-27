"use client";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import Spinner from "@/components/ui/spinner";
import { UserSearch } from "@/components/user-search";
import axios from "@/lib/axios";
import { MapProvider } from "@/providers/map-provider";
import {
  GoogleMap,
  InfoWindow,
  Marker,
  Polyline,
} from "@react-google-maps/api";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";

const containerStyle = {
  width: "100%",
  height: "100%",
};

export default function Page() {
  const [data, setData] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

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

  async function fetchData() {
    setLoading(true);
    axios
      .get(`/locations?user=${selectedUser}`)
      .then((response) => {
        setData(response.data);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const MapWithPath = useCallback(
    ({ data }) => {
      const [selected, setSelected] = useState(null);

      if (!data.length) return <p>No data to show</p>;

      const path = data.map((item) => ({
        lat: item.location[0],
        lng: item.location[1],
      }));

      const center = path[1];

      return (
        <div className="flex flex-1 flex-row gap-4">
          <MapProvider>
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={center}
              zoom={12}
              options={defaultMapOptions}
            >
              {/* Polyline connecting the path */}
              <Polyline
                path={path}
                options={{ strokeColor: "#007bff", strokeWeight: 4 }}
              />

              {/* Markers with labels and time tooltips */}
              {data.map((item, index) => (
                <Marker
                  key={index}
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
          <div className="flex flex-col gap-4 overflow-y-auto w-[400px] max-h-[70vh]">
            {data.map((item, index) => {
              let labelText = "";
              if (index === 0) {
                labelText = "Starting Point";
              } else if (index === data.length - 1) {
                labelText = "End Point";
              } else {
                labelText = `Position ${index + 1}`;
              }

              return (
                <div
                  key={index}
                  className={`p-4 ${
                    theme == "dark" ? "bg-gray-900" : "bg-gray-100"
                  }   rounded-lg shadow-md  cursor-pointer hover:opacity-60`}
                  onClick={() => setSelected(index)}
                >
                  <div className="text-xs font-semibold text-blue-600 mb-1">
                    {labelText}
                  </div>
                  <div className="font-medium text-lg">{item.user_name}</div>
                  {/* <div className="text-sm text-gray-600">
                    Latitude: {item.location[0]}, Longitude: {item.location[1]}
                  </div> */}
                  <div className="text-sm text-gray-500">
                    Time: {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    },
    [data, defaultMapOptions]
  );

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-row justify-between items-center">
        <Heading title="Map record" description="View user locations record" />
        <div className="flex flex-row gap-2">
          <div className="w-[300px]">
            <UserSearch value={selectedUser} onReturn={setSelectedUser} />
          </div>
          <Button disabled={!selectedUser} onClick={fetchData}>
            {loading && <Spinner />}
            Check
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 max-h-[90vh] overflow-y-auto pr-2"></div>
      {data.length > 0 && <MapWithPath data={data} />}
    </div>
  );
}
