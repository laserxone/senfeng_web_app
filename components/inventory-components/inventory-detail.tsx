"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/use-debounce";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import Spinner from "../ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
type InventoryRow = {
  QTY?: string | number;
  SERIAL?: string | number;
  MODEL?: string;
  POWER?: string;
  SOURCE?: string;
  CUSTOMER?: string;
  NUMBER?: string | number;
  CITY?: string;
  MANAGER?: string;
  PRICE?: string | number;
  DELIVERY?: string;
  REMARKS?: string;
  color?: string;
  [key: string]: any; 
};

type ApiData = {
  id: string | number;
  shipment?: string;
  data?: InventoryRow[];
};
type Field = typeof fieldOrder[number];
export default function InventoryDetail({ booking_id }:{booking_id?:string|number}) {
  const {userID} = useUserDetail()
  const [focusedRow, setFocusedRow] = useState(null);
  const [focusedBoard, setFocusedBoard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const tableRef = useRef(null);
  const [prefetching, setPrefetching] = useState(true);
  const [data, setData] = useState([]);
  const [apiData, setApiData] = useState<ApiData>();
  const debouncedData = useDebounce(data, 1000);
  const tableContainerRef = useRef(null);
  const [tableMaxHeight, setTableMaxHeight] = useState("auto");
  const [availableWidth, setAvailableWidth] = useState("full");
  const [allCustomers, setAllCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [visible, setVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

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
            setLoadingMessage("");
            setLoading(false);
          });
      }
  }, [debouncedData, prefetching]);

  useEffect(() => {
    if (userID && booking_id) {
      fetchData();
      fetchCustomerData();
    }
  }, [userID]);

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

  async function fetchCustomerData() {
    axios.get(`/customer?withoutsale=true`).then((response) => {
      if (response.data.length > 0) {
        const apiData = response.data.sort((a, b) =>
          a?.name.localeCompare(b?.name || "")
        );
        const finalData = apiData
          .map((item) => {
            return { ...item, value: item.id, label: item.name || item.owner };
          })
          .filter((item) => !!item.label);
        setAllCustomers(finalData);
      }
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

  const handleCustomerSelect = (customerId, rowIndex) => {
    const selected = allCustomers.find((c) => c.value === customerId);
    if (!selected) return;

    const updatedData = [...data];

    updatedData[rowIndex] = {
      ...updatedData[rowIndex],
      CUSTOMER: selected.label || "",
      NUMBER:
        Array.isArray(selected.number) && selected.number.length > 0
          ? selected.number[0]
          : "",
      CITY: selected.location || "",
    };

    setData(updatedData);
    setVisible(false);
    setSelectedIndex(null);
  };

  useEffect(() => {
    if (!visible) {
      document.body.style.pointerEvents = "auto";
    }
  }, [visible]);


  return (
    <>
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
                }, 1000);
              }}
              disabled={loading}
            >
              {loading && <Spinner />}
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
              ].map((item: Field, index) =>
                item === "MOBILE" ? (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={` p-2 text-center text-white font-semibold ${
                            "w-[300px]"
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
                    <ContextMenu modal={false}>
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
                                  : isNaN(Number(inputValue))
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
                            onClick={() => {
                              setSelectedIndex(ind);
                              setVisible(true);
                            }}
                          >
                            Select customer
                          </ContextMenuItem>
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
      <CustomPopup visible={visible} onClose={() => setVisible(false)}>
        <h2 className="text-lg font-semibold mb-4">Select Customer</h2>

        <CustomerSearch
          customers={allCustomers}
          onReturn={setSelectedCustomer}
          value={selectedCustomer}
        />

        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => {
              handleCustomerSelect(selectedCustomer, selectedIndex);
            }}
          >
            OK
          </Button>
        </div>
      </CustomPopup>
    </>
  );
}

function CustomPopup({ visible, onClose, children }) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[500px] max-h-[80vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {children}
      </div>
    </div>
  );
}

function CustomerSearch({ value, onReturn, customers }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? customers.find((item) => item.value === value)?.label
            : "Select customer..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="py-2 px-0">
        <Command>
          <CommandInput placeholder="Search customer..." className="h-9" />
          <CommandList>
            <CommandEmpty>No customer found.</CommandEmpty>
            <CommandGroup>
              {customers.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => {
                    onReturn(Number(item.value));
                    setOpen(false);
                  }}
                >
                  {item.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
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
