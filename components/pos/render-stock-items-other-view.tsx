import { storage } from "@/config/firebase";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { InvoiceItem, StockProps } from "@/lib/types";
import { ref, uploadBytesResumable } from "firebase/storage";
import {
  Minus,
  PencilIcon,
  Plus
} from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import Spinner from "../ui/spinner";
import "./Button.css";
import AddNewProduct from "./add-new-product";
import Dropzone from "./dropzone";
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import "pdfjs-dist/build/pdf.worker.mjs";
import "pdfjs-dist/legacy/web/pdf_viewer.css";

type RenderStockItemsProps = {
  designation: string,
  item: StockProps,
  index: number,
  invoiceItems: InvoiceItem[],
  handleDecrease: (item: StockProps) => void,
  handleIncrease: (item: StockProps) => void,
  showOther: boolean,
  setShowOther: Dispatch<SetStateAction<boolean>>,
  setPrice: Dispatch<SetStateAction<string | number>>,
  setQty: Dispatch<SetStateAction<string | number>>,
  setOther: Dispatch<SetStateAction<string>>,
  visible: boolean,
  onClose: (val: boolean) => void,
  onRefresh: () => void,
}

const RenderStockItemsOtherView = ({
  designation,
  item,
  index,
  invoiceItems,
  handleDecrease,
  handleIncrease,
  showOther,
  setShowOther,
  setPrice,
  setQty,
  setOther,
  visible,
  onClose,
  onRefresh,
}: RenderStockItemsProps) => {
  const [localName, setLocalName] = useState("");
  const [localChineseName, setLocalChineseName] = useState("");
  const [localQty, setLocalQty] = useState<number | string>("");
  const [localPrice, setLocalPrice] = useState("");
  const [localImage, setLocalImage] = useState<File | null>(null);
  const [editable, setEditable] = useState(false);
  const [remarks, setRemarks] = useState("")
  const [loading, setLoading] = useState(false);
  const [threshold, setThreshold] = useState<number | string>("");
  const [newOrder, setNewOrder] = useState<string | number>("");
  const [buying, setBuying] = useState("");
  const { userID } = useUserDetail()

  const uploadFiles = async (item: Blob | null, imgRef: string | null | undefined) => {
    let name = "";
    if (imgRef) {
      name = imgRef;
    } else {
      name = new Date().getTime().toString() + ".png";
    }
    return new Promise((resolve, reject) => {
      if (!item) {
        if (imgRef) {
          resolve(imgRef);
        } else {
          resolve(null);
        }
      } else {
        const metadata = {
          contentType: "image/png",
        };
        const storageRef = ref(storage, `products/` + name);
        const uploadTask = uploadBytesResumable(storageRef, item, metadata);
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log("Upload is " + progress + "% done");
            switch (snapshot.state) {
              case "paused":
                console.log("Upload is paused");
                break;
              case "running":
                console.log("Upload is running");
                break;
            }
          },
          (error) => {
            setLoading(false);
            reject(error);
          },
          () => {
            resolve(name);
          }
        );
      }
    });
  };

  async function handleSave(id: number, imgRef: string | null | undefined) {

    if (localPrice && isNaN(Number(localPrice))) {
      toast.error("Price must be a number");
      return;
    }

    if (localQty && isNaN(Number(localQty))) {
      toast.error("Quantity must be a number");
      return;
    }

    if (threshold && isNaN(Number(threshold))) {
      toast.error("Threshold must be a number");
      return;
    }

    if (newOrder && isNaN(Number(newOrder))) {
      toast.error("New order must be a number");
      return;
    }

    if (buying && isNaN(Number(buying))) {
      toast.error("Buying price must be a number");
      return;
    }

    const formData: any = {
      name: localName,
      chinese_name: localChineseName,
      remarks: remarks
    };

    if (!isNaN(Number(localPrice))) {
      formData.price = Number(localPrice);
    }

    if (!isNaN(Number(localQty))) {
      formData.qty = Number(localQty);
    }

    if (!isNaN(Number(threshold))) {
      formData.threshold = Number(threshold);
    }
    if (!isNaN(Number(newOrder))) {
      formData.new_order = Number(newOrder);
    }

    if (!isNaN(Number(buying))) {
      formData.buying = Number(buying);
    }

    setLoading(true);
    try {
      const result = await uploadFiles(localImage, imgRef);
      if (result) {
        formData.img = result;
      }

      await axios.put(`/${userID}/pos/${id}`, formData);

      onRefresh();
    } catch (error) {
      toast.error("Failed to upload image or data. Try again");
    } finally {
      setLoading(false);
    }
  }

  return item.name === "Other" ? (
    <div
      key={index}
      className={`flex min-h-14 cursor-pointer items-center justify-center rounded-md border border-dashed px-4 py-3 text-center transition hover:bg-muted/40 ${showOther
        ? "border-primary bg-primary/10 text-primary"
        : "bg-card"
        }`}
      onClick={() => {
        setShowOther(!showOther);
        setOther("");
        setQty("");
        setPrice("");
      }}
    >
      <p className="text-sm font-bold">Other Item</p>
    </div>
  ) : item.name === "Plus" ? (
    <AddNewProduct visible={visible} onClose={onClose} onRefresh={onRefresh} />
  ) : (
    <div
      className={`flex w-full flex-col rounded-md border bg-card p-2.5 ring-1 ring-border/30 transition hover:border-primary/40 ${(invoiceItems.find((eachItem) => eachItem.id === item.id)?.qty ?? 0) > 0
        ? "border-primary/40 bg-primary/10"
        : "border-border"
        }`}
    >
      {!editable ? (
        <div className="grid gap-2 md:grid-cols-[minmax(180px,1fr)_120px_120px_auto] md:items-center">
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight">{item.name}</p>
            {item.chinese_name && (
              <p className="mt-0.5 text-xs text-muted-foreground">{item.chinese_name}</p>
            )}
          </div>
          <div className="rounded-md bg-muted/50 px-2 py-1 text-xs">
            <p className="text-[10px] uppercase text-muted-foreground">Stock</p>
            <p className="font-bold">{item.qty ?? 0}</p>
          </div>
          <div className="rounded-md bg-muted/50 px-2 py-1 text-xs">
            <p className="text-[10px] uppercase text-muted-foreground">Price</p>
            <p className="font-bold">{item.price || "-"}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-2 lg:grid-cols-[180px_1fr]">
          <Dropzone
            value={localImage ? URL.createObjectURL(localImage) : null}
            onDrop={(file) => {
              setLocalImage(file);
            }}
            title="Click to upload"
            subheading="or drag and drop"
            description="PNG or JPG"
            drag="Drop the files here..."
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <input
              placeholder={item?.name || "Product name"}
              className="h-8 rounded-md border bg-background px-2 text-xs outline-none focus:border-primary"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
            />

            <input
              placeholder={item?.chinese_name || "Product chinese name"}
              className="h-8 rounded-md border bg-background px-2 text-xs outline-none focus:border-primary"
              value={localChineseName}
              onChange={(e) => setLocalChineseName(e.target.value)}
            />

            <input
              placeholder={item?.price || "Enter price"}
              value={localPrice}
              className="h-8 rounded-md border bg-background px-2 text-xs outline-none focus:border-primary"
              onChange={(e) => {
                setLocalPrice(e.target.value);
              }}
            />
            <input
              placeholder={item?.threshold?.toString() || "Enter threshold"}
              className="h-8 rounded-md border bg-background px-2 text-xs outline-none focus:border-primary"
              value={threshold}
              onChange={(e) => {
                setThreshold(e.target.value);
              }}
            />
            <input
              placeholder={item?.threshold?.toString() || "Enter new order"}
              className="h-8 rounded-md border bg-background px-2 text-xs outline-none focus:border-primary"
              value={newOrder}
              onChange={(e) => {
                setNewOrder(e.target.value);
              }}
            />

            {designation === "Owner" && (
              <input
                placeholder={item?.buying || "Enter buying price"}
                className="h-8 rounded-md border bg-background px-2 text-xs outline-none focus:border-primary"
                value={buying}
                onChange={(e) => {
                  setBuying(e.target.value);
                }}
              />
            )}

            {designation === "Owner" && (
              <input
                placeholder={item?.remarks || "Enter remarks"}
                className="h-8 rounded-md border bg-background px-2 text-xs outline-none focus:border-primary sm:col-span-2"
                value={remarks}
                onChange={(e) => {
                  setRemarks(e.target.value);
                }}
              />
            )}

            <Button size="sm" className="h-8 rounded-md text-xs sm:col-span-2" onClick={() => handleSave(item.id, item.img)}>
              {loading && <Spinner />}
              Save
            </Button>
          </div>
        </div>
      )}

      <div className="mt-2 flex w-full items-center justify-between border-t pt-2">
        <div className="flex items-center gap-1 rounded-md border bg-background p-1">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md hover:cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30"
            style={{ opacity: editable ? 0.5 : 1 }}
            onClick={() => {
              if (!editable) {
                handleDecrease(item);
              }
            }}
          >
            <Minus className="h-3.5 w-3.5 text-red-600" />
          </div>

          <p className="min-w-7 text-center text-xs font-bold">{invoiceItems.find((eachItem) => eachItem.id === item.id)?.qty ?? 0}</p>
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md hover:cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            style={{ opacity: editable ? 0.5 : 1 }}
            onClick={() => {
              if (!editable) {
                handleIncrease(item);
              }
            }}
          >
            <Plus className="h-3.5 w-3.5 text-emerald-600" />
          </div>
        </div>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:cursor-pointer hover:bg-muted"
          onClick={() => {
            setLocalName(item.name || "");
            setLocalChineseName(item.chinese_name || "");
            setLocalQty(item?.qty || "");
            setLocalPrice(item?.price || "");
            setThreshold(item?.threshold || "");
            setNewOrder(item?.new_order || "");
            setRemarks(item?.remarks || "")
            setEditable(!editable);
          }}
        >
          <PencilIcon className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
};

export default RenderStockItemsOtherView;
