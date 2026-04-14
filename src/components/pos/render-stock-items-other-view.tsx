import { storage } from "@/config/firebase";
import axios from "@/lib/axios";
import { ref, uploadBytesResumable } from "firebase/storage";
import {
  Minus,
  PencilIcon,
  Plus
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import "./Button.css";
import Dropzone from "./dropzone";
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { toast } from "@/hooks/use-toast";
import useUserDetail from "@/hooks/use-user-detail";
import "pdfjs-dist/build/pdf.worker.mjs";
import "pdfjs-dist/legacy/web/pdf_viewer.css";
import Spinner from "../ui/spinner";
import AddNewProduct from "./add-new-product";

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
}) => {
  const [localName, setLocalName] = useState("");
  const [localChineseName, setLocalChineseName] = useState("");
  const [localQty, setLocalQty] = useState("");
  const [localPrice, setLocalPrice] = useState("");
  const [localImage, setLocalImage] = useState(null);
  const [editable, setEditable] = useState(false);
  const [remarks, setRemarks] = useState("")
  const [loading, setLoading] = useState(false);
  const [threshold, setThreshold] = useState("");
  const [newOrder, setNewOrder] = useState("");
  const [buying, setBuying] = useState("");
  const {userID} = useUserDetail()

  const uploadFiles = async (item, imgRef) => {
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

  async function handleSave(id, imgRef) {
    if (localPrice && isNaN(Number(localPrice))) {
      toast({
        title: "Error",
        description: "Price must be a number",
        variant: "destructive",
      });
      return;
    }

    if (localQty && isNaN(Number(localQty))) {
      toast({
        title: "Error",
        description: "Quantity must be a number",
        variant: "destructive",
      });
      return;
    }

    if (threshold && isNaN(Number(threshold))) {
      toast({
        title: "Error",
        description: "Threshold must be a number",
        variant: "destructive",
      });
      return;
    }

    if (newOrder && isNaN(Number(newOrder))) {
      toast({
        title: "Error",
        description: "New order must be a number",
        variant: "destructive",
      });
      return;
    }

    if (buying && isNaN(Number(buying))) {
      toast({
        title: "Error",
        description: "Buying price must be a number",
        variant: "destructive",
      });
      return;
    }

    const formData = {
      name: localName,
      chinese_name: localChineseName,
      remarks : remarks
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
      toast({
        title: "Error",
        description: "Failed to upload image or data. Try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return item.name === "Other" ? (
    <div
      key={index}
      className="w-[300px] border border-gray-300 rounded-lg shadow-md p-10 flex items-center justify-center"
      style={{
        backgroundColor: showOther ? "rgba(0, 114, 188, 0.1)" : "white",
        cursor: "pointer",
      }}
      onClick={() => {
        setShowOther(!showOther);
        setOther("");
        setQty("");
        setPrice("");
      }}
    >
      <p className="font-bold text-xl">Other</p>
    </div>
  ) : item.name === "Plus" ? (
    <AddNewProduct visible={visible} onClose={onClose} onRefresh={onRefresh} />
  ) : (
    <div
      className={`w-full border border-gray-300 rounded-lg shadow-md p-5 flex flex-col ${
        invoiceItems.find((eachItem) => eachItem.id === item.id)?.qty > 0 &&
        "bg-blue-100"
      }`}
    >
      {!editable ? (
        <div className="flex flex-1 flex-row justify-between">
          <p className="w-1/3">{item.name}</p>
          <p className="w-1/3">In stock: {item.qty}</p>
          <p className="w-1/3">Price: {item.price}</p>
        </div>
      ) : (
        <div className="space-y-2 flex flex-1 flex-col">
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

          <input
            placeholder={item?.name || "Product name"}
            style={{ borderWidth: 1, borderColor: "#cccccc", fontSize: "14px" }}
            className="px-2"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
          />

          <input
            placeholder={item?.chinese_name || "Product chinese name"}
            style={{ borderWidth: 1, borderColor: "#cccccc", fontSize: "14px" }}
            className="px-2"
            value={localChineseName}
            onChange={(e) => setLocalChineseName(e.target.value)}
          />

          {/* <div className="flex justify-between">
            <div className="text-[14px]">Quantity</div>

            <input
              placeholder={item?.qty || "Enter qty"}
              style={{
                borderWidth: 1,
                borderColor: "#cccccc",
                fontSize: "14px",
                width: "50%",
              }}
              value={localQty}
              className="px-2 "
              onChange={(e) => {
                setLocalQty(e.target.value);
              }}
            />
          </div> */}

          <div className="flex justify-between">
            <div className="text-[14px]">Price</div>
            <input
              placeholder={item?.price || "Enter price"}
              style={{
                borderWidth: 1,
                borderColor: "#cccccc",
                fontSize: "14px",
                width: "50%",
              }}
              value={localPrice}
              className="px-2 "
              onChange={(e) => {
                setLocalPrice(e.target.value);
              }}
            />
          </div>
          <div className="flex justify-between">
            <div className="text-[14px]">Threshold</div>
            <input
              placeholder={item?.threshold || "Enter threshold"}
              style={{
                borderWidth: 1,
                borderColor: "#cccccc",
                fontSize: "14px",
                width: "50%",
              }}
              className="px-2 "
              value={threshold}
              onChange={(e) => {
                setThreshold(e.target.value);
              }}
            />
          </div>
          <div className="flex justify-between">
            <div className="text-[14px]">New order</div>
            <input
              placeholder={item?.threshold || "Enter new order"}
              style={{
                borderWidth: 1,
                borderColor: "#cccccc",
                fontSize: "14px",
                width: "50%",
              }}
              className="px-2 "
              value={newOrder}
              onChange={(e) => {
                setNewOrder(e.target.value);
              }}
            />
          </div>

          {designation === "Owner" && (
            <div className="flex justify-between">
              <div className="text-[14px]">Buying ¥</div>
              <input
                placeholder={item?.buying || "Enter buying price"}
                style={{
                  borderWidth: 1,
                  borderColor: "#cccccc",
                  fontSize: "14px",
                  width: "50%",
                }}
                className="px-2 "
                value={buying}
                onChange={(e) => {
                  setBuying(e.target.value);
                }}
              />
            </div>
          )}

            {designation === "Owner" && (
            <div className="flex justify-between">
              <div className="text-[14px]">Remarks</div>
              <input
                placeholder={item?.remarks || "Enter remarks"}
                style={{
                  borderWidth: 1,
                  borderColor: "#cccccc",
                  fontSize: "14px",
                  width: "50%",
                }}
                className="px-2 "
                value={remarks}
                onChange={(e) => {
                  setRemarks(e.target.value);
                }}
              />
            </div>
          )}

          <Button onClick={() => handleSave(item.id, item.img)}>
            {loading && <Spinner />}
            Save
          </Button>
        </div>
      )}

      <div className="flex w-full justify-between items-center">
        <div className="flex gap-2 mt-2">
          <div
            className="hover:cursor-pointer"
            style={{ opacity: editable ? 0.5 : 1 }}
            onClick={() => {
              if (!editable) {
                handleDecrease(item);
              }
            }}
          >
            <Minus color="red" />
          </div>

          <p>{invoiceItems.find((eachItem) => eachItem.id === item.id)?.qty}</p>
          <div
            className="hover:cursor-pointer"
            style={{ opacity: editable ? 0.5 : 1 }}
            onClick={() => {
              if (!editable) {
                handleIncrease(item);
              }
            }}
          >
            <Plus color="green" />
          </div>
        </div>
        <div
          className="hover:cursor-pointer"
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
          <PencilIcon className="h-4" />
        </div>
      </div>
    </div>
  );
};

export default RenderStockItemsOtherView;
