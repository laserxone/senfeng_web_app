"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, Edit, Edit2, Filter } from "lucide-react";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import PageTable from "@/components/app-table-without-pagination";
import AppCalendar from "@/components/appCalendar";
import Dropzone from "@/components/dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { storage } from "@/config/firebase";
import axios from "@/lib/axios";
import exportToExcel from "@/lib/exportToExcel";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { getDownloadURL, ref } from "firebase/storage";
import moment from "moment";
import { useForm } from "react-hook-form";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { z } from "zod";
import { CustomerSearchWithData } from "../customer-search-with-data";
import { RequiredStar } from "../RequiredStar";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import Spinner from "../ui/spinner";
import FilterSheet from "./filterSheet";
import CurrencyFormatter from "../currency-formatter";
import useUserDetail from "@/hooks/use-user-detail";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export default function Reimbursement({
  id,
  passingData,
  onAddRefresh,
  onFilterReturn,
  onReset,
  onUpdatePurpose,
}) {
  const [filterVisible, setFilterVisible] = useState(false);
  const [data, setData] = useState([]);
  const [imageURL, setImageURL] = useState(null);
  const [visible, setVisible] = useState(false);
  const [reimbursementVisible, setReimbursementVisible] = useState(false);
  const [total, setTotal] = useState(0);
  const [resetLoading, setResetLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    setData([...passingData]);
  }, [passingData]);

  const columns = [
    {
      accessorKey: "date",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="ml-2">
          {row.getValue("date")
            ? moment(new Date(row.getValue("date"))).format("YYYY-MM-DD")
            : ""}
        </div>
      ),
    },

    {
      accessorKey: "title",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Purpose
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => {
        const currentItem = row.original;
        if (currentItem.customer_id)
          return <div className="ml-2">{currentItem?.purpose || ""}</div>;
        else return <div className="ml-2">{row.getValue("title")}</div>;
      },
    },

    {
      accessorKey: "customer",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Customer
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("customer")}</div>,
    },
    {
      accessorKey: "city",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            City
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div className="ml-2">{row.getValue("city")}</div>,
    },
    {
      accessorKey: "amount",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Amount
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("amount")}</div>,
    },

    {
      accessorKey: "description",
      filterFn: "includesString",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Description
            <ArrowUpDown />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("description")}</div>,
    },

    {
      id: "actions",
      cell: ({ row }) => {
        const currentItem = row.original;
        if (currentItem?.customer_id && !currentItem?.purpose)
          return (
            <Edit
              size={14}
              className="hover:cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedItem(currentItem);
              }}
            />
          );
      },
    },
  ];

  function handleDownload() {
    const headers = [
      "Date",
      "Customer",
      "City",
      "Amount",
      "Description",
      "Submitted By",
    ];

    const formattedData = [...data].map((item) => [
      moment(item.date).format("YYYY-MM-DD"),
      item.title,
      item?.city,
      Number(item.amount || 0),
      item.description,
      item.submitted_by_name,
    ]);
    exportToExcel(
      headers,
      formattedData,
      "Reimbursement.xlsx",
      false,
      "",
      false,
    );
  }

  useEffect(() => {
    let localTotal = 0;
    data.forEach((item) => {
      localTotal = localTotal + Number(item.amount);
    });
    setTotal(localTotal);
  }, [data]);

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-1">
        <PageTable
          columns={columns}
          data={data}
          onRowClick={(val, e) => {
            setImageURL(val);
            setVisible(true);
          }}
        >
          <Button
            onClick={() => setFilterVisible(true)}
            variant="ghost"
            className="p-0 w-8"
          >
            <Filter />
          </Button>

          <Button
            variant="destructive"
            onClick={async () => {
              setResetLoading(true);
              const startDate = moment().startOf("month").toISOString();
              const endDate = moment().endOf("month").toISOString();
              await onReset(startDate, endDate);
              setResetLoading(false);
            }}
          >
            {resetLoading && <Spinner />} Reset
          </Button>

          <Button onClick={() => setReimbursementVisible(true)}>
            Add Reimbursement
          </Button>

          <div className="flex flex-1 justify-between items-center">
            <Button onClick={handleDownload}>Download</Button>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CurrencyFormatter amount={total} />
                </div>
              </CardContent>
            </Card>
          </div>
        </PageTable>
      </div>

      <AddPurpose
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        visible={!!selectedItem}
        onUpdate={onUpdatePurpose}
      />

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onReturn={async (val) => {
          await onFilterReturn(val.start, val.end);
        }}
      />
      <ImageSheet
        visible={visible}
        onClose={() => setVisible(false)}
        img={imageURL?.image || null}
        description={imageURL?.description || null}
        submittedBy={imageURL?.submitted_by_name || null}
      />

      {/* <AddReimbursementDialog
        id={id}
        visible={reimbursementVisible}
        onClose={setReimbursementVisible}
        onRefresh={(val) => {
          if (val) {
            let temp = [...data];
            temp.push(val);
            temp.sort(
              (a, b) => moment(b.date).valueOf() - moment(a.date).valueOf(),
            );
            onAddRefresh(temp);
          }
          setReimbursementVisible(false);
        }}
      /> */}
    </div>
  );
}

