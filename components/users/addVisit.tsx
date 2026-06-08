import Dropzone from "@/components/dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { storage } from "@/config/firebase";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { DeleteFromStorage } from "@/lib/deleteFunction";
import { UploadImage } from "@/lib/uploadFunction";
import { OfficeContext } from "@/store/context/OfficeContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { getDownloadURL, ref } from "firebase/storage";
import {
  Filter,
  MapPin,
  MapPinOff,
  Trash2
} from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useCallback, useContext, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { z } from "zod";
import AddCustomerDialog from "../addCustomer";
import AppCalendar from "../appCalendar";
import { CustomerSearchWithData } from "../customer-search-with-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import Spinner from "../ui/spinner";
import FilterSheet from "./filterSheet";
import { MyCustomer, SalesVisitTypes } from "@/lib/types";
import { Field, FieldError, FieldLabel } from "../ui/field";

const formSchema = z.object({
  note: z.string().min(1, "Note cannot be empty"),
  image: z.string().min(1, "image cannot be empty"),
  next: z.date(),
  city: z.string().min(1, "City is required"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  company: z.string().min(1, "Company is required")
});

type FormValues = z.infer<typeof formSchema>;


type VisitTabProps = {
  id: number | null | string;
  data: SalesVisitTypes[];
  onRefresh: () => Promise<void>;
  disable?: boolean;
  customer_data?: number | null;
  height?: string;
  onFetchData?: (a: string, b: string, c?: number) => Promise<void>;
};
export default function VisitTab({
  id,
  data,
  onRefresh,
  disable = false,
  customer_data,
  height,
  onFetchData,
}: VisitTabProps) {
  const [loading, setLoading] = useState(false);
  const [feedbacks] = useState<SalesVisitTypes[]>(data || []);
  const [addCustomer, setAddCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<MyCustomer | null>(null);
  const { userID, designation, office, base_route, route_branch } = useUserDetail()
  const { state: OfficeState } = useContext(OfficeContext)!
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedDelete, setSelectedDelete] = useState<number | null>(null);
  const [selectedSignature, setSelectedSignature] = useState(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: "",
      image: "",
      next: undefined,
      city: "",
      name: "",
      phone: "",
      company: ""
    },
  });

  useEffect(() => {
    if (customer_data) {
      setSelectedCustomer({ id: customer_data });
    }
  }, [customer_data]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      if (values.image) {
        const name = `${OfficeState.value.data}/customer/${selectedCustomer?.id}/visit/${moment()
          .valueOf()
          .toString()}.png`;
        const uploadRef = await UploadImage(values.image, name);
        const response = await axios.post(`/${id}/visit`, {
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
        const response = await axios.post(`/${id}/visit`, {
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
          form.setValue("city", val?.location || "");
          form.setValue("name", val?.owner || "");
          form.setValue("phone", val.number ? val?.number?.join(", ") : "");
          form.setValue("company", val?.name || "");
        }}
      />
    );
  }, [selectedCustomer]);

  async function handleDelete(item: SalesVisitTypes) {
    try {
      setSelectedDelete(item.id);
      DeleteFromStorage(item.image);
      axios
        .delete(`/${userID}/visit/${item.id}`)
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
    <div className="w-full">
      <div className="space-y-4 w-full">
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold">Remarks</h2>
            <form
              onSubmit={form.handleSubmit(onSubmit, (err) => {
                console.log("Validation Errors", err);
              })}
              className="space-y-3"
            >
              {!disable && (
                <div className="flex flex-row gap-2 items-end flex-wrap">
                  <div>
                    <Label>Select Customer</Label>
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
                      await onFetchData?.(val.start, val.end, val.user);
                    }}
                  />

                  <AddCustomerDialog
                    user_designation={designation}
                    office={route_branch}
                    user_id={userID}
                    ownership={
                      designation === "Owner" ||
                      designation === "Customer Relationship Manager" ||
                      designation === "Customer Relationship Manager (After Sales)"
                    }
                    visible={addCustomer}
                    onClose={setAddCustomer}
                    onRefresh={async (newRow) => {
                      const finalData = {
                        ...newRow,
                        search: newRow.name || newRow.owner,
                      };
                      setSelectedCustomer(finalData);
                    }}
                  />
                </div>
              )}

              <div className="flex flex-1 gap-5 flex-wrap">
                <Controller
                  name="image"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Image</FieldLabel>
                      <div className="flex flex-1 items-center justify-center">
                        <Dropzone
                          value={field.value}
                          onDrop={(file) => field.onChange(file)}
                          title={"Click to upload"}
                          subheading={"or drag and drop"}
                          description={"PNG or JPG"}
                          drag={"Drop the files here..."}
                        />
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="next"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Next follow Up</FieldLabel>
                      <AppCalendar
                        date={field.value}
                        onChange={field.onChange}
                        min={new Date()}
                        max={""}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name="note"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Write something</FieldLabel>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Write something..."
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Button
                disabled={!selectedCustomer?.id || loading}
                type="submit"
                className="mt-2 w-full"
              >
                {loading && <Spinner />} Post
              </Button>
            </form>
          </CardContent>
        </Card>

        {feedbacks.length > 0 && (
          <div className="space-y-3">
            {feedbacks.map((feedback, index) => (
              <Card key={index} className="p-0">

                <CardContent className="p-0">
                  <CardHeader className="p-0 flex overflow-hidden">
                    <div
                      className="flex flex-1 justify-between items-center bg-gray-200 dark:bg-gray-700 py-2 px-4"
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
                          <Spinner />
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
                  <div className="p-2">
                  <Link
                    target="blank"
                    href={`/${base_route}/${feedback.customer_member ? "member" : "customer"
                      }${feedback.customer_id}`}
                  >
                    <p className="text-sm text-gray-500">
                      {feedback?.customer_name || feedback?.customer_owner} -{" "}
                      {feedback?.customer_location} -{" "}
                      {feedback?.customer_number.join(", ")}
                    </p>
                  </Link>
                  {feedback?.problem && (
                    <p className="mt-2">Problem: {feedback?.problem}</p>
                  )}
                  {feedback?.solution && (
                    <p className="mt-2">Solution: {feedback?.solution}</p>
                  )}
                  <p className="mt-2">Remarks: {feedback.note}</p>
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
                    {feedback.signature && <MyImg img={feedback.signature} />}
                    {feedback.image && <MyImg img={feedback.image} />}
                  </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={!!selectedSignature}
        onOpenChange={() => setSelectedSignature(null)}
      >

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signature</DialogTitle>
          </DialogHeader>
          <div className="flex flex-1 items-center justify-center">
            <RenderSignature img={selectedSignature} />
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

const RenderSignature = ({ img }: { img: string | null }) => {
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!img) {
      setLocalImage(null);
      setError(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    if (img.includes("http")) {
      setLocalImage(img);
      setLoading(false);
    } else {
      getDownloadURL(ref(storage, img))
        .then((url) => {
          setLocalImage(url);
        })
        .catch(() => {
          setError(true);
          setLocalImage(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [img]);

  if (loading) return <Spinner />;
  if (!img || error || !localImage) return <p>No signature</p>;

  return (
    <Zoom>
      <img alt="visit image" className="dark:invert" src={localImage} width="100" />
    </Zoom>
  );
};

export const MyImg = ({ img }: { img: string }) => {
  const [localImage, setLocalImage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!img) {
      setLocalImage("");
      setError(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    if (img.includes("http")) {
      setLocalImage(img);
      setLoading(false);
    } else {
      getDownloadURL(ref(storage, img))
        .then((url) => {
          console.log(url)
          setLocalImage(url);
        })
        .catch((e) => {
          console.log("error loading image", e)
          setError(true);
          setLocalImage("");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [img]);

  if (loading) return <Spinner />;
  if (!img || !localImage) return <p>No image</p>;
  if (error) return <p>Failed to load image</p>

  return (
    <Zoom>
      <img alt="image" src={localImage} className="h-[100px] w-auto object-contain" />
    </Zoom>
  );
};
