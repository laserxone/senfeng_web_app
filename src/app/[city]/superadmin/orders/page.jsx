"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Filter, Package } from "lucide-react";
import { useContext, useEffect, useState } from "react";

import CreateOrderDialog from "@/components/new-order";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import FilterSheet from "@/components/users/filterSheet";
import axios from "@/lib/axios";
import { UserContext } from "@/store/context/UserContext";
import moment from "moment";
import "react-medium-image-zoom/dist/styles.css";

export default function Page() {
  const [filterVisible, setFilterVisible] = useState(false);
  const [data, setData] = useState([]);
  const [imageURL, setImageURL] = useState(null);
  const [visible, setVisible] = useState(false);
  const [reimbursementVisible, setReimbursementVisible] = useState(false);
  const [total, setTotal] = useState(0);
  const { state: UserState } = useContext(UserContext);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (UserState.value.data?.id) {
      fetchData();
    }
  }, [UserState]);

  async function fetchData(startDate, endDate) {
    return new Promise((resolve, reject) => {
      axios
        .get(`/neworder?start_date=${startDate}&end_date=${endDate}`)
        .then((response) => {
          setData(response.data);
          resolve(true);
        })
        .catch((e) => {
          console.log(e);
          reject(null);
        })
        .finally(() => {
          setLoading(false);
        });
    });
  }

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex justify-between flex-wrap">
        <Heading title="Orders" description="Manage orders" />
      </div>

      <div className="flex gap-2 justify-between items-center">
        <div className="flex w-full flex-wrap gap-2 items-center">
          <div className="w-[350px]">
            <Input placeholder="Search order" />
          </div>
          <Button variant="ghost" className="p-0 w-8">
            <Filter />
          </Button>
          <Button variant="destructive">Clear</Button>
        </div>
        <Button onClick={() => setVisible(true)}>Create new order</Button>
      </div>

      <ScrollArea className="h-[700px] pr-6">
        <div className="space-y-6">
          {data.map((order) => {
            return (
              <Card key={order.id} className="border shadow-md">
                <CardContent className="p-4 space-y-2">
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

                    <Badge variant="outline" className="capitalize">
                      {order.status}
                    </Badge>
                  </div>

                  <Accordion type="single" collapsible>
                    <AccordionItem value={`order-${order.id}`}>
                      <AccordionTrigger className="text-sm font-medium">
                        View Items
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 mt-2">
                          {order?.order_items?.map((item) => (
                            <div
                              key={item.id}
                              className="p-3 bg-muted rounded-md border"
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-primary" />
                                  <span className="font-medium">
                                    {item.name}
                                  </span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {item.status}
                                </Badge>
                              </div>

                              <div className="mt-1 text-sm text-muted-foreground grid grid-cols-2 gap-1">
                                <span>Qty: {item.qty}</span>
                                <span>Price: ${item.price}</span>
                                {item.is_machine && (
                                  <>
                                    <span>Serial: {item.machine_serial}</span>
                                    <span>Model: {item.machine_model}</span>
                                    <span>Source: {item.machine_source}</span>
                                    <span>Power: {item.machine_power}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await fetchData(val.start, val.end, val.user);
        }}
      />

      <CreateOrderDialog
        visible={visible}
        onClose={setVisible}
        user_id={UserState.value.data?.id}
        onRefresh={fetchData}
      />
    </div>
  );
}
