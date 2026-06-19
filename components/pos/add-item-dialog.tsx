import {
  List,
  Search,
  Table2
} from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "../ui/dialog";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import "./Button.css";
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import "pdfjs-dist/build/pdf.worker.mjs";
import "pdfjs-dist/legacy/web/pdf_viewer.css";
import RenderStockItems from "./render-stock-items";
import RenderStockItemsOtherView from "./render-stock-items-other-view";
import { InvoiceItem, StockProps } from "@/lib/types";

type AddItemDialogProp = {
   designation : string,
  visible : boolean,
  onClose : (val : boolean)=> void,
  handleDecrease : (item : StockProps)=> void,
  showOther : boolean,
  setShowOther : Dispatch<SetStateAction<boolean>>,
  stock : StockProps[],
  invoiceItems: InvoiceItem[],
  price : string | number,
  setPrice : Dispatch<SetStateAction<string | number>>,
  setQty : Dispatch<SetStateAction<string | number>>,
  qty : string | number,
  other :string,
  setOther : Dispatch<SetStateAction<string>>,
  handleIncrease : (item : StockProps)=> void,
  handleAddToInvoice : ()=> void,
  onRefresh : ()=> void,
  handleOrderStock : ()=> void,
  dialogVisible : boolean,
  onCloseDialog : Dispatch<SetStateAction<boolean>>,
}

const AddItemDialog = ({
  designation,
  visible,
  onClose,
  handleDecrease,
  showOther,
  setShowOther,
  stock,
  invoiceItems,
  price,
  setPrice,
  setQty,
  qty,
  other,
  setOther,
  handleIncrease,
  handleAddToInvoice,
  onRefresh,
  handleOrderStock,
  dialogVisible,
  onCloseDialog,
} : AddItemDialogProp) => {
  const [search, setSearch] = useState("");
  const [lowStockStatus, setLowStockStatus] = useState(false);
  const [clickedLowStock, setClickedLowStock] = useState(false);
  const [view, setView] = useState(false);

  useEffect(() => {
    if (stock.length > 0) {
      const hasLowStock = stock.some(
        (item) =>
          item.threshold != null &&
          item.threshold !== undefined &&
          item.threshold <= (item?.qty || 0)
      );
      setLowStockStatus(hasLowStock);
    }
  }, [stock]);

  function handleLowStock() {
    setClickedLowStock(!clickedLowStock);
  }

  return (
    <Dialog open={dialogVisible} onOpenChange={onCloseDialog}>
      <DialogContent className="max-h-[92vh] w-[96vw] overflow-hidden rounded-md p-0 sm:max-w-6xl">
        <DialogHeader className="border-b bg-muted/30 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <DialogTitle className="text-base font-bold">Select Item</DialogTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {stock.length} items available
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  if (lowStockStatus) {
                    handleLowStock();
                  }
                }}
                variant={clickedLowStock ? "destructive" : "outline"}
                className={`h-8 rounded-md px-3 text-xs ${lowStockStatus ? "blinking-button" : ""}`}
              >
                Low Stock
              </Button>
              <Button size="sm" className="h-8 rounded-md px-3 text-xs" onClick={handleOrderStock}>
                Order Stock
              </Button>

              <div className="flex rounded-md border bg-background p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={!view ? "default" : "ghost"}
                  className="h-7 rounded-md px-2 text-xs"
                  onClick={() => setView(false)}
                >
                  <List className="mr-1 h-3.5 w-3.5" />
                  List
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={view ? "default" : "ghost"}
                  className="h-7 rounded-md px-2 text-xs"
                  onClick={() => setView(true)}
                >
                  <Table2 className="mr-1 h-3.5 w-3.5" />
                  Cards
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="border-b px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 rounded-md pl-9 text-sm"
              placeholder="Search items here"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="h-[68vh]">
          <div className="flex flex-col gap-3 p-3">
            <div className={view ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col gap-2"}>
              {stock
                .filter((item) =>
                  clickedLowStock
                    ? item.threshold != null &&
                      item.threshold !== undefined &&
                     ( item.qty || 0) <= item.threshold
                    : item
                )
                .filter((item) =>
                  item?.name?.toLowerCase().includes(search.toLowerCase())
                )
                .map((item, index) =>
                  view ? (
                    <RenderStockItems
                      key={index}
                      item={item}
                      index={index}
                      invoiceItems={invoiceItems}
                      handleDecrease={handleDecrease}
                      handleIncrease={handleIncrease}
                      showOther={showOther}
                      setShowOther={setShowOther}
                      setQty={setQty}
                      setPrice={setPrice}
                      setOther={setOther}
                      visible={visible}
                      onClose={onClose}
                      onRefresh={onRefresh}
                      designation={designation}
                    />
                  ) : (
                    <RenderStockItemsOtherView
                      key={index}
                      item={item}
                      index={index}
                      invoiceItems={invoiceItems}
                      handleDecrease={handleDecrease}
                      handleIncrease={handleIncrease}
                      showOther={showOther}
                      setShowOther={setShowOther}
                      setQty={setQty}
                      setPrice={setPrice}
                      setOther={setOther}
                      visible={visible}
                      onClose={onClose}
                      onRefresh={onRefresh}
                      designation={designation}
                    />
                  )
                )}
            </div>

            {showOther && (
              <div className="rounded-md border bg-muted/20 p-3">
                <div className="grid gap-3 md:grid-cols-[1fr_160px_160px_auto] md:items-end">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                    Enter Item Name
                    </label>
                    <Input
                      className="h-8 rounded-md text-sm"
                      value={other}
                      onChange={(e) => setOther(e.target.value)}
                      placeholder="Enter name..."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                    Enter Quantity
                    </label>
                    <Input
                      className="h-8 rounded-md text-sm"
                      type="number"
                      placeholder="Quantity"
                      value={qty || ""}
                      onChange={(e) => setQty(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                    Enter Price
                    </label>
                    <Input
                      className="h-8 rounded-md text-sm"
                      type="number"
                      placeholder="Enter Price"
                      value={price || ""}
                      onChange={(e) => setPrice(Number(e.target.value))}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="h-8 rounded-md px-5 text-xs"
                    disabled={
                      !other || !qty || !price || qty === 0 || price === 0
                    }
                    onClick={handleAddToInvoice}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

      </DialogContent>
    </Dialog>
  );
};

export default AddItemDialog;
