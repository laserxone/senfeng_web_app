import Dropzone from "@/components/dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { storage } from "@/config/firebase";
import { BASE_URL } from "@/constants/data";
import { UploadImage } from "@/lib/uploadFunction";
import { UserContext } from "@/store/context/UserContext";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/lib/axios";
import { getDownloadURL, ref } from "firebase/storage";
import { Filter, Loader2, MapPin, MapPinOff, Trash2 } from "lucide-react";
import moment from "moment";
import { useCallback, useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { z } from "zod";
import AddCustomerDialog from "../addCustomer";
import AppCalendar from "../appCalendar";
import { CustomerSearchWithData } from "../customer-search-with-data";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import FilterSheet from "./filterSheet";
import Link from "next/link";
import Spinner from "../ui/spinner";
import { DeleteFromStorage } from "@/lib/deleteFunction";

const formSchema = z.object({
  note: z.string().min(1, "Note cannot be empty"),
  image: z.string().min(1, "image cannot be empty"),
  next: z.date(),
});

export default function VisitTab({
  id,
  data,
  onRefresh,
  disable = false,
  customer_data,
  height = "h-[calc(100dvh-300px)]",
  onFetchData,
}) {
  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState(data || []);
  const [addCustomer, setAddCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const { state: UserState } = useContext(UserContext);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedDelete, setSelectedDelete] = useState(null);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: "",
      image: "",
      next: null,
    },
  });

  useEffect(() => {
    if (customer_data) {
      setSelectedCustomer({ id: customer_data });
    }
  }, [customer_data]);

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      if (values.image) {
        const name = `${id}/visit/${moment().valueOf().toString()}.png`;
        const uploadRef = await UploadImage(values.image, name);
        const response = await axios.post(`/user/${id}/visit`, {
          ...values,
          user_id: id,
          image: name,
          customer_id: selectedCustomer?.id,
        });
        await onRefresh();
        form.reset();
        setSelectedCustomer(null);
        setLoading(false);
      } else {
        const response = await axios.post(`/user/${id}/visit`, {
          ...values,
          user_id: id,
          customer_id: selectedCustomer?.id,
        });
        await onRefresh();
        form.reset();
        setSelectedCustomer(null);
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const RenderCustomerSearch = useCallback(() => {
    return (
      <CustomerSearchWithData
        value={selectedCustomer}
        onReturn={(val) => {
          setSelectedCustomer(val);
          form.setValue("city", val.location);
          form.setValue("name", val.owner);
          form.setValue("phone", val.number.join(", "));
          form.setValue("company", val.name);
        }}
      />
    );
  }, [selectedCustomer]);

  async function handleDelete(item) {
    try {
      setSelectedDelete(item.id);
      const response = await DeleteFromStorage(item.image);
      axios
        .delete(`/visit/${item.id}`)
        .then(async () => {
          await onRefresh();
        })
        .finally(() => {
          setSelectedDelete(null);
        });
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <ScrollArea className={`${height} pr-5`}>
      <div className="space-y-4 w-full">
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold">Remarks</h2>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, (err) => {
                  console.log("Validation Errors", err);
                })}
                className="space-y-3"
              >
                {!disable && (
                  <div className="flex flex-row gap-2 items-end">
                    <div>
                      <FormLabel>Select Customer</FormLabel>
                      <RenderCustomerSearch />
                    </div>

                    <Button onClick={() => setAddCustomer(true)}>
                      Add new customer
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={() => {
                        setSelectedCustomer(null);
                        form.reset();
                      }}
                    >
                      Clear
                    </Button>

                    <Button
                      onClick={() => setFilterVisible(true)}
                      variant="ghost"
                      className="p-0 w-8"
                    >
                      <Filter />
                    </Button>

                    <FilterSheet
                      visible={filterVisible}
                      onClose={() => setFilterVisible(false)}
                      onReturn={async (val) => {
                        await onFetchData(
                          val.start.toISOString(),
                          val.end.toISOString(),
                          val.user
                        );
                      }}
                    />

                    <AddCustomerDialog
                      user_id={UserState.value.data?.id}
                      ownership={
                        UserState.value.data?.designation === "Owner" ||
                        UserState.value.data?.designation ===
                          "Customer Relationship Manager" ||
                        UserState.value.data?.designation ===
                          "Customer Relationship Manager (After Sales)"
                      }
                      visible={addCustomer}
                      onClose={setAddCustomer}
                      onRefresh={async (newRow) => {
                        const finalData = {
                          ...newRow,
                          search: newRow.name || newRow.owner,
                        };
                        setSelectedCustomer(finalData);

                        // setData([]);
                        // await fetchData();
                      }}
                    />
                  </div>
                )}
                <div className="flex flex-1 gap-5">
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <div>
                        <FormLabel>Image</FormLabel>
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
                      </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="next"
                    render={({ field }) => (
                      <div>
                        <FormLabel>Next follow Up</FormLabel>
                        <FormControl>
                          <AppCalendar
                            date={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <div>
                      <FormLabel>Write something</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="Write something..."
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  )}
                />

                <Button type="submit" className="mt-2 w-full">
                  {loading && <Loader2 className="animate-spin" />} Post
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {feedbacks.length > 0 && (
          <div className="space-y-3">
            {feedbacks.map((feedback, index) => (
              <Card key={index}>
                <CardHeader className="p-0 flex overflow-hidden">
                  <div
                    className="flex flex-1 justify-between items-center bg-gray-200 py-2 px-4"
                    style={{
                      borderTopRightRadius: 10,
                      borderTopLeftRadius: 10,
                    }}
                  >
                    <div className="flex gap-5">
                      <Label style={{ fontWeight: 600, fontSize: "16px" }}>
                        Visit Record
                      </Label>
                      <Label>Operated by: {feedback?.user_name}</Label>
                    </div>
                    <div className="flex gap-5">
                      <Label>
                        {moment(new Date(feedback.created_at)).format(
                          "YYYY-MM-DD hh:mm A"
                        )}
                      </Label>
                      {selectedDelete === feedback.id ? (
                        <Spinner size={16} />
                      ) : (
                        <Trash2
                          size={16}
                          color="red"
                          className="hover:opacity-70 cursor-pointer"
                          onClick={() => handleDelete(feedback)}
                        />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <Link
                    target="blank"
                    href={`/${UserState.value.data?.base_route}/${
                      feedback.customer_member ? "member" : "customer"
                    }/detail?id=${feedback.customer_id}`}
                  >
                    <p className="text-sm text-gray-500">
                      {feedback?.customer_name || feedback?.customer_owner} -{" "}
                      {feedback?.customer_location} -{" "}
                      {feedback?.customer_number.join(", ")}
                    </p>
                  </Link>
                  <p className="mt-2">{feedback.note}</p>
                  <div className="flex flex-row gap-5 mt-2">
                    {feedback.location && feedback.location.length > 0 ? (
                      <MapPin
                        onClick={() => {
                          const mapUrl = `https://www.google.com/maps?q=${feedback.location[0]},${feedback.location[1]}`;
                          window.open(mapUrl, "_blank");
                        }}
                        className="text-red-500 h-5 w-5 cursor-pointer hover:opacity-50"
                      />
                    ) : (
                      <MapPinOff className="text-red-500 h-5 w-5 opacity-50" />
                    )}
                    {feedback.image && <MyImg img={feedback.image} />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

const MyImg = ({ img }) => {
  const [localImage, setLocalImage] = useState(null);

  useEffect(() => {
    if (img) {
      if (img.includes("http")) {
        setLocalImage(img);
      } else {
        getDownloadURL(ref(storage, img)).then((url) => {
          setLocalImage(url);
        });
      }
    }
  }, [img]);
  if (localImage)
    return (
      <Zoom>
        <img alt="visit image" src={localImage} width="100" />
      </Zoom>
    );
};
