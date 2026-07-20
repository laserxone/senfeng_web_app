import { storage } from "@/config/firebase";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import {
  BadgeDollarSign,
  Boxes,
  ImageIcon,
  PencilIcon,
  Save,
} from "lucide-react";
import "pdfjs-dist/build/pdf.worker.mjs";
import "pdfjs-dist/legacy/web/pdf_viewer.css";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import "./Button.css";
import Dropzone from "@/components/shared/uploads/dropzone";
import { StockProps } from "@/lib/types";
import { MyImgZooming } from "@/components/shared/media/img-zooming";
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

const RenderOtherStockItems = ({ item, onRefresh } : {item : StockProps, onRefresh : ()=> Promise<void>}) => {
  const [localName, setLocalName] = useState("");
  const [localChineseName, setLocalChineseName] = useState("");
  const [localQty, setLocalQty] = useState<string | number>("");
  const [localPrice, setLocalPrice] = useState("");
  const [localImage, setLocalImage] = useState<File | null>(null);
  const [editable, setEditable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [itemImg, setImg] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<string | number>("");
  const [newOrder, setNewOrder] = useState<string | number>("");
  const [buying, setBuying] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const { userID, isAdmin } = useUserDetail();

  useEffect(() => {
    async function getImage(refImage : string) {
      setImageLoading(true);
      const starsRef = ref(storage, `products/${refImage}`);
      getDownloadURL(starsRef)
        .then((url) => {
          setImg(url);
        })
        .catch((error) => {
          switch (error.code) {
            case "storage/object-not-found":
              // File doesn't exist
              break;
            case "storage/unauthorized":
              // User doesn't have permission to access the object
              break;
            case "storage/canceled":
              // User canceled the upload
              break;

            // ...

            case "storage/unknown":
              // Unknown error occurred, inspect the server response
              break;
          }
        })
        .finally(() => {
          setImageLoading(false);
        });
    }
    if (item.img) {
      getImage(item.img);
    }
  }, []);

  const uploadFiles = async (item : File | Blob | null, imgRef ?: string | null) => {
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

  async function handleSave(id : number, imgRef ?: string | null) {
    if (localPrice && isNaN(Number(localPrice))) {
      toast.info("Price must be a number");
      return;
    }

    if (localQty && isNaN(Number(localQty))) {
      toast.info("Quantity must be a number");
      return;
    }

    if (threshold && isNaN(Number(threshold))) {
      toast.info("Threshold must be a number");
      return;
    }

    if (newOrder && isNaN(Number(newOrder))) {
      toast.info("New order must be a number");
      return;
    }

    if (buying && isNaN(Number(buying))) {
      toast.info("Buying price must be a number");
      return;
    }

    const formData : any = {
      name: localName,
      chinese_name: localChineseName,
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

  const viewGridClass = isAdmin
    ? "md:grid-cols-[72px_minmax(180px,1fr)_minmax(130px,0.5fr)_minmax(130px,0.5fr)]"
    : "md:grid-cols-[72px_minmax(180px,1fr)_minmax(130px,0.5fr)]";

  return (
    <div className="w-full min-w-0 rounded-md border border-border/70 bg-background/95 p-2.5">
      <div className="flex w-full min-w-0 items-start gap-3">
        {!editable ? (
          <div className={`grid min-w-0 flex-1 gap-3 md:items-center ${viewGridClass}`}>
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
              {imageLoading ? (
                <Spinner />
              ) : itemImg ? (
               <MyImgZooming img={itemImg}/>
              ) : (
                <img
                  src="/noImage_icon.png"
                  className="h-10 w-10 object-contain opacity-70"
                />
              )}
            </div>

            <div className="min-w-0">
              <p className="break-words text-sm font-semibold leading-snug text-foreground">
                {item.name || "Unnamed product"}
              </p>
              <p className="mt-1 break-words text-xs leading-snug text-muted-foreground">
                {item.chinese_name || "No chinese name"}
              </p>
            </div>

            <div className="flex min-w-0 items-center gap-2 rounded-md border bg-muted/20 px-2.5 py-2">
              <Boxes className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase text-muted-foreground">
                  New order
                </p>
                <p className="break-words text-sm font-bold">
                  {item.new_order || 0}
                </p>
              </div>
            </div>

            {isAdmin && (
              <div className="flex min-w-0 items-center gap-2 rounded-md border bg-muted/20 px-2.5 py-2">
                <BadgeDollarSign className="h-4 w-4 shrink-0 text-emerald-600" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase text-muted-foreground">
                    Buying
                  </p>
                  <p className="break-words text-sm font-bold">
                    CNY {item.buying || 0}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="min-w-0 flex-1 space-y-3 rounded-md bg-muted/20 p-3">
            <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
              <div className="rounded-md border bg-background p-2">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                  Product Image
                </div>
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
              </div>

              <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <label className="min-w-0 space-y-1 sm:col-span-2 lg:col-span-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Product name
                  </span>
                  <input
                    placeholder={item?.name || "Product name"}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none transition-colors focus:border-primary"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                  />
                </label>

                <label className="min-w-0 space-y-1 sm:col-span-2 lg:col-span-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Chinese name
                  </span>
                  <input
                    placeholder={item?.chinese_name || "Product chinese name"}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none transition-colors focus:border-primary"
                    value={localChineseName}
                    onChange={(e) => setLocalChineseName(e.target.value)}
                  />
                </label>

                <label className="min-w-0 space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Quantity
                  </span>
                  <input
                    placeholder={String(item?.qty) || "Enter qty"}
                    value={localQty}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none transition-colors focus:border-primary"
                    onChange={(e) => {
                      setLocalQty(e.target.value);
                    }}
                  />
                </label>

                <label className="min-w-0 space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Price
                  </span>
                  <input
                    placeholder={item?.price || "Enter price"}
                    value={localPrice}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none transition-colors focus:border-primary"
                    onChange={(e) => {
                      setLocalPrice(e.target.value);
                    }}
                  />
                </label>

                <label className="min-w-0 space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Threshold
                  </span>
                  <input
                    placeholder={String(item?.threshold) || "Enter threshold"}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none transition-colors focus:border-primary"
                    value={threshold}
                    onChange={(e) => {
                      setThreshold(e.target.value);
                    }}
                  />
                </label>

                <label className="min-w-0 space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    New order
                  </span>
                  <input
                    placeholder={String(item?.threshold) || "Enter new order"}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none transition-colors focus:border-primary"
                    value={newOrder}
                    onChange={(e) => {
                      setNewOrder(e.target.value);
                    }}
                  />
                </label>

                {isAdmin && (
                  <label className="min-w-0 space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Buying CNY
                    </span>
                    <input
                      placeholder={item?.buying || "Enter buying price"}
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none transition-colors focus:border-primary"
                      value={buying}
                      onChange={(e) => {
                        setBuying(e.target.value);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                className="h-9 rounded-md"
                onClick={() => handleSave(item.id, item.img)}
              >
                {loading ? (
                  <Spinner className="mr-2" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </div>
        )}
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => {
            setLocalName(item.name || "");
            setLocalQty(item?.qty || "");
            setLocalPrice(item?.price || "");
            setThreshold(item?.threshold || "");
            setNewOrder(item?.new_order || "");
            setLocalChineseName(item?.chinese_name || "");
            setEditable(!editable);
          }}
        >
          <PencilIcon className="h-4" />
        </button>
      </div>
    </div>
  );
};

export default RenderOtherStockItems;
