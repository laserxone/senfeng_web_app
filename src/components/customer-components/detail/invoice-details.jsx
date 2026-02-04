import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { storage } from "@/config/firebase";
import { useIsMobile } from "@/hooks/use-mobile";
import { Scrollbar } from "@radix-ui/react-scroll-area";
import { getDownloadURL, ref } from "firebase/storage";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";

export default function InvoiceDetails({ invoice }) {
  const isMobile = useIsMobile();

  return (
    <AccordionItem
      value={`invoice-${invoice.invoicenumber}`}
      className="border rounded-lg"
    >
      <AccordionTrigger className="px-4 py-2 hover:bg-muted rounded-lg  hover:no-underline">
        <div className="flex justify-between items-center w-full">
          <span className="font-semibold">
            Invoice #{invoice.invoicenumber}
          </span>
          {invoice.payment ? (
            <Badge variant="default">Paid</Badge>
          ) : (
            <Badge variant="destructive">Pending</Badge>
          )}
        </div>
      </AccordionTrigger>

      <AccordionContent>
        <ScrollArea
          className={`overflow-x-auto ${isMobile && "max-w-[calc(100vw-64px)]"}`}
        >
          <Card className="shadow-none border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 text-sm">
              {/* Products Table */}
              <div>
                <Label className="font-bold mb-2 block">Products</Label>
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
              </div>

              {/* Payments Table */}
              <div>
                <Label className="font-bold mb-2 block">Payments</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Received By</TableHead>
                      <TableHead>Transaction Date</TableHead>
                      <TableHead>Clearance Date</TableHead>
                      <TableHead>Image</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.payments.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell>{p.amount}</TableCell>
                        <TableCell>{p.mode}</TableCell>
                        <TableCell>{p.received_by}</TableCell>
                        <TableCell>
                          {moment(p.transaction_date).format("YYYY-MM-DD")}
                        </TableCell>
                        <TableCell>
                          {p.clearance_date
                            ? moment(p.clearance_date).format("YYYY-MM-DD")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {p.image ? <RenderImage img={p.image} /> : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <Scrollbar orientation="horizontal"/>
        </ScrollArea>
      </AccordionContent>
    </AccordionItem>
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
            maxHeight: "100px",
            objectFit: "contain",
            cursor: "zoom-in",
          }}
        />
      </ControlledZoom>
    )
  );
};
