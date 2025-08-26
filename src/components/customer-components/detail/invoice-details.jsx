import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import moment from "moment";
import { Label } from "@/components/ui/label";
import { useCallback, useEffect, useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/config/firebase";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import { Button } from "@/components/ui/button";

export default function InvoiceDetails({ invoice }) {
  return (
    
      <Card className="mb-2">
        <CardHeader>
          <CardTitle>Invoice #{invoice.invoicenumber}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div>
            
              <span className="font-medium">Payment Status:</span>{" "}
              {invoice.payment ? (
                <Badge variant="default">Paid</Badge>
              ) : (
                <Badge variant="destructive">Pending</Badge>
              )}
            
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.fields.map((item, ind) => (
                <TableRow key={ind}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.qty}</TableCell>
                  <TableCell>{item.price}</TableCell>
                  <TableCell>{item.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Label className="font-bold">Payments</Label>
          {invoice.payments.map((p, i) => (
            <div key={i} className="flex flex-col gap-2 border-b">
              <p>
                <span className="font-medium">Amount:</span> {p.amount}
              </p>
              <p>
                <span className="font-medium">Mode:</span> {p.mode}
              </p>
              <p>
                <span className="font-medium">Received By:</span>{" "}
                {p.received_by}
              </p>
              <p>
                <span className="font-medium">Transaction Date:</span>{" "}
                {moment(p.transaction_date).format("YYYY-MM-DD")}
              </p>
              {p.clearance_date && (
                <p>
                  <span className="font-medium">Cleared On:</span>{" "}
                  {moment(p.clearance_date).format("YYYY-MM-DD")}
                </p>
              )}
              {p.image && <RenderImage img={p.image} />}
              {p.remarks && (
                <p>
                  <span className="font-medium">Remarks:</span> {p.remarks}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    
  );
}

const RenderImage = ({ img }) => {
  const [localImage, setLocalImage] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (img) {
      if (img.includes("http")) {
        setLocalImage(img);
      } else {
        getDownloadURL(ref(storage, img)).then((url) => {
          setLocalImage(url);
        });
      }
    } else {
      setLocalImage(null);
    }
  }, [img]);

  const handleZoomChange = useCallback((shouldZoom) => {
    setIsZoomed(shouldZoom);
   
  }, []);

  const rotateImageRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const rotateImageLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const onPressClose = () => {
    setIsZoomed(false);
   
  };

  return (
    localImage && (
      <ControlledZoom
        isZoomed={isZoomed}
        onZoomChange={handleZoomChange}
        ZoomContent={({ img }) =>
          isZoomed ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
                zIndex: 9999,
                pointerEvents: "auto",
              }}
            >
              <img
                src={localImage}
                alt="payment-img"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  maxWidth: "90vw",
                  maxHeight: "90vh",
                  objectFit: "contain",
                  pointerEvents: "auto",
                }}
              />
              <div
                className="mt-2 flex gap-5"
                style={{
                  pointerEvents: "auto",
                  zIndex: 10000,
                }}
              >
                <Button variant="outline" size="sm" onClick={rotateImageLeft}>
                  Rotate Left
                </Button>
                <Button variant="outline" size="sm" onClick={rotateImageRight}>
                  Rotate Right
                </Button>

                <Button variant="outline" size="sm" onClick={onPressClose}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            img
          )
        }
      >
        <img
          src={localImage}
          alt="payment-img"
          style={{
            maxWidth: "100%",
            maxHeight: "400px",
            objectFit: "contain",
            cursor: "zoom-in",
          }}
        />
      </ControlledZoom>
    )
  );
};
