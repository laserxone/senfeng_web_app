"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
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
  Trash2,
  Warehouse
} from "lucide-react";
import { useEffect, useState } from "react";

import AddOrderDialog from "@/components/add-order";
import ConfirmationDialog from "@/components/alert-dialog";
import BookOrderDialog from "@/components/book-order";
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
import Heading from "@/components/ui/heading";
import FilterSheet from "@/components/users/filter-sheet";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { Order, OrderItem } from "@/lib/types";
import moment from "moment";
import Image from "next/image";

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
  const [data, setData] = useState<Order[]>([]);
  const [visible, setVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<number | undefined | null>(null);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [selectedItemForBook, setSelectedItemForBook] = useState<OrderItem | null>(null);
  const { userID } = useUserDetail();
  const [orderedData, setOrderedData] = useState<Order[]>([]);
  const [search, setSearch] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<number | null | undefined>(null)
  const [selectedStock, setSelectedStock] = useState("")

  useEffect(() => {
    const savedOrder = localStorage.getItem("cardOrder");
    if (savedOrder) {
      const orderArr: number[] = JSON.parse(savedOrder);
      const reordered = orderArr
        .map((id) => data.find((o) => o.id === id))
        .filter((o): o is Order => o !== undefined);
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = orderedData.findIndex((item) => item.id === active.id);
      const newIndex = orderedData.findIndex((item) => item.id === over?.id);
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

  async function fetchData(startDate?: string, endDate?: string) {
    return new Promise<void>((resolve, reject) => {
      axios
        .get(`/${userID}/neworder?start_date=${startDate}&end_date=${endDate}`)
        .then((response) => {
          const rawData = response.data;

          const typeColorMap = new Map();
          let colorIndex = 0;

          const updatedData = rawData.map((order: any) => {

            const sortedOrderItems = [...order.order_items].sort((a, b) => {
              const serialA = parseInt(a.machine_serial, 10);
              const serialB = parseInt(b.machine_serial, 10);
              if (isNaN(serialA) || isNaN(serialB)) {

                return a.machine_serial.localeCompare(b.machine_serial);
              }
              return serialA - serialB;
            });

            const groupedMachines: any = {};


            for (const item of sortedOrderItems) {
              if (item.is_machine) {
                const typeKey = `${item.machine_model}-${item.machine_power}-${item.machine_source}`;
                if (!groupedMachines[typeKey]) groupedMachines[typeKey] = [];
                groupedMachines[typeKey].push(item);
              }
            }

            const finalMachineItems: any[] = [];

            for (const typeKey in groupedMachines) {
              const items = groupedMachines[typeKey];


              if (!typeColorMap.has(typeKey)) {
                const color = colorClasses[colorIndex % colorClasses.length];
                typeColorMap.set(typeKey, color);
                colorIndex++;
              }

              const assignedColor = typeColorMap.get(typeKey);

              let counter = 1;


              items.forEach((item: any) => {
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
          resolve();
        })
        .catch((e) => {
          console.log(e);
          reject(null);
        });
    });
  }




  async function handleDelete(orderId?: number | null) {
    if (!orderId) return
    setDeleteLoading(true)
    axios.delete(`/${userID}/neworder/${orderId}`).then(() => {
      fetchData();
      setSelectedShipment(null)
    }).finally(() => {
      setDeleteLoading(false)
    })
  }

  function handleEditItem(itemId: OrderItem) {
    setSelectedItem(itemId);
  }


  function handleBookItem(itemId: OrderItem) {
    setSelectedItemForBook(itemId)
  }

 const filteredData = orderedData
  ?.map((order) => {
    if (!search.trim() && !selectedStock) return order;

    const filteredItems = order.order_items
      .filter((item) => {
        if (!selectedStock) return true;

        return (
          item.location?.toLowerCase() === selectedStock.toLowerCase()
        );
      })
      .filter((item) =>
        !search.trim()
          ? true
          : Object.entries(item).some(([_, value]) => {
              if (value === null || value === undefined) return false;
              return String(value)
                .toLowerCase()
                .includes(search.toLowerCase());
            })
      );

    if (filteredItems.length === 0) return null;

    return {
      ...order,
      order_items: filteredItems,
    };
  })
  .filter((order): order is typeof order => order !== null);


  return (
    <div className="flex flex-1 flex-col space-y-4 py-2">
      <div className="flex justify-between flex-wrap">
        <Heading title="Orders" description="Manage orders" />

        <div className="flex flex-wrap gap-2">
          {[
            {
              key: "lahore",
              label: "Lahore Stock",
            },
            {
              key: "karachi",
              label: "Karachi Stock",
            },
          ].map((item) => {
            const active = selectedStock === item.key;

            const total = orderedData.flatMap(
              (order) => order.order_items
            ).filter((it)=> !it.customer_id).filter(
              (it) => it.location?.toLowerCase() === item.key?.toLocaleLowerCase()
            ).length;

            return (
              <button
                key={item.key}
                onClick={() =>
                  setSelectedStock(
                    active ? "" : item.key
                  )
                }
                className={`
          flex items-center gap-3 rounded-xl border px-4 py-3
          transition-all duration-200
          hover:shadow-sm
          ${active
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "bg-background hover:bg-muted/40"
                  }
        `}
              >
                <div
                  className={`
            rounded-lg p-2
            ${active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                    }
          `}
                >
                  <Warehouse className="h-4 w-4" />
                </div>

                <div className="text-left">
                  <p className="text-xs text-muted-foreground">
                    Warehouse
                  </p>
                  <p className="text-sm font-semibold">
                    {item.label}
                  </p>

                  <p className="text-sm font-semibold">
                    {total || "0"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
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
                  key={order?.id}
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
                            Order By: {order?.user_name}
                          </p>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {moment(order?.created_at).format("YYYY-MM-DD")}
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
                                setSelectedShipment(order?.id)
                                // handleDelete(order.id)
                              }}
                            >
                              <Trash2 size={14} />
                            </Button>

                            <Button
                              size="icon"
                              onClick={() => {
                                setSelectedOrder(order?.id);
                              }}
                            >
                              <Plus size={14} />
                            </Button>
                          </div>

                          <Badge variant="outline" className="capitalize">
                            {order?.status}
                          </Badge>
                        </div>
                      </div>

                      <Accordion type="single" collapsible>
                        <AccordionItem value={`order-${order?.id}`}>
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
                                            item.location?.toLocaleLowerCase() === "lahore" ? (
                                            <Badge
                                              variant="outline"
                                              className="bg-blue-500 text-white dark:bg-blue-600 ml-2 hover:none"
                                            >
                                              {item?.location?.charAt(0)?.toUpperCase() + item?.location?.slice(1)}
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
          await fetchData(val.start, val.end);
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
        id={selectedItem?.id}
        onRefresh={fetchData}
        item={selectedItem}
      />

      <BookOrderDialog
        visible={!!selectedItemForBook}
        onClose={() => setSelectedItemForBook(null)}
        id={selectedItemForBook?.id}
        onRefresh={fetchData}
        item={selectedItemForBook}
      />

      <ConfirmationDialog
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
