import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { List, Search, Table2 } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import "./Button.css";
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { InvoiceItem, StockProps } from "@/lib/types";
import "pdfjs-dist/build/pdf.worker.mjs";
import "pdfjs-dist/legacy/web/pdf_viewer.css";
import RenderStockItems from "./render-stock-items";
import RenderStockItemsOtherView from "./render-stock-items-other-view";

type AddItemDialogProp = {
  designation: string;
  visible: boolean;
  onClose: (val: boolean) => void;
  handleDecrease: (item: StockProps) => void;
  showOther: boolean;
  setShowOther: Dispatch<SetStateAction<boolean>>;
  stock: StockProps[];
  invoiceItems: InvoiceItem[];
  price: string | number;
  setPrice: Dispatch<SetStateAction<string | number>>;
  setQty: Dispatch<SetStateAction<string | number>>;
  qty: string | number;
  other: string;
  setOther: Dispatch<SetStateAction<string>>;
  handleIncrease: (item: StockProps) => void;
  handleAddToInvoice: () => void;
  onRefresh: () => void;
  handleOrderStock: () => void;
  dialogVisible: boolean;
  onCloseDialog: Dispatch<SetStateAction<boolean>>;
};

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
}: AddItemDialogProp) => {
  const [search, setSearch] = useState("");
  const [lowStockStatus, setLowStockStatus] = useState(false);
  const [clickedLowStock, setClickedLowStock] = useState(false);
  const [view, setView] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const filteredStock = useMemo(
    () =>
      stock
        .filter((item) =>
          clickedLowStock
            ? item.threshold != null &&
              item.threshold !== undefined &&
              (item.qty || 0) <= item.threshold
            : item,
        )
        .filter((item) =>
          item?.name?.toLowerCase().includes(search.toLowerCase()),
        ),
    [clickedLowStock, search, stock],
  );
  const totalPages = Math.max(1, Math.ceil(filteredStock.length / pageSize));
  const paginatedStock = filteredStock.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const pageStart = filteredStock.length ? (page - 1) * pageSize + 1 : 0;
  const pageEnd = Math.min(page * pageSize, filteredStock.length);

  useEffect(() => {
    if (stock.length > 0) {
      const hasLowStock = stock.some(
        (item) =>
          item.threshold != null &&
          item.threshold !== undefined &&
          item.threshold <= (item?.qty || 0),
      );
      setLowStockStatus(hasLowStock);
    }
  }, [stock]);

  useEffect(() => {
    setPage(1);
  }, [clickedLowStock, search, view]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  function handleLowStock() {
    setClickedLowStock(!clickedLowStock);
  }

  return (
    <Dialog open={dialogVisible} onOpenChange={onCloseDialog}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-6xl">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground">
                Select Item
              </DialogTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {stock.length} items available
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pr-4">
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
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          <div className="col-span-1">
            <div className="border-b bg-muted/10 py-2 pl-2">
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Search inventory
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="h-9 rounded-md bg-background pl-9 text-sm"
                      placeholder="Search items here"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-md border bg-card p-2.5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                      Quick actions
                    </p>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      Manual
                    </span>
                  </div>

                  <div className="grid gap-2">
                    <button
                      type="button"
                      className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-md border border-dashed px-3 py-3 text-left transition hover:bg-muted/40 ${
                        showOther
                          ? "border-primary bg-primary/10 text-primary"
                          : "bg-background"
                      }`}
                      onClick={() => {
                        setShowOther(!showOther);
                        setOther("");
                        setQty("");
                        setPrice("");
                      }}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <List className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm leading-tight font-bold">
                          Other Item
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          Add custom line item
                        </span>
                      </span>
                    </button>
                  </div>
                </div>

                {showOther && (
                  <div className="rounded-md border bg-card p-3">
                    <div className="mb-3">
                      <p className="text-sm font-bold">Custom item</p>
                      <p className="text-xs text-muted-foreground">
                        This item will be added only to the invoice.
                      </p>
                    </div>
                    <div className="grid gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                          Item Name
                        </label>
                        <Input
                          className="h-8 rounded-md text-sm"
                          value={other}
                          onChange={(e) => setOther(e.target.value)}
                          placeholder="Enter name..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                            Quantity
                          </label>
                          <Input
                            className="h-8 rounded-md text-sm"
                            type="number"
                            placeholder="Qty"
                            value={qty || ""}
                            onChange={(e) => setQty(Number(e.target.value))}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                            Price
                          </label>
                          <Input
                            className="h-8 rounded-md text-sm"
                            type="number"
                            placeholder="Price"
                            value={price || ""}
                            onChange={(e) => setPrice(Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 rounded-md px-5 text-xs"
                        disabled={
                          !other || !qty || !price || qty === 0 || price === 0
                        }
                        onClick={handleAddToInvoice}
                      >
                        Add Custom Item
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <ScrollArea className="col-span-3 max-h-[calc(100dvh-400px)] sm:max-h-[calc(100dvh-132px)] lg:border-l">
            <div className="min-w-0">
              <div className="flex flex-col gap-2 border-b bg-background/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-muted-foreground">
                  Showing {pageStart}-{pageEnd} of {filteredStock.length} items
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-md px-2 text-xs"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                  >
                    Previous
                  </Button>
                  <span className="rounded-md border bg-muted px-2 py-1 text-xs font-bold">
                    {page} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-md px-2 text-xs"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
              <div>
                <div className="flex flex-col gap-3 p-3">
                  <div
                    className={
                      view
                        ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        : "flex flex-col gap-2"
                    }
                  >
                    {paginatedStock.map((item, index) =>
                      view ? (
                        <RenderStockItems
                          key={index}
                          item={item}
                          invoiceItems={invoiceItems}
                          handleDecrease={handleDecrease}
                          handleIncrease={handleIncrease}
                          onRefresh={onRefresh}
                          designation={designation}
                        />
                      ) : (
                        <RenderStockItemsOtherView
                          key={index}
                          item={item}
                          invoiceItems={invoiceItems}
                          handleDecrease={handleDecrease}
                          handleIncrease={handleIncrease}
                          onRefresh={onRefresh}
                          designation={designation}
                        />
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemDialog;
