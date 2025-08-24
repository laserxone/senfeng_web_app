import { storage } from "@/config/firebase";
import axios from "@/lib/axios";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { PencilIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import "./Button.css";
import Dropzone from "./dropzone";
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { toast } from "@/hooks/use-toast";
import "pdfjs-dist/build/pdf.worker.mjs";
import "pdfjs-dist/legacy/web/pdf_viewer.css";
import Spinner from "../ui/spinner";

const RenderOtherStockItems = ({ item, UserState, onRefresh }) => {
  const [localName, setLocalName] = useState("");
  const [localChineseName, setLocalChineseName] = useState("");
  const [localQty, setLocalQty] = useState("");
  const [localPrice, setLocalPrice] = useState("");
  const [localImage, setLocalImage] = useState(null);
  const [editable, setEditable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [itemImg, setImg] = useState(null);
  const [threshold, setThreshold] = useState("");
  const [newOrder, setNewOrder] = useState("");
  const [buying, setBuying] = useState("");
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    async function getImage(refImage) {
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

      await axios.put(`/${UserState.value.data?.id}/pos/${id}`, formData);
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

  const isAdmin =
    UserState.value.data?.designation === "Owner" ||
    UserState.value.data?.full_access;

  return (
    <div
      className={`w-full border border-gray-300 rounded-lg shadow-md p-5 flex flex-col`}
    >
      <div className="flex w-full">
        {!editable ? (
          <div className="flex flex-1 gap-2 flex-row justify-between">
            {imageLoading ? (
              <div
                style={{
                  height: "100px",
                  width: "100px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Spinner />
              </div>
            ) : itemImg ? (
              <img src={itemImg} style={{ height: "100px", width: "100px" }} />
            ) : (
              <img
                src="/noImage_icon.png"
                style={{ height: "100px", width: "100px" }}
              />
            )}
            <div className="w-1/3">
              <p>{item.name}</p>
              <p>{item.chinese_name}</p>
            </div>
            <p className="w-1/3">New order: {item.new_order}</p>
            {(UserState.value.data?.designation === "Owner" ||
              UserState.value.data?.full_access) && (
              <p className="w-1/3">Buying ¥: {item.buying}</p>
            )}
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
              style={{
                borderWidth: 1,
                borderColor: "#cccccc",
                fontSize: "14px",
              }}
              className="px-2"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
            />

            <input
              placeholder={item?.chinese_name || "Product chinese name"}
              style={{
                borderWidth: 1,
                borderColor: "#cccccc",
                fontSize: "14px",
              }}
              className="px-2"
              value={localChineseName}
              onChange={(e) => setLocalChineseName(e.target.value)}
            />

            <div className="flex justify-between">
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
            </div>

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

            {isAdmin && (
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

            <Button onClick={() => handleSave(item.id, item.img)}>
              {loading && <Spinner />}
              Save
            </Button>
          </div>
        )}
        <div
          className="hover:cursor-pointer"
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
        </div>
      </div>
    </div>
  );
};

export default RenderOtherStockItems;
