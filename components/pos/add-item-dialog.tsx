import {
    List,
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
      <DialogContent className="w-full sm:max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Select Item</DialogTitle>
        </DialogHeader>
        <div className="flex flex-1 justify-end gap-4 items-center">
          <Button
            onClick={() => {
              if (lowStockStatus) {
                handleLowStock();
              }
            }}
            variant="destructive"
            className={lowStockStatus ? "blinking-button" : ""}
          >
            Low Stock
          </Button>
          <Button onClick={handleOrderStock}>Order Stock</Button>

          {view ? (
            <Table2 className="cursor-pointer" onClick={() => setView(!view)} />
          ) : (
            <List className="cursor-pointer" onClick={() => setView(!view)} />
          )}
        </div>
        <Input
          placeholder="Search items here"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <ScrollArea className="h-[70vh]">
          <div className="flex flex-col gap-5 p-4">
            <div className="flex flex-wrap gap-2 justify-center">
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
              <>
                <div className="w-full">
                  <label className="font-semibold text-xl block">
                    Enter Item Name
                  </label>
                  <Input
                    value={other}
                    onChange={(e) => setOther(e.target.value)}
                    placeholder="Enter name..."
                  />
                </div>
                <div className="gap-2 w-full">
                  <label className="font-semibold text-xl block">
                    Enter Quantity
                  </label>
                  <Input
                    type="number"
                    placeholder="Quantity"
                    value={qty || ""}
                    onChange={(e) => setQty(Number(e.target.value))}
                  />
                </div>

                <div className="gap-2 w-full">
                  <label className="font-semibold text-xl block">
                    Enter Price
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter Price"
                    value={price || ""}
                    onChange={(e) => setPrice(Number(e.target.value))}
                  />
                </div>
                <Button
                  className="mt-2"
                  disabled={
                    !other || !qty || !price || qty === 0 || price === 0
                  }
                  onClick={handleAddToInvoice}
                >
                  Add
                </Button>
              </>
            )}
          </div>
        </ScrollArea>

      </DialogContent>
    </Dialog>
  );
};

export default AddItemDialog;
