import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "@/lib/axios";
import { useEffect, useMemo, useState } from "react";
import "./Button.css";

import { MyImgZooming } from "@/components/shared/media/img-zooming";
import { UserSearch } from "@/components/shared/search/user-search";
import { Checkbox } from "@/components/ui/checkbox";
import Spinner from "@/components/ui/spinner";
import { storage } from "@/config/firebase";
import useUserDetail from "@/hooks/use-user-detail";
import exportToExcel from "@/lib/exportToExcel";
import { StockProps } from "@/lib/types";
import { getDownloadURL, ref } from "firebase/storage";
import {
  BadgeDollarSign,
  Boxes, Download, PackagePlus, Search, Send, UsersRound
} from "lucide-react";
import moment from "moment";
import "pdfjs-dist/build/pdf.worker.mjs";
import "pdfjs-dist/legacy/web/pdf_viewer.css";
import { toast } from "sonner";

import "./Button.css";

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;

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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
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
      .filter((item) => selectedItems.includes(item.id))
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

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const filteredStock = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();

    return stock.filter((item) =>
      item?.name?.toLowerCase().includes(query)
    );
  }, [debouncedSearch, stock]);

  const totalPages = Math.max(1, Math.ceil(filteredStock.length / PAGE_SIZE));
  const paginatedStock = filteredStock.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );
  const pageStart = filteredStock.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const pageEnd = Math.min(page * PAGE_SIZE, filteredStock.length);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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
        const formData = { type: "neworder", content: formattedData };

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
              <div className="mb-3 flex flex-col gap-2 rounded-md border bg-background px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
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
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
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
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
              <div className="grid w-full gap-2">
                {paginatedStock.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex w-full min-w-0 items-start gap-2 rounded-md border bg-card p-2.5 shadow-sm transition-colors hover:bg-muted/30"
                  >

                    <Checkbox
                      className="mt-2 shrink-0"
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => toggleItem(item.id)}
                    />

                    <div className="min-w-0 flex-1">
                      <RenderOtherStockItems
                        item={item}
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


const RenderOtherStockItems = ({ item }: { item: StockProps }) => {

  const [itemImg, setImg] = useState<string | null>(null);

  const [imageLoading, setImageLoading] = useState(false);
  const { isAdmin } = useUserDetail();

  useEffect(() => {
    async function getImage(refImage: string) {
      setImageLoading(true);
      const starsRef = ref(storage, `products/${refImage}`);
      getDownloadURL(starsRef)
        .then((url) => {
          setImg(url);
        })
        .finally(() => {
          setImageLoading(false);
        });
    }
    if (item.img) {
      getImage(item.img);
    }
  }, []);


  const viewGridClass = isAdmin
    ? "md:grid-cols-[72px_minmax(180px,1fr)_minmax(130px,0.5fr)_minmax(130px,0.5fr)]"
    : "md:grid-cols-[72px_minmax(180px,1fr)_minmax(130px,0.5fr)]";

  return (
    <div className="w-full min-w-0 rounded-md border border-border/70 bg-background/95 p-2.5">
      <div className="flex w-full min-w-0 items-start gap-3">
        <div className={`grid min-w-0 flex-1 gap-3 md:items-center ${viewGridClass}`}>
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
            {imageLoading ? (
              <Spinner />
            ) : itemImg ? (
              <MyImgZooming img={itemImg} />
            ) : (
              <img
                src="/noImage_icon.png"
                className="h-10 w-10 object-contain opacity-70"
              />
            )}
          </div>

          <div className="min-w-0">
            <p className="break-words text-sm font-semibold leading-snug text-foreground">
              {item.name || "Unnamed product"}
            </p>
            <p className="mt-1 break-words text-xs leading-snug text-muted-foreground">
              {item.chinese_name || "No chinese name"}
            </p>
          </div>

          <div className="flex min-w-0 items-center gap-2 rounded-md border bg-muted/20 px-2.5 py-2">
            <Boxes className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase text-muted-foreground">
                New order
              </p>
              <p className="break-words text-sm font-bold">
                {item.new_order || 0}
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex min-w-0 items-center gap-2 rounded-md border bg-muted/20 px-2.5 py-2">
              <BadgeDollarSign className="h-4 w-4 shrink-0 text-emerald-600" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase text-muted-foreground">
                  Buying
                </p>
                <p className="break-words text-sm font-bold">
                  CNY {item.buying || 0}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderStockDialog;
