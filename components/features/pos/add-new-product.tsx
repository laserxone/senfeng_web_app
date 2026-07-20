import { storage } from "@/config/firebase";
import axios from "@/lib/axios";
import { ref, uploadBytesResumable } from "firebase/storage";
import {
  ImagePlus,
  PackagePlus,
  Plus
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import "./Button.css";
import Dropzone from "@/components/shared/uploads/dropzone";
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

import useUserDetail from "@/hooks/use-user-detail";
import "pdfjs-dist/build/pdf.worker.mjs";
import "pdfjs-dist/legacy/web/pdf_viewer.css";
import Spinner from "@/components/ui/spinner";
import { toast } from "sonner";

const AddNewProduct = ({ visible, onClose, onRefresh }) => {
  const [name, setName] = useState("");
  const [chineseName, setChineseName] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const [threshold, setThreshold] = useState("");
  const [newOrder, setNewOrder] = useState("");
  const [loading, setLoading] = useState(false);
  const {userID} = useUserDetail()

  const uploadFiles = async (item) => {
    return new Promise((resolve, reject) => {
      const name = new Date().getTime().toString() + ".png";
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
    });
  };

  async function handleSaveProduct() {
    if (
      isNaN(Number(price)) ||
      isNaN(Number(qty)) ||
      (threshold !== undefined &&
        threshold !== "" &&
        isNaN(Number(threshold))) ||
      (newOrder !== undefined && newOrder !== "" && isNaN(Number(newOrder)))
    ) {
      toast.info( "Price, Quantity, Threshold and New Order must be numbers",);
      return;
    }

    setLoading(true);
    try {
      const result = await uploadFiles(image);
      const formData = {
        name: name,
        price: Number(price),
        qty: Number(qty),
        img: result,
        chinese_name: chineseName,
      };
      if (!isNaN(Number(threshold))) {
        formData.threshold = Number(threshold);
      }
      if (!isNaN(Number(newOrder))) {
        formData.new_order = Number(newOrder);
      }

      await axios.post(`/${userID}/pos`, formData);
      onRefresh();
    } catch (error) {
      toast.error( "Failed to upload image or data. Try again");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }
  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-md border border-dashed bg-card px-3 py-3 text-left transition hover:border-primary/60 hover:bg-primary/5"
          onClick={() => {
            setName("");
            setPrice("");
            setQty("");
            setImage(null);
          }}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
            <PackagePlus className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold leading-tight">Add New Product</span>
            <span className="block text-xs text-muted-foreground">Create stock item</span>
          </span>
          <Plus className="ml-auto h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] w-[96vw] overflow-hidden rounded-md p-0 sm:max-w-2xl">
        <DialogHeader className="border-b bg-muted/30 px-4 py-3">
          <DialogTitle className="text-base font-bold">Add new stock item</DialogTitle>
          <p className="text-xs text-muted-foreground">Add product details and upload a product image.</p>
        </DialogHeader>
        <div className="p-3">
          <ScrollArea className="max-h-[72vh] pr-3">
            <div className="space-y-3">
              <div className="rounded-md border bg-card p-3">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <PackagePlus className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">Product information</p>
                    <p className="text-xs text-muted-foreground">Name, quantity, pricing and reorder levels</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Name</label>
              <Input
                      className="h-8 rounded-md text-sm"
                placeholder="Enter product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Chinese name</label>
              <Input
                      className="h-8 rounded-md text-sm"
                placeholder="Enter product chinese name"
                value={chineseName}
                onChange={(e) => setChineseName(e.target.value)}
              />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Quantity</label>
              <Input
                      className="h-8 rounded-md text-sm"
                placeholder="Enter quantity"
                value={qty}
                onChange={(e) => {
                  setQty(e.target.value);
                }}
              />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Price</label>
              <Input
                      className="h-8 rounded-md text-sm"
                placeholder="Enter price"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                }}
              />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Threshold</label>
              <Input
                      className="h-8 rounded-md text-sm"
                placeholder="Enter threshold"
                value={threshold}
                onChange={(e) => {
                  setThreshold(e.target.value);
                }}
              />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">New Order</label>
              <Input
                      className="h-8 rounded-md text-sm"
                placeholder="Enter new order"
                value={newOrder}
                onChange={(e) => {
                  setNewOrder(e.target.value);
                }}
              />
                  </div>
                </div>
              </div>

              <div className="rounded-md border bg-card p-3">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <ImagePlus className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">Product image</p>
                    <p className="text-xs text-muted-foreground">Upload PNG or JPG product photo</p>
                  </div>
                </div>

              <Dropzone
                value={image ? URL.createObjectURL(image) : null}
                onDrop={(file) => {
                  setImage(file);
                }}
                title="Click to upload"
                subheading="or drag and drop"
                description="PNG or JPG"
                drag="Drop the files here..."
              />
              </div>

              <Button
                disabled={!image || !name || !price || !qty}
                className="h-9 w-full rounded-md text-sm"
                onClick={handleSaveProduct}
              >
                {loading && <Spinner />}
                Save
              </Button>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddNewProduct;
