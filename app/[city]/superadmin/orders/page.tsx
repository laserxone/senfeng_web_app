"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Calendar,
  Edit,
  Filter,
  Package,
  Plus,
  Trash2
} from "lucide-react";
import { useEffect, useState } from "react";

import AddOrderDialog from "@/components/add-order";
import EditOrderDialog from "@/components/edit-order";
import CreateOrderDialog from "@/components/new-order";
import SortableCard from "@/components/sortable-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import  Heading  from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import FilterSheet from "@/components/users/filterSheet";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import moment from "moment";
import Image from "next/image";
import "react-medium-image-zoom/dist/styles.css";
import ConfimationDialog from "@/components/alert-dialog";
import BookOrderDialog from "@/components/book-order";

const colorClasses = [
  { bg: "bg-red-100", text: "text-red-800" },
  { bg: "bg-blue-100", text: "text-blue-800" },
  { bg: "bg-green-100", text: "text-green-800" },
  { bg: "bg-yellow-100", text: "text-yellow-800" },
  { bg: "bg-purple-100", text: "text-purple-800" },
  { bg: "bg-pink-100", text: "text-pink-800" },
  { bg: "bg-indigo-100", text: "text-indigo-800" },
  { bg: "bg-teal-100", text: "text-teal-800" },
  { bg: "bg-orange-100", text: "text-orange-800" },
  { bg: "bg-gray-100", text: "text-gray-800" },
];

