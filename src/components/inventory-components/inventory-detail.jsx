"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/use-debounce";
import { UserContext } from "@/store/context/UserContext";
import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import axios from "@/lib/axios";
import { Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export default function InventoryDetail({ booking_id }) {
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
  const tableContainerRef = useRef(null);
  const [tableMaxHeight, setTableMaxHeight] = useState("auto");
  const [availableWidth, setAvailableWidth] = useState("full");

  useEffect(() => {
    const updateWidth = () => {
      const windowWidth = window.innerWidth;
      const width = windowWidth - (16 * 16 + 50);
      setAvailableWidth(`${width}px`);
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  useEffect(() => {
    if (!prefetching)
      if (debouncedData) {
        setLoadingMessage("Autosaving...");
        setLoading(true);
        axios
          .put(`/bookings`, { id: apiData.id, data: debouncedData })
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

  useEffect(() => {
    const updateHeight = () => {
      if (tableContainerRef.current) {
        const rect = tableContainerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 50;
        setTableMaxHeight(`${availableHeight}px`);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    return () => window.removeEventListener("resize", updateHeight);
  }, []);

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
      .get(`/bookings/${booking_id}`)
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
      .put(`/bookings`, {
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
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-5 items-center">
          <Label>{loadingMessage}</Label>
        </div>
        <div className="flex w-full justify-end">
          <Button
            onClick={() => {
              setLoading(true);
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
      </div>

      <div
        style={{
          maxHeight: tableMaxHeight,
          maxWidth: availableWidth,
          minHeight: tableMaxHeight,
        }}
        ref={tableContainerRef}
        className={`overflow-y-auto flex-1  overflow-x-auto`}
      >
        <div className="min-w-full inline-block align-middle">
          <div className="sticky top-0 z-30  bg-[#44546A]">
            <div className="border border-gray-600 p-2 text-center font-semibold w-full">
              <input
                className="bg-transparent text-black dark:text-white dark:placeholder-gray-300"
                style={{
                  borderColor: "transparent",
                  height: 35,
                  width: "100%",
                  fontWeight: 600,
                  fontSize: "19px",
                  color: "white",
                  textAlign: "center",
                }}
                onBlur={() => handleSaveShipment()}
                value={apiData?.shipment || ""}
                onChange={(e) =>
                  setApiData({ ...apiData, shipment: e.target.value })
                }
              />
            </div>
          </div>
          <div className=" sticky top-[53px] z-20 flex flex-row bg-red-600">
            {[
              "QTY",
              "SERIAL",
              "MODEL",
              "POWER",
              "SOURCE",
              "CUSTOMER",
              "MOBILE",
              "CITY",
              "MANAGER",
              "PRICE",
              "DELIVERY",
              "REMARKS",
            ].map((item, index) =>
              item === "MOBILE" ? (
                <TooltipProvider  key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={` p-2 text-center text-white font-semibold ${
                          item === "REMARKS" ? "w-[300px]" : "w-[130px]"
                        }`}
                      >
                        {item}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div>Customer Mobile Number</div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <div
                  key={index}
                  className={` p-2 text-center text-white font-semibold ${
                    item === "REMARKS" ? "w-[300px]" : "w-[130px]"
                  }`}
                >
                  {item}
                </div>
              )
            )}
          </div>
          {data &&
            data.length > 0 &&
            data.map((item, ind) => (
              <div key={ind} className={`flex flex-row ${item.color}`}>
                {fieldOrder.map((key, index1) => (
                  <div
                    key={`${ind}-${index1}`}
                    className={`border border-gray-400 dark:border-gray-400 ${
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
                          value={item[key] || ""}
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
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
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
  NUMBER: "",
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
  "NUMBER",
  "CITY",
  "MANAGER",
  "PRICE",
  "DELIVERY",
  "REMARKS",
];
