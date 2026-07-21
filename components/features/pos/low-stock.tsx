import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    List,
    Search,
    Table2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import "./Button.css";
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { StockProps } from "@/lib/types";
import "pdfjs-dist/build/pdf.worker.mjs";
import "pdfjs-dist/legacy/web/pdf_viewer.css";
import RenderStockItems from "./render-stock-items";
import RenderStockItemsOtherView from "./render-stock-items-other-view";


export default function LoweStock({ stock, handleOrderStock, }: { stock: StockProps[], handleOrderStock: () => void, }) {

    const [search, setSearch] = useState("");
    const [lowStockStatus, setLowStockStatus] = useState(false);
    const [view, setView] = useState(false);
    const [page, setPage] = useState(1);
    const pageSize = 50;

    const [open, setOpen] = useState(false)
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

    function handleToggle() {
        setOpen(!open)
    }

    const filteredStock = useMemo(
        () =>
            stock
                .filter((item) =>
                    item.threshold != null &&
                    item.threshold !== undefined &&
                    (item.qty || 0) <= item.threshold

                )
                .filter((item) =>
                    item?.name?.toLowerCase().includes(search.toLowerCase())
                ),
        [search, stock]
    );

    const totalPages = Math.max(1, Math.ceil(filteredStock.length / pageSize));
    const paginatedStock = filteredStock.slice((page - 1) * pageSize, page * pageSize);
    const pageStart = filteredStock.length ? (page - 1) * pageSize + 1 : 0;
    const pageEnd = Math.min(page * pageSize, filteredStock.length);


    return (
        <>
            <Button
                onClick={handleToggle}
                className={`h-16 rounded-md whitespace-normal text-wrap text-center text-xs font-semibold ${lowStockStatus ? "blinking-button" : ""}`}
            >
                <div className="break-words">Low Stock</div>
            </Button>

            <Dialog open={open} onOpenChange={handleToggle}>
                <DialogContent className="max-w-[94vw] overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-6xl">
                    <DialogHeader className="border-b border-border bg-muted/40 px-4 py-3 ">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between w-full">
                            <div>
                                <DialogTitle className="text-sm font-semibold text-foreground">Select Item</DialogTitle>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {stock.length} items available
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pr-4">

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
                    

                        <ScrollArea className="max-h-[calc(100dvh-400px)] sm:max-h-[calc(100dvh-132px)] p-4">
                            <div className="w-full">
                                
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                                            Search inventory
                                        </label>
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                className="h-9 rounded-md bg-background pl-9 text-sm"
                                                placeholder="Search items here"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>


                                
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
                                <div>
                                    <div className="flex flex-col gap-3 p-3">
                                        <div className={view ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col gap-2"}>

                                            {paginatedStock
                                                .map((item, index) =>
                                                    view ? (
                                                        <RenderStockItems
                                                            key={index}
                                                            item={item}

                                                        />
                                                    ) : (
                                                        <RenderStockItemsOtherView
                                                            key={index}
                                                            item={item}
                                                        />
                                                    )
                                                )}
                                        </div>


                                    </div>
                                </div>
                            </div>

                        </ScrollArea>

                    
                </DialogContent>
            </Dialog>

        </>
    )
}