export default function Page() {
  const [filterVisible, setFilterVisible] = useState(false);
  const [data, setData] = useState([]);
  const [visible, setVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemForBook, setSelectedItemForBook] = useState(null);
  const { userID } = useUserDetail();
  const [orderedData, setOrderedData] = useState([]);
  const [search, setSearch] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState(null)

  useEffect(() => {
    const savedOrder = localStorage.getItem("cardOrder");
    if (savedOrder) {
      const orderArr = JSON.parse(savedOrder);
      const reordered = orderArr
        .map((id) => data.find((o) => o.id === id))
        .filter(Boolean);
      const extras = data.filter((o) => !orderArr.includes(o.id));
      setOrderedData([...reordered, ...extras]);
    } else {
      setOrderedData(data);
    }
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = orderedData.findIndex((item) => item.id === active.id);
      const newIndex = orderedData.findIndex((item) => item.id === over.id);
      const newData = arrayMove(orderedData, oldIndex, newIndex);
      setOrderedData(newData);
      localStorage.setItem(
        "cardOrder",
        JSON.stringify(newData.map((item) => item.id))
      );
    }
  }

  useEffect(() => {
    if (userID) {
      fetchData();
    }
  }, [userID]);

  async function fetchData(startDate, endDate) {
    return new Promise((resolve, reject) => {
      axios
        .get(`/${userID}/neworder?start_date=${startDate}&end_date=${endDate}`)
        .then((response) => {
          const rawData = response.data;

          const typeColorMap = new Map();
          let colorIndex = 0;

          const updatedData = rawData.map((order) => {
            // ✅ First: sort all order_items by machine_serial (numeric ascending)
            const sortedOrderItems = [...order.order_items].sort((a, b) => {
              const serialA = parseInt(a.machine_serial, 10);
              const serialB = parseInt(b.machine_serial, 10);
              if (isNaN(serialA) || isNaN(serialB)) {
                // fallback: string comparison if not numeric
                return a.machine_serial.localeCompare(b.machine_serial);
              }
              return serialA - serialB;
            });

            const groupedMachines = {};

            // Group machine items by typeKey after sorting
            for (const item of sortedOrderItems) {
              if (item.is_machine) {
                const typeKey = `${item.machine_model}-${item.machine_power}-${item.machine_source}`;
                if (!groupedMachines[typeKey]) groupedMachines[typeKey] = [];
                groupedMachines[typeKey].push(item);
              }
            }

            const finalMachineItems = [];

            for (const typeKey in groupedMachines) {
              const items = groupedMachines[typeKey];

              // Assign color if not already assigned
              if (!typeColorMap.has(typeKey)) {
                const color = colorClasses[colorIndex % colorClasses.length];
                typeColorMap.set(typeKey, color);
                colorIndex++;
              }

              const assignedColor = typeColorMap.get(typeKey);

              let counter = 1;

              // ✅ Keep original order (booked/unbooked mixed)
              items.forEach((item) => {
                finalMachineItems.push({
                  ...item,
                  machine_color_bg: assignedColor.bg,
                  machine_color_text: assignedColor.text,
                  machine_type_count: counter++,
                });
              });
            }

            finalMachineItems.sort((a, b) => {
              const serialA = parseInt(a.machine_serial, 10);
              const serialB = parseInt(b.machine_serial, 10);
              if (isNaN(serialA) || isNaN(serialB)) {
                // fallback: string comparison if not numeric
                return a.machine_serial.localeCompare(b.machine_serial);
              }
              return serialA - serialB;
            });

            const nonMachineItems = sortedOrderItems.filter((i) => !i.is_machine);

            const finalItems = [...finalMachineItems, ...nonMachineItems];

            return {
              ...order,
              order_items: finalItems,
            };
          });

          setData(updatedData);

          resolve(true);
        })
        .catch((e) => {
          console.log(e);
          reject(null);
        });
    });
  }


  async function handleDelete(orderId) {
    setDeleteLoading(true)
    axios.delete(`/${userID}/neworder/${orderId}`).then(() => {
      fetchData();
      setSelectedShipment(null)
    }).finally(() => {
      setDeleteLoading(false)
    })
  }

  function handleEditItem(itemId) {
    setSelectedItem(itemId);
  }


  function handleBookItem(itemId) {
    setSelectedItemForBook(itemId)
  }

  const filteredData = orderedData?.map((order) => {
    if (!search.trim()) return order; // no search → keep everything

    // Filter order_items for this order
    const filteredItems = order.order_items.filter((item) =>
      Object.entries(item).some(([_, value]) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(search.toLowerCase());
      })
    );

    // If no items match, drop the order entirely
    if (filteredItems.length === 0) return null;

    return {
      ...order,
      order_items: filteredItems,
    };
  }).filter(Boolean); // remove null orders


  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex justify-between flex-wrap">
        <Heading title="Orders" description="Manage orders" />
      </div> 

      <div className="flex gap-2 justify-between items-center">
        <div className="flex w-full flex-wrap gap-2 items-center">
          <div className="w-[350px]">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order" />
          </div>
          <Button variant="ghost" className="p-0 w-8">
            <Filter />
          </Button>
          <Button variant="destructive">Clear</Button>
        </div>
        <Button onClick={() => setVisible(true)}>Create new order</Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedData.map((order) => order.id)}
          strategy={verticalListSortingStrategy}
        >
          {/* <ScrollArea className="h-[700px] pr-6"> */}
            <div className="space-y-4">
              {filteredData.map((order) => {
                return (
                  <SortableCard
                    key={order.id}
                    order={order}
                    dragHandle={
                      <div className="cursor-grab p-1 text-muted-foreground">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M7 4h2v2H7V4zM11 4h2v2h-2V4zM7 8h2v2H7V8zM11 8h2v2h-2V8zM7 12h2v2H7v-2zM11 12h2v2h-2v-2z" />
                        </svg>
                      </div>
                    }
                  >
                    <Card className="border shadow-md w-full">
                      <CardContent className="p-4 space-y-1">
                        <div className="flex items-end justify-between">
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Order By: {order.user_name}
                            </p>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {moment(order.created_at).format("YYYY-MM-DD")}
                              </span>
                            </div>
                          </div>

                          <h2 className="text-xl font-semibold text-primary">
                            {order?.title}
                          </h2>

                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between">
                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedShipment(order.id)
                                  // handleDelete(order.id)
                                }}
                              >
                                <Trash2 size={14} />
                              </Button>

                              <Button
                                size="icon"
                                onClick={() => {
                                  setSelectedOrder(order.id);
                                }}
                              >
                                <Plus size={14} />
                              </Button>
                            </div>

                            <Badge variant="outline" className="capitalize">
                              {order.status}
                            </Badge>
                          </div>
                        </div>

                        <Accordion type="single" collapsible>
                          <AccordionItem value={`order-${order.id}`}>
                            <AccordionTrigger className="text-sm font-medium h-5">
                              View Items
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-1 mt-1">
                                {order?.order_items?.map((item) => (
                                  <div
                                    key={item.id}
                                    className={`relative px-2 py-1 ${item.is_machine
                                      ? item.machine_color_bg
                                      : "bg-muted"
                                      } rounded-md border ${item.is_machine && item.machine_color_text
                                      }`}
                                  >
                                    {item?.booked && (
                                      <Image
                                        src="/booked.png"
                                        height={100}
                                        width={100}
                                        alt="Booked"
                                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-30 z-0"
                                      />
                                    )}

                                    <div className="relative z-10">
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold">
                                            {item?.machine_type_count}
                                          </span>
                                          <Package className="w-4 h-4 text-[#0A6666]" />
                                          <span className="font-medium">
                                            {item.name}
                                            {item.location &&
                                              item.location === "Lahore" ? (
                                              <Badge
                                                variant="outline"
                                                className="bg-blue-500 text-white dark:bg-blue-600 ml-2 hover:none"
                                              >
                                                {item?.location}
                                              </Badge>
                                            ) : (
                                              <Badge
                                                variant="destructive"
                                                className="text-xs ml-2"
                                              >
                                                {item?.location}
                                              </Badge>
                                            )}

                                          </span>
                                        </div>

                                        <div className="flex gap-2 items-center">
                                          <div>
                                            <Badge
                                              className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.show
                                                ? "bg-green-100 text-green-700 border-green-200"
                                                : "bg-red-100 text-red-700 border-red-200"
                                                }`}
                                            >
                                              {item?.show ? "Showing" : "Hidden"}
                                            </Badge>
                                          </div>

                                          <div>
                                            <Badge
                                              variant="outline"
                                              className="text-xs px-3 py-1 rounded-full border border-blue-300 bg-blue-50 text-blue-800"
                                            >
                                              {item.status}
                                            </Badge>
                                          </div>
                                          {!item.booked &&
                                            <Button size="sm" onClick={() => {
                                              handleBookItem(item)
                                            }}>
                                              Book
                                            </Button>
                                          }
                                          <Button
                                            size="icon"
                                            onClick={() => handleEditItem(item)}
                                          >
                                            <Edit size={14} />
                                          </Button>
                                        </div>
                                      </div>

                                      <div
                                        className={`text-sm text-muted-foreground grid grid-cols-4 gap-1 ${item.is_machine
                                          ? item.machine_color_text
                                          : "text-muted-foreground"
                                          }`}
                                      >
                                        {item.is_machine && (
                                          <>
                                            <span>
                                              Serial: {item?.machine_serial}
                                            </span>
                                            <span>
                                              Model: {item?.machine_model}
                                            </span>
                                            <span>
                                              Source: {item?.machine_source}
                                            </span>
                                            <span>
                                              Power: {item?.machine_power}
                                            </span>
                                            <span>
                                              Customer:{" "}
                                              {item?.customer_name ||
                                                item?.customer_owner}
                                            </span>
                                            <span>
                                              Booked by: {item?.booked_by_name}
                                            </span>
                                            <span>
                                              Booking Date:{" "}
                                              {item?.booking_date
                                                ? moment(
                                                  item?.booking_date
                                                ).format("YYYY-MM-DD")
                                                : ""}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </CardContent>
                    </Card>
                  </SortableCard>
                );
              })}
            </div>
          {/* </ScrollArea> */}
        </SortableContext>
      </DndContext>

      <FilterSheet
      user_disable={false}
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await fetchData(val.start, val.end, val.user);
        }}
      />

      <CreateOrderDialog
        visible={visible}
        onClose={setVisible}
        user_id={userID}
        onRefresh={fetchData}
      />

      <AddOrderDialog
        visible={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        user_id={userID}
        id={selectedOrder}
        onRefresh={fetchData}
      />

      <EditOrderDialog
        visible={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        user_id={userID}
        id={selectedItem?.id}
        onRefresh={fetchData}
        item={selectedItem}
      />

      <BookOrderDialog
        visible={!!selectedItemForBook}
        onClose={() => setSelectedItemForBook(null)}
        user_id={userID}
        id={selectedItemForBook?.id}
        onRefresh={fetchData}
        item={selectedItemForBook}
      />

      <ConfimationDialog
        loading={deleteLoading}
        open={!!selectedShipment}
        title={"Are you sure you want to delete?"}
        description={"Your action will remove shipment from the system"}
        onPressYes={() => handleDelete(selectedShipment)}
        onPressCancel={() => setSelectedShipment(null)}
      />
    </div>
  );
}
