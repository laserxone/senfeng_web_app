"use client";

import { UserContext } from "@/store/context/UserContext";
import { useDebounce } from "@/hooks/use-debounce";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Label } from "@/components/ui/label";

import axios from "axios";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BASE_URL } from "@/constants/data";

export default function InventoryDetail() {
  const { state: UserState } = useContext(UserContext);
  const [focusedRow, setFocusedRow] = useState(null);
  const [focusedBoard, setFocusedBoard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const tableRef = useRef(null);
  const [prefetching, setPrefetching] = useState(true);

  const [data, setData] = useState([]);
  const [apiData, setApiData] = useState({});

  const debouncedData = useDebounce(data, 1000);
  const search = useSearchParams();
  const booking_id = search.get("id");

  useEffect(() => {
    if (!prefetching)
      if (debouncedData) {
        setLoadingMessage("Autosaving");
        setLoading(true);
        axios
          .put(`${BASE_URL}/bookings`, { id: apiData.id, data: debouncedData })
          .catch((error) => console.error("Failed to update backend", error))
          .finally(() => {
            const temp = debouncedData;
            setLoadingMessage("");
            setLoading(false);
          });
      }
  }, [debouncedData, prefetching]);

  useEffect(() => {
    if (UserState.value.data?.id && booking_id) {
      fetchData();
    }
  }, [UserState.value.data]);

  const colors = [
    "bg-blue-100 dark:bg-blue-900",
    "bg-green-100 dark:bg-green-900",
    "bg-yellow-100 dark:bg-yellow-900",
    "bg-orange-100 dark:bg-orange-900",
    "bg-red-100 dark:bg-red-900",
    "bg-purple-100 dark:bg-purple-900",
    "bg-pink-100 dark:bg-pink-900",
    "bg-gray-100 dark:bg-gray-800",
  ];

  async function fetchData() {
    axios
      .get(`${BASE_URL}/bookings/${booking_id}`)
      .then((response) => {
        setApiData(response.data);
        if (response.data?.data?.length > 0) {
          const sortedData = [...(response.data?.data || [])].sort((a, b) => {
            if (a?.MODEL === b?.MODEL) {
              return String(a?.POWER || "").localeCompare(
                String(b?.POWER || "")
              );
            }
            return String(a?.MODEL || "").localeCompare(String(b?.MODEL || ""));
          });

          const modelPowerColorMap = new Map();
          let colorIndex = 0;

          const coloredData = sortedData.map((item) => {
            const key = `${item.MODEL}-${item.POWER}`;

            if (!modelPowerColorMap.has(key)) {
              modelPowerColorMap.set(key, colors[colorIndex % colors.length]);
              colorIndex++;
            }

            return {
              ...item,
              color: modelPowerColorMap.get(key),
            };
          });
          const sortedSerialData = [...coloredData].sort((a, b) => {
            return String(a?.SERIAL || "").localeCompare(
              String(b?.SERIAL || "")
            );
          });
          setData(sortedSerialData);
        }
      })
      .finally(() => {
        setPrefetching(false);
      });
  }

  const handleClickOutside = useCallback((event) => {
    if (tableRef.current && !tableRef.current.contains(event.target)) {
      setFocusedBoard(false);
    } else {
      setFocusedBoard(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    const down = (e) => {
      if (focusedBoard) {
        if ((e.metaKey || e.ctrlKey) && e.key === "+") {
          e.preventDefault();
          handleAddNewRow(focusedRow);
        }
        if ((e.metaKey || e.ctrlKey) && e.key === "-") {
          e.preventDefault();
          handleRemoveRow(focusedRow);
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [focusedRow, data, focusedBoard]);

  const handleAddNewRow = useCallback(
    async (index) => {
      if (index !== null) {
        if (data.length == 0) {
          setData((prevState) => {
            const newState = [...prevState];
            newState.push(newItem);
            return newState;
          });
        } else {
          setData((prevState) => {
            const newState = [...prevState];
            newState.splice(index, 0, {
              ...newItem,
              color: data[index]?.color || "",
            });
            return newState;
          });
        }
      } else {
        setData((prevState) => {
          const newState = [...prevState];
          newState.push(newItem);
          return newState;
        });
      }
    },
    [data, setData, newItem]
  );

  const handleRemoveRow = useCallback(
    (index) => {
      if (index !== null) {
        if (data.length == 0) return;
        setData((prevData) => {
          const updatedData = [...prevData];
          updatedData.splice(index, 1);
          return updatedData;
        });
      }
    },
    [data, setData]
  );

  const handleSameRowAbove = (index) => {
    setData((prevState) => {
      const newState = [...prevState];
      newState.splice(index, 0, { ...prevState[index] });
      return newState;
    });
  };

  const handleSameRowBelow = (index) => {
    setData((prevState) => {
      const newState = [...prevState];
      newState.splice(index + 1, 0, { ...prevState[index] });
      return newState;
    });
  };

  async function handleSaveShipment() {
    setLoading(true);
    setLoadingMessage("Autosaving");
    await axios
      .put(`${BASE_URL}/bookings`, {
        id: apiData.id,
        shipment: apiData.shipment,
      })
      .finally(() => {
        setLoading(false);
        setLoadingMessage("");
      });
  }

  function fillData() {
    let filledData = [...data];
    let lastValidEntry = null;

    for (let i = 0; i < filledData.length; i++) {
      if (filledData[i].QTY) {
        lastValidEntry = { ...filledData[i] };
      } else if (lastValidEntry && lastValidEntry.QTY > 0) {
        filledData[i] = {
          QTY: lastValidEntry.QTY - 1,
          SERIAL: lastValidEntry.SERIAL + 1,
          MODEL: lastValidEntry.MODEL,
          POWER: lastValidEntry.POWER,
          SOURCE: lastValidEntry.SOURCE,
        };
        lastValidEntry.SERIAL++;
        lastValidEntry.QTY--;
      }
    }

    return filledData;
  }

  return (
    <div
      className="flex flex-1 flex-col pb-10"
      ref={tableRef}
      onFocus={() => setFocusedBoard(true)}
    >
      <div className="flex w-full justify-end gap-5">
        <Button
          onClick={() => {
            setLoading(true)
            setTimeout(() => {
              setLoading(false);
            }, [1000]);
          }}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit
        </Button>
      

        {/* <Button
          onClick={() => {
            let filledData = fillData();
            setData(filledData);
          }}
        >
          Auto Fill
        </Button> */}
      </div>
      <div className="flex gap-5 items-center mb-5 h-10">
        <Label>{loadingMessage}</Label>
        {loading && <Loader2 className="animate-spin h-4 w-4" />}
      </div>
      <table className="border-collapse border border-gray-400 w-full">
        <thead className="bg-red-600 text-white">
          <tr style={{ backgroundColor: "#44546A" }}>
            <th
              colSpan={11}
              className={`border border-gray-600 p-2 text-center font-semibold w-full`}
            >
              <input
                className="bg-transparent text-black dark:text-white dark:placeholder-gray-300"
                style={{
                  borderColor: "transparent",
                  height: 35,
                  width: "100%",
                  fontWeight: 600,
                  fontSize: "14px",
                  borderRadius: 0,
                  textAlign: "center",
                  fontSize: "19px",
                  color: "white",
                }}
                onBlur={() => handleSaveShipment()}
                value={apiData?.shipment || ""}
                onChange={(e) => {
                  setApiData({ ...apiData, shipment: e.target.value });
                }}
              />
            </th>
          </tr>
          <tr>
            {[
              "QTY",
              "SERIAL",
              "MODEL",
              "POWER",
              "SOURCE",
              "CUSTOMER",
              "CITY",
              "MANAGER",
              "PRICE",
              "DELIVERY",
              "REMARKS",
            ].map((item, index) => (
              <th
                key={index}
                className={`border border-gray-600 p-2 text-center font-semibold ${
                  item === "REMARKS" ? "w-[300px]" : "w-[130px]"
                }`}
              >
                {item}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data &&
            data.length > 0 &&
            data.map((item, ind) => (
              <tr key={ind} className={`${item.color}`}>
                {fieldOrder.map((key, index1) => (
                  <td
                    key={`${ind}-${index1}`}
                    className={`border border-gray-600 dark:border-gray-400 ${
                      key === "REMARKS" ? "w-[300px]" : "w-[130px]"
                    } text-black dark:text-white`}
                  >
                    <ContextMenu>
                      <ContextMenuTrigger>
                        <input
                          onFocus={() => setFocusedRow(ind)}
                          onBlur={(e) => {
                            if (
                              !e.relatedTarget ||
                              !tableRef.current.contains(e.relatedTarget)
                            ) {
                              setFocusedRow(null);
                              setFocusedBoard(false);
                            }
                          }}
                          className="bg-transparent text-black dark:text-white dark:placeholder-gray-300"
                          style={{
                            borderColor: "transparent",
                            height: 35,
                            width: "100%",
                            fontWeight: 600,
                            fontSize: "14px",
                            borderRadius: 0,
                            paddingInline: 5,
                          }}
                        //   placeholder={key}
                          value={item[key]}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const parsedValue =
                              inputValue.trim() === ""
                                ? ""
                                : isNaN(inputValue)
                                ? inputValue
                                : Number(inputValue);

                            setData((prevState) => {
                              const newState = [...prevState];
                              newState[ind] = {
                                ...newState[ind],
                                [key]: parsedValue,
                              };
                              return newState;
                            });
                          }}
                        />
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          onClick={() => handleSameRowAbove(ind)}
                        >
                          Add same row above
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => handleSameRowBelow(ind)}
                        >
                          Add same row below
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

const newItem = {
  QTY: "",
  SERIAL: "",
  MODEL: "",
  POWER: "",
  SOURCE: "",
  CUSTOMER: "",
  CITY: "",
  MANAGER: "",
  PRICE: "",
  DELIVERY: "",
  REMARKS: "",
};

const fieldOrder = [
  "QTY",
  "SERIAL",
  "MODEL",
  "POWER",
  "SOURCE",
  "CUSTOMER",
  "CITY",
  "MANAGER",
  "PRICE",
  "DELIVERY",
  "REMARKS",
];
