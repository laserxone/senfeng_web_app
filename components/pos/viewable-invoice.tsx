import { InvoiceItem } from "@/lib/types";
import { pdf } from "@react-pdf/renderer";
import { CalendarDays, Copy, Globe, Phone } from "lucide-react";
import moment from "moment";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import "pdfjs-dist/legacy/web/pdf_viewer.css";
import { useRef } from "react";
import CurrencyFormatter from "../currency-formatter";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { SelectedUser } from "./POS";
import InvoicePDF from "./invoicePDF";

type ViewableInvoice = {
  companyName: string
  name: string
  phoneNumber: string
  address: string
  manager: string
  selectedUser: SelectedUser
  nextInvoice: string
  invoiceItems: InvoiceItem[]
  totalAmount: number
  warranty: boolean
  warrantyYear: number
  discount: string | number
  createdAt: string | Date
}

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
  discount,
  createdAt
}: ViewableInvoice) {
  const pdfRef = useRef(null);
  const invoiceDate = createdAt
    ? moment(new Date(createdAt)).format("YYYY-MM-DD")
    : moment().format("YYYY-MM-DD");
  const receiverLabel = selectedUser?.id ? "Engineer" : "Invoice No";
  const receiverValue = selectedUser?.id ? selectedUser?.label : nextInvoice;
  const blankRows = !warranty && invoiceItems.length <= 9 ? 9 - invoiceItems.length : 0;

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
        discount={discount}
        warranty={warranty}
        warrantyYear={warrantyYear}
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

    if (context) {
      await page.render({ canvasContext: context, viewport, canvas }).promise;
    }

    canvas.toBlob(async (blob) => {
      if (!blob) return
      const item = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);
      alert("Image copied to clipboard!");
    });
  };

  const customerFields = [
    { label: "Company", value: companyName },
    { label: "Name", value: name },
    { label: "Contact", value: phoneNumber },
    { label: "Address", value: address },
    { label: "Manager", value: manager },
    { label: receiverLabel, value: receiverValue },
  ];

  const bankRows = [
    ["Bank", "United Bank Limited (UBL)"],
    ["Account Title", "SENFENG PAKISTAN"],
    ["Account Number", "321618245"],
    ["IBAN", "PK33UNIL0109000321618245"],
    ["Branch Code", "0508"],
  ];

  return (
    <section className="mb-5 w-full min-w-0 rounded-md border border-[#BBD9F4] bg-[#F1F7FF] p-2 shadow-sm sm:p-3">
      <div ref={pdfRef} className="min-w-0 overflow-hidden rounded-md border-2 border-[#0072BC] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#D6E9FA] bg-[#F1F7FF] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <img src="/logo.png" alt="Senfeng Pakistan" className="h-10 w-44 object-contain sm:h-12 sm:w-56" />
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#0072BC]">
              <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 ring-1 ring-[#D6E9FA]">
                <CalendarDays className="h-3.5 w-3.5" />
                {invoiceDate}
              </span>
              <span className="rounded-md bg-white px-2 py-1 ring-1 ring-[#D6E9FA]">
                {nextInvoice || "xxxxxxxx-xxx"}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="rounded-md bg-[#0072BC] px-5 py-2 text-lg font-bold tracking-wide text-white">
              INVOICE
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-md border-[#0072BC] text-xs text-[#0072BC] hover:bg-[#EAF5FF] hover:text-[#0072BC]"
              onClick={captureAndCopyToClipboard}
            >
              <Copy className="mr-1 h-3.5 w-3.5" />
              Copy Image
            </Button>
          </div>
        </div>

        <div className="grid gap-3 p-3 lg:grid-cols-[1fr_260px]">
          <div className="rounded-md border border-[#D6E9FA] bg-[#F8FBFF] p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#0072BC]">Bill To</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {customerFields.map((field) => (
                <div key={field.label} className={field.label === "Address" ? "sm:col-span-2" : ""}>
                  <p className="text-[11px] font-semibold text-[#7F7F7F]">{field.label}</p>
                  <div className="min-h-8 rounded-md border border-[#E5E7EB] bg-[#dce4f1] px-2 py-1 text-xs font-semibold text-black">
                    {field.value || "-"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-[#D6E9FA] bg-[#F8FBFF] p-3 text-xs">
            <p className="text-base font-bold text-[#0072BC]">SENFENG PAKISTAN</p>
            <p className="mt-2 text-[#7F7F7F]">Street# 2, Sharif Garden Daroghawala, Lahore, Punjab 54000, Pakistan</p>
            <p className="mt-2 break-words text-[#7F7F7F]">senfenglaserpakistan@gmail.com</p>
          </div>
        </div>

        <div className="px-3 pb-3">
          <div className="overflow-x-auto rounded-md border border-[#D1D5DB]">
            <table className="w-full min-w-[620px] border-collapse text-xs">
              <thead>
                <tr className="bg-[#0072BC] text-white">
                  {["Sr.", "Description", "Quantity", "Unit Price", "Amount"].map((header) => (
                    <th key={header} className="border border-[#D1D5DB] px-2 py-2 text-left font-semibold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoiceItems.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-[#f1f1f1]" : "bg-white"}>
                    <td className="border border-[#D1D5DB] px-2 py-1.5 text-black">{i + 1}</td>
                    <td className="min-w-[240px] border border-[#D1D5DB] px-2 py-1.5 text-black">
                      {item?.description}
                    </td>
                    <td className="border border-[#D1D5DB] px-2 py-1.5 text-black">{item?.qty}</td>
                    <td className="border border-[#D1D5DB] px-2 py-1.5 text-black">{item?.price}</td>
                    <td className="border border-[#D1D5DB] px-2 py-1.5 text-black">{item?.total}</td>
                  </tr>
                ))}
                {[...Array(blankRows)].map((_, i) => (
                  <tr key={i} className="h-7 bg-white text-xs">
                    <td className="border border-[#D1D5DB] px-2 text-black">{i + invoiceItems.length + 1}</td>
                    <td className="border border-[#D1D5DB]" />
                    <td className="border border-[#D1D5DB]" />
                    <td className="border border-[#D1D5DB]" />
                    <td className="border border-[#D1D5DB]" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-4 space-y-4">
          <div className="flex w-full justify-end">
            <div className="w-full max-w-sm overflow-hidden rounded-md border border-[#0072BC] text-xs sm:text-sm">
              <div className="grid grid-cols-[1fr_1.4fr] bg-[#0072BC] text-white">
                <div className="px-3 py-2 font-semibold leading-tight">
                  Discount
                </div>

                <div className="border-l border-white/70 px-3 py-2 text-right font-semibold leading-tight">
                  -<CurrencyFormatter amount={discount || 0} showPKR={false} />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_1.4fr] border-t border-white/70 bg-[#005f9e] text-white">
                <div className="px-3 py-3 font-bold leading-tight">
                  Total Amount
                </div>

                <div className="border-l border-white/70 px-3 py-3 text-right font-bold leading-tight">
                  <CurrencyFormatter amount={totalAmount || 0} showPKR={true} />/-
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-md border border-[#D6E9FA] bg-[#F8FBFF] p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#0072BC]">Bank Details</p>
            <div className="overflow-x-auto rounded-md border border-[#D1D5DB]">
              <table className="w-full min-w-[360px] border-collapse text-xs">
                <tbody>
                  {bankRows.map(([label, value], index) => (
                    <tr key={label} className={index % 2 ? "bg-[#FFE4E1]" : "bg-white"}>
                      <td className="w-32 border border-[#D1D5DB] px-2 py-2 text-black">{label}</td>
                      <td className="border border-[#D1D5DB] px-2 py-2 font-bold text-[#0072BC]">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>


        </div>

        {warranty && (
          <div className="mx-3 mb-3 rounded-md border border-[#D1D5DB] bg-white p-3 text-xs leading-relaxed">
            <p className="font-semibold text-red-600">
              {warrantyYear}-Year Warranty for New Source (Will Start on the Date of Installation) *Warranty does not cover damages caused by mishandling, misuse, abuse, unstable electricity & voltage fluctuation, inexpert repair, improper transportation, unsuitable storage or use under harsh environment or conditions at Buyer&apos;s end.
            </p>
            <p className="mt-2 text-center text-sm font-bold text-orange-500">Terms and Conditions:</p>
            <p className="mt-1 text-black">
              Equipment can only be used after full payments only and broken seals are not acceptable for any return or warranties. Sensitive repair and maintenance can only be done by Raycus/MAX China within warranty time. Customer will send and receive the equipment to manufacturer by himself.
            </p>
          </div>
        )}

        <div className="border-t border-[#D6E9FA] bg-[#F8FBFF] px-3 py-2 text-center text-xs font-bold text-[#0072BC]">
          DISCLAIMER: This is an auto generated Invoice and does not require a signature.
        </div>
        <div className="flex flex-col gap-2 px-3 py-3 text-sm font-bold text-[#0072BC] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <Label>+92 333 9180410</Label>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <Label>www.senfenglaserpk.com</Label>
          </div>
        </div>
      </div>
    </section>
  );
}
