import axios from "@/lib/axios";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import "./Button.css";
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import useUserDetail from "@/hooks/use-user-detail";
import exportToExcel from "@/lib/exportToExcel";
import { StockProps } from "@/lib/types";
import { Download, PackagePlus, Search, Send, UsersRound } from "lucide-react";
import moment from "moment";
import "pdfjs-dist/build/pdf.worker.mjs";
import "pdfjs-dist/legacy/web/pdf_viewer.css";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import Spinner from "@/components/ui/spinner";
import { UserSearch } from "@/components/shared/search/user-search";
import RenderOtherStockItems from "./render-other-stock-items";

const OrderStockDialog = ({
  dialogVisible,
  onCloseDialog,
  stock,
  onRefresh,
}: {
  dialogVisible: boolean,
  onCloseDialog: (val: boolean) => void
  stock: StockProps[]
  onRefresh: () => Promise<void>
}) => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const { userID, isAdmin } = useUserDetail()
  const [sendTo, setSendTo] = useState<number | null>(null);



  const toggleItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedItems(stock.map((item) => item.id));
  };

  const deselectAll = () => {
    setSelectedItems([]);
  };

  async function handleCreateExcel() {
    setLoading(true);

    const headers = [
      "Name",
      "English Name",
      "New Order",
      "Buying Price",
      "Image",
    ];

    const formattedData = stock
      .filter((item) => selectedItems.includes(item.id)) // only selected
      .map((item) => [
        item.chinese_name,
        item.name,
        item.new_order,
        item.buying,
        item.img,
      ]);

    try {
      if (formattedData.length === 0) {
        toast.info("No items selected");
        return;
      }
      await exportToExcel(headers, formattedData, "New Order.xlsx", true, "products", true);
    } catch (error) {
      toast.error("Error creating excel");
    } finally {
      setLoading(false);
    }
  }

  const filteredStock = stock.filter((item) =>
    item?.name?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleShare() {
    setLoading(true);

    const formattedData = stock.filter((item) =>
      selectedItems.includes(item.id)
    );

    try {
      const response = await axios.post(
        `/${userID}/conversations`,
        {
          user1: userID,
          user2: sendTo,
        }
      );
      if (response.data?.id) {
        let formData = { type: "neworder", content: formattedData };

        await axios
          .post(
            `/${userID}/conversations/${response.data?.id}`,
            {
              senderId: userID,
              message: `New stock order generated ${moment().format(
                "YYYY-MM-DD"
              )}`,
              data: JSON.stringify(formData),
            }
          )
          .then(() => {
            toast.success("Report sent");
          });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={dialogVisible} onOpenChange={onCloseDialog}>
      <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-[92vw] xl:max-w-[1180px]">
        <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                <PackagePlus className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold text-foreground">Order New Stock</DialogTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {selectedItems.length} selected from {stock.length} items
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end pr-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="justify-center rounded-md">
                    <UsersRound className="mr-2 h-4 w-4" />
                    Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={selectAll}>
                    Select All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={deselectAll}>
                    Deselect All
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {isAdmin &&
                <Button
                  size="sm"
                  disabled={selectedItems.length === 0 || loading}
                  onClick={handleCreateExcel}
                >
                  {loading ? <Spinner className="mr-2" /> : <Download className="mr-2 h-4 w-4" />}
                  Export
                </Button>}

              {!isAdmin &&
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="min-w-0 sm:w-[220px]">
                    <UserSearch onReturn={setSendTo} value={sendTo} />
                  </div>
                  <Button
                    size="sm"
                    className="h-9 whitespace-nowrap rounded-md"
                    disabled={!sendTo || loading || selectedItems.length === 0}
                    onClick={handleShare}
                  >
                    {loading ? <Spinner className="mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                    Send Report
                  </Button>
                </div>
              }
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100dvh-132px)]">
        <div className="border-b p-3.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 rounded-md border-border/70 bg-background pl-9 text-sm"
              placeholder="Search items here"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-muted/10">
          <div className="p-3 sm:p-4">
            <div className="grid w-full gap-2">
              {filteredStock.map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex w-full min-w-0 items-start gap-2 rounded-md border bg-card p-2.5 shadow-sm transition-colors hover:bg-muted/30"
                >
                  {isAdmin &&
                    <Checkbox
                      className="mt-2 shrink-0"
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => toggleItem(item.id)}
                    />
                  }
                  <div className="min-w-0 flex-1">
                    <RenderOtherStockItems
                      item={item}
                      onRefresh={onRefresh}
                    />
                  </div>
                </div>
              ))}
              {filteredStock.length === 0 && (
                <div className="rounded-md border border-dashed bg-background p-8 text-center">
                  <p className="text-sm font-semibold">No stock items found</p>
                  <p className="mt-1 text-xs text-muted-foreground">Try a different search keyword.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default OrderStockDialog;
