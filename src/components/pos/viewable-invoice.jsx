import {
  BankDetail,
  CompanyDetails,
  Disclaimer,
  Footer,
  FormField,
  Header,
} from "./constant-information";
import InvoicePDF from "./invoicePDF";
import { pdf } from "@react-pdf/renderer";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import "pdfjs-dist/legacy/web/pdf_viewer.css";
import { Label } from "../ui/label";
import { useRef } from "react";

export default function ViewableInvoice({
  companyName,
  name,
  phoneNumber,
  address,
  manager,
  selectedUser,
  nextInvoice,
  invoiceItems,
  totalAmount,
  warranty,
  warrantyYear,
  discount
}) {
  const pdfRef = useRef();

  const captureAndCopyToClipboard = async () => {
    const blob = await pdf(
      <InvoicePDF
        companyName={companyName}
        name={name}
        phoneNumber={phoneNumber}
        address={address}
        manager={manager}
        nextInvoice={nextInvoice}
        invoiceItems={invoiceItems}
        totalAmount={totalAmount}
      />
    ).toBlob();

    // Convert PDF to PNG and Copy to Clipboard
    const arrayBuffer = await blob.arrayBuffer();
    const pdfData = new Uint8Array(arrayBuffer);

    const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
    const page = await pdfDoc.getPage(1);

    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;

    canvas.toBlob(async (blob) => {
      const item = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);
      alert("Image copied to clipboard!");
    });
  };

  return (
    <div className="flex flex-col items-center p-2.5 bg-[#F1F7FF] border border-gray-300 rounded-lg shadow-md mb-5">
      <div
        ref={pdfRef}
        style={{
          width: "100%",
          paddingLeft: 20,
          paddingRight: 20,
          paddingBottom: 20,
        }}
      >
        {/* Header */}
        <Header onClick={() => captureAndCopyToClipboard()} />
        <div
          style={{
            padding: "5px",
            borderWidth: 2,
            borderColor: "#0072BC",
            borderRadius: 20,
            paddingTop: 20,
          }}
        >
          {/* Company Details */}
          <CompanyDetails />
          {/* Form Fields */}
          <FormField
            companyName={companyName}
            name={name}
            phoneNumber={phoneNumber}
            address={address}
            manager={manager}
            inv={nextInvoice}
            selectedUser={selectedUser}
          />
          {/* Invoice Table */}
          <div style={{ marginBottom: 5, width: "100%" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: "#0072BC",
                    color: "white",
                    fontSize: 14,
                  }}
                >
                  {[
                    "Sr.",
                    "Description",
                    "Quantity",
                    "Unit Price",
                    "Amount",
                  ].map((header, index) => (
                    <th
                      key={index}
                      style={{
                        border: "1px solid #D1D5DB",
                        padding: "0.5rem",
                        textAlign: "left",
                      }}
                    >
                      <Label style={{ fontWeight: 500 }}>{header}</Label>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoiceItems.map((item, i) => (
                  <tr
                    key={i}
                    style={{
                      backgroundColor: i % 2 === 0 ? "#f1f1f1" : "white",
                      fontSize: 14,
                      height: 30,
                    }}
                  >
                    <td style={{ border: "1px solid #D1D5DB", paddingLeft: 5 }}>
                      <Label className="text-black">{i + 1}</Label>
                    </td>
                    <td
                      style={{
                        border: "1px solid #D1D5DB",
                        paddingLeft: 5,
                        width: "400px",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          backgroundColor: "transparent",
                          border: "none",
                        }}
                      >
                        <Label className="text-black">
                          {item?.description}
                        </Label>
                      </div>
                    </td>
                    <td style={{ border: "1px solid #D1D5DB", paddingLeft: 5 }}>
                      <div
                        style={{
                          width: "100%",
                          backgroundColor: "transparent",
                          border: "none",
                        }}
                      >
                        <Label className="text-black">{item?.qty}</Label>
                      </div>
                    </td>
                    <td style={{ border: "1px solid #D1D5DB", paddingLeft: 5 }}>
                      <div
                        style={{
                          width: "100%",
                          backgroundColor: "transparent",
                          border: "none",
                        }}
                      >
                        <Label className="text-black">{item?.price}</Label>
                      </div>
                    </td>
                    <td style={{ border: "1px solid #D1D5DB", paddingLeft: 5 }}>
                      <div
                        style={{
                          width: "100%",
                          backgroundColor: "transparent",
                          border: "none",
                        }}
                      >
                        <Label className="text-black">{item?.total}</Label>
                      </div>
                    </td>
                  </tr>
                ))}
                {!warranty &&
                  invoiceItems.length <= 9 &&
                  [...Array(9 - invoiceItems.length)].map((_, i) => (
                    <tr key={i} style={{ fontSize: 14, height: 30 }}>
                      <td
                        className="border border-gray-300 "
                        style={{ paddingLeft: 5 }}
                      >
                        <Label className="text-black">
                          {i + invoiceItems.length + 1}
                        </Label>
                      </td>
                      <td
                        className="border border-gray-300 "
                        style={{ paddingLeft: 5 }}
                      ></td>
                      <td className="border border-gray-300 "></td>
                      <td className="border border-gray-300"></td>
                      <td className="border border-gray-300 "></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

        
            <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 2,
            }}
          >
            <div style={{ width: "300px", display: "flex" }}>
              <div
                style={{
                  flex: 1,
                  
                  backgroundColor: "#0072BC",
                  color: "white",
                  paddingLeft: 5,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  fontWeight: "600",
                }}
              >
                <Label>Discount</Label>
              </div>
              <div
                style={{
                  flex: 1,
                 
                  backgroundColor: "#0072BC",
                  color: "white",
                  paddingLeft: 10,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  fontWeight: "600",
                  borderLeft: "1px solid",
                  borderColor: "white",
                }}
              >
                <Label>
                  {discount &&
                   - new Intl.NumberFormat("en-US").format(discount)}
                  
                </Label>
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 5,
            }}
          >
            <div style={{ width: "300px", display: "flex" }}>
              <div
                style={{
                  flex: 1,
                  height: "200px",
                  backgroundColor: "#0072BC",
                  color: "white",
                  paddingLeft: 5,
                  height: 50,
                  display: "flex",
                  alignItems: "center",
                  fontWeight: "600",
                }}
              >
                <Label>Total Amount</Label>
              </div>
              <div
                style={{
                  flex: 1,
                  height: "200px",
                  backgroundColor: "#0072BC",
                  color: "white",
                  paddingLeft: 10,
                  height: 50,
                  display: "flex",
                  alignItems: "center",
                  fontWeight: "600",
                  borderLeft: "1px solid",
                  borderColor: "white",
                }}
              >
                <Label>
                  {totalAmount &&
                    new Intl.NumberFormat("en-US").format(totalAmount)}
                  /-
                </Label>
              </div>
            </div>
          </div>
          {warranty && (
            <div
              className="w-full my-2"
              style={{
                padding: "1rem",
                fontFamily: "Arial, sans-serif",
                lineHeight: "1.6",
                borderWidth: 0.5,
                borderColor: "#ccc",
              }}
            >
              <div
                style={{ color: "red", fontWeight: "500", fontSize: "12px" }}
              >
                {warrantyYear}-Year Warranty for New Source (Will Start on the
                Date of Installation) *Warranty does not cover damages caused by
                mishandling, misuse, abuse, unstable electricity & voltage
                fluctuation, inexpert repair, improper transportation,
                unsuitable storage or use under harsh environment or conditions
                at Buyer&apos;s end.
              </div>

              <div
                style={{
                  textAlign: "center",
                  color: "orange",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                }}
              >
                Terms and Conditions:
              </div>

              <div
                className="text-black"
                style={{ marginTop: "0.5rem", fontSize: "12px" }}
              >
                Equipment can only be used after full payments only and broken
                seals are not acceptable for any return or warranties. Sensitive
                repair and maintenance can only be done by Raycus/MAX China
                within warranty time. Customer will send and receive the
                equipment to manufacturer by himself.
              </div>
            </div>
          )}

          <BankDetail />

          <Disclaimer />
        </div>
        <Footer />
      </div>
    </div>
  );
}
