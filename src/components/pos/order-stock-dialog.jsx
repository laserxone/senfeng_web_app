import axios from "@/lib/axios";
import { useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import useUserDetail from "@/hooks/use-user-detail";
import exportToExcel from "@/lib/exportToExcel";
import moment from "moment";
import "pdfjs-dist/build/pdf.worker.mjs";
import "pdfjs-dist/legacy/web/pdf_viewer.css";
import { Checkbox } from "../ui/checkbox";
import Spinner from "../ui/spinner";
import { UserSearch } from "../user-search";
import RenderOtherStockItems from "./render-other-stock-items";

const OrderStockDialog = ({
  dialogVisible,
  onCloseDialog,
  stock,
  onRefresh,
}) => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const {userID, isAdmin} = useUserDetail()
  const [sendTo, setSendTo] = useState(null);



  const toggleItem = (id) => {
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
        toast({
          title: "No items selected",
          description: "Please select items first.",
        });
        return;
      }
      await exportToExcel(headers, formattedData, "New Order.xlsx", true, "products", true);
    } catch (error) {
      toast({
        title: "Error",
        description: error || "Error creating excel",
      });
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
            toast({ title: "Report sent" });
          });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={dialogVisible} onOpenChange={onCloseDialog}>
      <DialogContent className="w-full sm:max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Order new stock</DialogTitle>

          <div className="flex flex-1 justify-end gap-4 items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Bulk Actions</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={selectAll}>
                  Select All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={deselectAll}>
                  Deselect All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isAdmin ? (
              <Button
                disabled={selectedItems.length === 0}
                onClick={handleCreateExcel}
              >
                {loading && <Spinner className="mr-2" />}
                Export
              </Button>
            ) : (
              <div className="flex gap-2 items-center">
                <UserSearch
                  className="w-[200px]"
                  onReturn={setSendTo}
                  value={sendTo}
                />
                <Button
                  disabled={!sendTo || loading || selectedItems.length === 0}
                  onClick={handleShare}
                >
                  {loading && <Spinner />}Send Report
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <Input
          placeholder="Search items here"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <ScrollArea className="h-[70vh]">
          <div className="flex flex-col gap-5 p-4">
            <div className="flex flex-wrap gap-4 w-full">
              {filteredStock.map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex items-center gap-2 w-full"
                >
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <RenderOtherStockItems
                    index={index}
                    item={item}
                    onRefresh={onRefresh}
                  />
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default OrderStockDialog;
