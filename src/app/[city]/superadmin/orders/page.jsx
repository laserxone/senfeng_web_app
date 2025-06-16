"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowUpDown,
  Calendar,
  Filter,
  Loader2,
  Package,
  Trash,
} from "lucide-react";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import ConfimationDialog from "@/components/alert-dialog";
import PageTable from "@/components/app-table";
import AppCalendar from "@/components/appCalendar";
import Dropzone from "@/components/dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Heading } from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Spinner from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { UserSearch } from "@/components/user-search";
import FilterSheet from "@/components/users/filterSheet";
import { storage } from "@/config/firebase";
import axios from "@/lib/axios";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import exportToExcel from "@/lib/exportToExcel";
import { UploadImage } from "@/lib/uploadFunction";
import { UserContext } from "@/store/context/UserContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { getDownloadURL, ref } from "firebase/storage";
import moment from "moment";
import { useForm } from "react-hook-form";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { z } from "zod";
import { getStoragePathFromUrl } from "@/components/customer-components/machine/machine-component";
import { TIMEZONE } from "@/constants/data";
import momentT from "moment-timezone";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CustomerSearchWithData } from "@/components/customer-search-with-data";
import { RequiredStar } from "@/components/RequiredStar";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CreateOrderDialog from "@/components/new-order";


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
      fetchData()
    }
  }, [UserState]);

  async function fetchData(startDate, endDate) {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `/neworder?start_date=${startDate}&end_date=${endDate}`
        )
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
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-primary">
                        Order #{order.id}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Order By: {order.user_name}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {order.status}
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{moment(order.created_at).format("YYYY-MM-DD")}</span>
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

      <CreateOrderDialog visible={visible} onClose={setVisible} user_id={UserState.value.data?.id} onRefresh={fetchData}/>
    </div>
  );
}


