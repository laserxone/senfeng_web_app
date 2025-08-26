import { storage } from "@/config/firebase";
import axios from "@/lib/axios";
import { ref, uploadBytesResumable } from "firebase/storage";
import {
  Plus
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../ui/dialog";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import "./Button.css";
import Dropzone from "./dropzone";
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { toast } from "@/hooks/use-toast";
import useUserDetail from "@/hooks/use-user-detail";
import "pdfjs-dist/build/pdf.worker.mjs";
import "pdfjs-dist/legacy/web/pdf_viewer.css";
import Spinner from "../ui/spinner";

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
      toast({
        title: "Error",
        description: "Price, Quantity, Threshold and New Order must be numbers",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: "Failed to upload image or data. Try again",
        variant: "destructive",
      });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }
  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogTrigger asChild>
        <div
          className="w-[300px] border border-gray-300 rounded-lg shadow-md p-10 flex items-center justify-center"
          style={{ backgroundColor: "white", cursor: "pointer" }}
          onClick={() => {
            setName("");
            setPrice("");
            setQty("");
            setImage(null);
          }}
        >
          <Plus size={"80px"} />
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add new stock item</DialogTitle>
        </DialogHeader>
        <div>
          <ScrollArea className="h-[80vh] px-2">
            <div className="px-2">
              <div className="text-md">Name</div>
              <Input
                placeholder="Enter product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="text-md">Chinese name</div>
              <Input
                placeholder="Enter product chinese name"
                value={chineseName}
                onChange={(e) => setChineseName(e.target.value)}
              />
              <div className="text-md mt-2">Quantity</div>
              <Input
                placeholder="Enter quantity"
                value={qty}
                onChange={(e) => {
                  setQty(e.target.value);
                }}
              />

              <div className="text-md mt-2">Price</div>
              <Input
                placeholder="Enter price"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                }}
              />

              <div className="text-md mt-2">Threshold</div>
              <Input
                placeholder="Enter threshold"
                value={threshold}
                onChange={(e) => {
                  setThreshold(e.target.value);
                }}
              />

              <div className="text-md mt-2">New Order</div>
              <Input
                placeholder="Enter new order"
                value={newOrder}
                onChange={(e) => {
                  setNewOrder(e.target.value);
                }}
              />

              <div className="text-md mt-2">Image URL</div>

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

              <Button
                disabled={!image || !name || !price || !qty}
                className="w-full mt-2"
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