const ImageSheet = ({
  visible,
  onClose,
  img,
  submittedBy,
  description,
}) => {

  const [imageOpen, setImageOpen] = useState(false);
  const [localImage, setLocalImage] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const isMountedRef = useRef(true);

  const fetchImage = useCallback(async () => {
    if (!img) return;

    if (img.includes("http")) {
      if (isMountedRef.current) setLocalImage(img);
    } else {
      try {
        const storageRef = ref(storage, img);
        const url = await getDownloadURL(storageRef);
     
        if (isMountedRef.current) setLocalImage(url);
      } catch (error) {
        console.error("Error fetching image URL:", error);
      }
    }
  }, [img]);

  // Use Effect to fetch image on mount or when img changes
  useEffect(() => {
    isMountedRef.current = true;
    fetchImage();

    return () => {
      isMountedRef.current = false;
      setLocalImage(null);
    };
  }, [fetchImage]);

  // Memoized function for closing modal
  const handleClose = useCallback(() => {
    if (!imageOpen) {
      onClose();
    }
  }, [imageOpen, onClose]);

  // Memoized function for zoom change
  const handleZoomChange = useCallback((shouldZoom) => {
    setIsZoomed(shouldZoom);
    if (!shouldZoom) {
      setImageOpen(false);
    }
  }, []);

  // Memoized local image URL to prevent unnecessary re-renders
  const memoizedImage = useMemo(() => localImage, [localImage]);

  return (
    <Sheet open={visible} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader className="mb-4">
          <SheetTitle>Bill Detail</SheetTitle>

          <strong>Submitted by</strong>
          <p>{submittedBy || "N/A"}</p>

          <strong>Description</strong>
          <p>{description || "No description available"}</p>

          {memoizedImage ? (
            <ControlledZoom isZoomed={isZoomed} onZoomChange={handleZoomChange}>
              <img
                onClick={() => setImageOpen(true)}
                className="hover:cursor-pointer"
                src={memoizedImage}
                alt="reimbursement-img"
                style={{
                  flex: 1,
                  maxWidth: "100%",
                  maxHeight: "400px",
                  objectFit: "contain",
                }}
              />
            </ControlledZoom>
          ) : (
            <p>Loading image...</p>
          )}
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

const AddReimbursementDialog = ({ visible, onClose, onRefresh, id }) => {
  const [selectedRadio, setSelectedRadio] = useState("customer");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const { state: OfficeState } = useContext(OfficeContext);
  const [loading, setLoading] = useState(false);
  const formSchema = z.object({
    title: z.string().min(1, { message: "Title is required." }),
    description: z.string().min(1, { message: "Description is required." }),
    amount: z
      .number()
      .min(0.01, { message: "Amount must be greater than zero." }),
    date: z.date({ required_error: "Date is required." }),
    image: z.string().min(1, { message: "Image is required." }),
    city: z.string().min(1, { message: "City is required." }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: "",
      date: "",
      image: "",
      city: "",
    },
  });

  async function onSubmit(values) {
    setLoading(true);
    try {
      const name = `${OfficeState.value.data}/${id}/reimbursement/${moment().valueOf().toString()}.png`;
      const imgRef = await UploadImage(values.image, name);
      const response = await axios.post(`/${id}/reimbursement`, {
        amount: values.amount,
        title: values.title,
        description: values.description,
        city: values.city,
        image: name,
        date: values.date,
        submitted_by: id,
      });
      onRefresh(response.data.reimbursement);
      form.reset();
      setSelectedCustomer(null);
      setSelectedRadio("customer");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(val) => {
        form.reset();
        setSelectedCustomer(null);
        setSelectedRadio("customer");
        setLoading(false);
        onClose(val);
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Reimbursement</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh] px-2">
          <div className="px-2 space-y-4">
            <RadioGroup
              defaultValue={selectedRadio}
              onValueChange={setSelectedRadio}
              className="flex"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="customer" id="r1" />
                <Label htmlFor="r1">Customer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="r2" />
                <Label htmlFor="r2">Other</Label>
              </div>
            </RadioGroup>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {selectedRadio == "customer" ? "Customer" : "Other"}{" "}
                        <RequiredStar />
                      </FormLabel>
                      <FormControl>
                        {selectedRadio === "other" ? (
                          <Input placeholder="Type here" {...field} />
                        ) : (
                          <CustomerSearchWithData
                            value={selectedCustomer}
                            onReturn={(val) => {
                              setSelectedCustomer(val);
                              if (val.location) {
                                form.setValue("city", val.location);
                              }
                              form.setValue("title", val.company || val.owner);
                            }}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        City <RequiredStar />
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Description <RequiredStar />
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Amount <RequiredStar />
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={field?.value ? field.value : ""}
                          onChange={(e) => {
                            if (!isNaN(e.target.value)) {
                              field.onChange(Number(e.target.value));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Date <RequiredStar />
                      </FormLabel>
                      <FormControl>
                        <AppCalendar
                          date={field.value}
                          onChange={field.onChange}
                          max={new Date()}
                          min={
                            new Date(
                              new Date().getFullYear(),
                              new Date().getMonth(),
                              1,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Image <RequiredStar />
                      </FormLabel>
                      <FormControl>
                        <div className="flex flex-1 items-center justify-center">
                          <Dropzone
                            value={field.value}
                            onDrop={(file) => {
                              field.onChange(file);
                            }}
                            title={"Click to upload"}
                            subheading={"or drag and drop"}
                            description={"PNG or JPG"}
                            drag={"Drop the files here..."}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button className="w-full" type="submit" disabled={loading}>
                  {loading && <Spinner />} Submit
                </Button>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const AddPurpose = ({ item, visible, onClose, onUpdate }) => {
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const { userID } = useUserDetail();

  function handleClose() {
    setPurpose("");
    setLoading(false);
    onClose();
  }
  async function handleSubmit() {
    if (!item?.id) return;

    try {
      setLoading(true);
      await axios.put(`/${userID}/reimbursement/${item.id}`, { purpose });
      let updatedItem = {...item}
      updatedItem.purpose = purpose
      onUpdate(updatedItem)
      handleClose()
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }
  return (
    <Dialog open={visible} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Missing Purpose</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Select Purpose</Label>
             <Select onValueChange={setPurpose} value={purpose}>
            <SelectTrigger>
              <SelectValue placeholder="Select Purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="New Installation">New Installation</SelectItem>
                <SelectItem value="Complaint">Complaint</SelectItem>
                 <SelectItem value="Overhauling">Overhauling</SelectItem>
                <SelectItem value="Sales Meeting">Sales Meeting</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>

          <Button disabled={loading || !purpose} onClick={handleSubmit}>
            {loading && <Spinner />}
            <span className="ml-1">Submit</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
