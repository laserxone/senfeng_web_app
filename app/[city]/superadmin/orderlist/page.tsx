"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import Heading from "@/components/ui/heading";
import useUserDetail from "@/hooks/use-user-detail";
import axios from "@/lib/axios";
import formatCurrency from "@/lib/formatCurrency";
import {
    RefreshCcw,
    Search,
    ChevronDown,
    ChevronUp,
    Trash2,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    MoveVertical,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SaleData = {
    id: number;
    serial_no: string | null;
    power: string | null;
    order_no_arr: string[] | string | null;
    price: string | number | null;
};

type OrderListRow = {
    id: number;
    order_id: number | null;
    inventory_id: number | null;
    item_name: string | null;
    order_title: string | null;
    customer_id: number | null;
    customer_name: string | null;
    customer_location: string | null;
    customer_owner: string | null;
    ownership_name: string | null;
    booked_name: string | null;
    qty: number;
    price: string | number;
    buying_price: string | number;
    is_machine: boolean;
    booked: boolean;
    booking_date: string | null;
    status: string | null;
    location: string | null;
    show: boolean;
    machine_serial: string | null;
    machine_model: string | null;
    machine_power: string | null;
    machine_source: string | null;
    machine_id: number | null;
    has_sale: boolean;
    sale_data: SaleData | null;
    sold_order_no: string | null;
    row_date?: string | null;
};

type SortDir = "asc" | "desc";
type SortKey =
    | "order_title"
    | "customer_name"
    | "customer_location"
    | "ownership_name"
    | "machine_serial"
    | "machine_model"
    | "machine_power"
    | "price"
    | "row_date";

type SortState = { key: SortKey; dir: SortDir } | null;

type ContextMenuState = {
    rowId: number;
    x: number;
    y: number;
} | null;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
    const { userID } = useUserDetail();

    const [rows, setRows] = useState<OrderListRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [movedRow, setMovedRow] = useState<OrderListRow | null>(null);
    const [search, setSearch] = useState("");
    const [expandedOrders, setExpandedOrders] = useState<Set<string | number>>(new Set());
    const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
    const [sortState, setSortState] = useState<SortState>(null);
    const { open } = useSidebar();
    const contextMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (userID) fetchData();
    }, [userID]);

    // Escape: clear moved state + close context menu
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setMovedRow(null);
                setContextMenu(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Close context menu on outside click
    useEffect(() => {
        if (!contextMenu) return;
        const handle = (e: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
                setContextMenu(null);
            }
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [contextMenu]);

    async function fetchData() {
        try {
            setLoading(true);
            const res = await axios.get(`/${userID}/orderlist`);
            const data: OrderListRow[] = (res.data ?? []).map((r: OrderListRow) => ({
                ...r,
                row_date: r.row_date ?? null,
            }));
            setRows(data);
            if (data.length > 0) {
                const firstOrderId = data[0].order_id ?? "no-order";
                setExpandedOrders(new Set([firstOrderId]));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const updateCell = useCallback(
        (rowId: number, key: keyof OrderListRow, value: string) => {
            setRows((prev) =>
                prev.map((row) => (row.id === rowId ? { ...row, [key]: value } : row))
            );
        },
        []
    );

    // Mark a row as "being moved" and remove it from its current position
    const startMove = useCallback(
        (row: OrderListRow) => {
            setMovedRow(row);
            setRows((prev) => prev.filter((r) => r.id !== row.id));
            setContextMenu(null);
        },
        []
    );

    // Insert the moved row relative to a target
    const insertMovedRow = useCallback(
        (targetRowId: number, position: "above" | "below") => {
            if (!movedRow) return;
            setRows((prev) => {
                const targetIndex = prev.findIndex((r) => r.id === targetRowId);
                if (targetIndex === -1) return prev;
                const insertAt = position === "above" ? targetIndex : targetIndex + 1;
                return [
                    ...prev.slice(0, insertAt),
                    movedRow,
                    ...prev.slice(insertAt),
                ];
            });
            setMovedRow(null);
            setContextMenu(null);
        },
        [movedRow]
    );

    // Cancel move: put the row back at the end of its order group
    const cancelMove = useCallback(() => {
        if (!movedRow) return;
        setRows((prev) => [...prev, movedRow]);
        setMovedRow(null);
    }, [movedRow]);

    const deleteRow = useCallback((rowId: number) => {
        setRows((prev) => prev.filter((row) => row.id !== rowId));
    }, []);

    const toggleOrderExpanded = useCallback((orderId: string | number) => {
        setExpandedOrders((prev) => {
            const next = new Set(prev);
            if (next.has(orderId)) next.delete(orderId);
            else next.add(orderId);
            return next;
        });
    }, []);

    const handleSortColumn = useCallback((key: SortKey) => {
        setSortState((prev) => {
            if (prev?.key === key) {
                return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
            }
            return { key, dir: "asc" };
        });
    }, []);

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((row) =>
            [
                row.order_title,
                row.customer_name,
                row.customer_owner,
                row.ownership_name,
                row.booked_name,
                row.machine_serial,
                row.machine_model,
                row.machine_power,
                row.sale_data?.serial_no,
                row.sale_data?.power,
                row.status,
                row.location,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(q)
        );
    }, [rows, search]);

    const groupedRows = useMemo(() => {
        return filteredRows.reduce(
            (acc, row) => {
                const key = row.order_id ?? "no-order";
                if (!acc[key]) acc[key] = [];
                acc[key].push(row);
                return acc;
            },
            {} as Record<string | number, OrderListRow[]>
        );
    }, [filteredRows]);

    const totalItems = useMemo(
        () => Object.values(groupedRows).reduce((s, arr) => s + arr.length, 0),
        [groupedRows]
    );

    return (
        <div className="flex flex-1 flex-col gap-6 pb-8">
            {/* Header */}
            <div className="flex flex-col justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
                <Heading
                    panel
                    title="Order Management"
                    description={totalItems > 0
                        ? `${totalItems} item${totalItems !== 1 ? "s" : ""} across ${Object.keys(groupedRows).length} order${Object.keys(groupedRows).length !== 1 ? "s" : ""}`
                        : "Manage and organize your orders"}
                />

                <Button onClick={fetchData} disabled={loading} variant="outline" size="sm" className="w-full sm:w-auto gap-2">
                    <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {/* Main card */}
            <div className="rounded-xl border border-border bg-card shadow-sm">
                {/* Toolbar */}
                <div className="flex flex-col justify-between gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold text-foreground">Order Items</h3>
                        {sortState && (
                            <button
                                onClick={() => setSortState(null)}
                                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-muted/80 transition-colors"
                            >
                                Sorted: {sortState.key} {sortState.dir === "asc" ? "↑" : "↓"}
                                <X className="h-3 w-3 ml-0.5" />
                            </button>
                        )}
                    </div>

                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search orders, customers, serials…"
                            className="pl-8 h-9 text-sm"
                        />
                    </div>
                </div>

                {/* Move banner */}
                {movedRow && (
                    <div className="flex items-center justify-between gap-4 border-b border-amber-200 bg-amber-50 px-6 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                        <div className="flex items-center gap-2.5">
                            <MoveVertical className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="text-sm text-amber-800 dark:text-amber-300">
                                Moving{" "}
                                <strong className="font-semibold">
                                    {movedRow.order_title || `Row #${movedRow.id}`}
                                </strong>
                                {" "}— right-click any row to insert above or below.
                            </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <kbd className="rounded border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-xs font-mono text-amber-700 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-400">
                                Esc
                            </kbd>
                            <span className="text-xs text-amber-600 dark:text-amber-400">to cancel</span>
                            <button
                                onClick={cancelMove}
                                className="ml-1 rounded p-1 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40 transition-colors"
                                aria-label="Cancel move"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-14 w-full rounded-lg" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                            <Skeleton className="h-10 w-3/4 rounded-lg" />
                        </div>
                    ) : (
                        <div
                            className={`w-full ${
                                !open
                                    ? "max-w-[calc(100vw-48px)]"
                                    : "max-w-[calc(100vw-320px)]"
                            }`}
                        >
                            {Object.entries(groupedRows).length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
                                    <Search className="mb-3 h-10 w-10 text-muted-foreground/30" />
                                    <p className="text-sm font-medium text-muted-foreground">
                                        No orders found
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground/70">
                                        Try adjusting your search query.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {Object.entries(groupedRows).map(([orderId, orderRows]) => (
                                        <OrderAccordion
                                            key={orderId}
                                            orderId={orderId}
                                            orderRows={orderRows}
                                            isExpanded={expandedOrders.has(orderId)}
                                            onToggle={() => toggleOrderExpanded(orderId)}
                                            movedRow={movedRow}
                                            startMove={startMove}
                                            insertMovedRow={insertMovedRow}
                                            updateCell={updateCell}
                                            deleteRow={deleteRow}
                                            contextMenu={contextMenu}
                                            setContextMenu={setContextMenu}
                                            contextMenuRef={contextMenuRef}
                                            sortState={sortState}
                                            onSortColumn={handleSortColumn}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── OrderAccordion ────────────────────────────────────────────────────────────

function OrderAccordion({
    orderId,
    orderRows,
    isExpanded,
    onToggle,
    movedRow,
    startMove,
    insertMovedRow,
    updateCell,
    deleteRow,
    contextMenu,
    setContextMenu,
    contextMenuRef,
    sortState,
    onSortColumn,
}: {
    orderId: string;
    orderRows: OrderListRow[];
    isExpanded: boolean;
    onToggle: () => void;
    movedRow: OrderListRow | null;
    startMove: (row: OrderListRow) => void;
    insertMovedRow: (targetRowId: number, position: "above" | "below") => void;
    updateCell: (rowId: number, key: keyof OrderListRow, value: string) => void;
    deleteRow: (rowId: number) => void;
    contextMenu: ContextMenuState;
    setContextMenu: (s: ContextMenuState) => void;
    contextMenuRef: React.RefObject<HTMLDivElement | null>;
    sortState: SortState;
    onSortColumn: (key: SortKey) => void;
}) {
    const firstRow = orderRows[0];
    const count = orderRows.length;

    const sortedRows = useMemo(() => {
        if (!sortState) return orderRows;
        return [...orderRows].sort((a, b) => {
            let aVal: string | number | null = null;
            let bVal: string | number | null = null;

            switch (sortState.key) {
                case "order_title":
                    aVal = a.order_title; bVal = b.order_title; break;
                case "customer_name":
                    aVal = a.customer_name; bVal = b.customer_name; break;
                case "customer_location":
                    aVal = a.customer_location; bVal = b.customer_location; break;
                case "ownership_name":
                    aVal = a.ownership_name; bVal = b.ownership_name; break;
                case "machine_serial":
                    aVal = a.machine_serial; bVal = b.machine_serial; break;
                case "machine_model":
                    aVal = a.machine_model; bVal = b.machine_model; break;
                case "machine_power":
                    aVal = a.machine_power; bVal = b.machine_power; break;
                case "price":
                    aVal = Number(a.has_sale ? a.sale_data?.price : a.price) || 0;
                    bVal = Number(b.has_sale ? b.sale_data?.price : b.price) || 0;
                    break;
                case "row_date":
                    aVal = a.row_date ?? ""; bVal = b.row_date ?? ""; break;
            }

            const aStr = aVal == null ? "" : String(aVal).toLowerCase();
            const bStr = bVal == null ? "" : String(bVal).toLowerCase();
            const aNum = Number(aVal);
            const bNum = Number(bVal);
            const isNumeric = !isNaN(aNum) && !isNaN(bNum);

            const cmp = isNumeric ? aNum - bNum : aStr.localeCompare(bStr);
            return sortState.dir === "asc" ? cmp : -cmp;
        });
    }, [orderRows, sortState]);

    return (
        <div className="rounded-lg border border-border bg-card transition-shadow hover:shadow-sm">
            {/* Accordion header */}
            <button
                onClick={onToggle}
                className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
                aria-expanded={isExpanded}
            >
                <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition-transform ${
                        isExpanded ? "text-foreground" : "text-muted-foreground"
                    }`}
                >
                    <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                        }`}
                    />
                </div>

                <div className="flex flex-1 items-center gap-4 min-w-0">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                            {firstRow?.order_title || `Order #${orderId}`}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Order ID: {orderId}
                        </p>
                    </div>
                </div>

                <span className="shrink-0 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {count} {count === 1 ? "item" : "items"}
                </span>
            </button>

            {/* Accordion body */}
            {isExpanded && (
                <div className="border-t border-border">
                    <div className="overflow-x-auto">
                        <RenderTable
                            orderRows={sortedRows}
                            movedRow={movedRow}
                            startMove={startMove}
                            insertMovedRow={insertMovedRow}
                            updateCell={updateCell}
                            deleteRow={deleteRow}
                            contextMenu={contextMenu}
                            setContextMenu={setContextMenu}
                            contextMenuRef={contextMenuRef}
                            sortState={sortState}
                            onSortColumn={onSortColumn}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── RenderTable ───────────────────────────────────────────────────────────────

const RenderTable = ({
    orderRows,
    movedRow,
    startMove,
    insertMovedRow,
    updateCell,
    deleteRow,
    contextMenu,
    setContextMenu,
    contextMenuRef,
    sortState,
    onSortColumn,
}: {
    orderRows: OrderListRow[];
    movedRow: OrderListRow | null;
    startMove: (row: OrderListRow) => void;
    insertMovedRow: (targetRowId: number, position: "above" | "below") => void;
    updateCell: (rowId: number, key: keyof OrderListRow, value: string) => void;
    deleteRow: (rowId: number) => void;
    contextMenu: ContextMenuState;
    setContextMenu: (s: ContextMenuState) => void;
    contextMenuRef: React.RefObject<HTMLDivElement | null>;
    sortState: SortState;
    onSortColumn: (key: SortKey) => void;
}) => {
    const handleContextMenu = (e: React.MouseEvent, rowId: number) => {
        e.preventDefault();
        setContextMenu({ rowId, x: e.clientX, y: e.clientY });
    };

    return (
        <div className="relative">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b border-border bg-muted/20">
                        <th className="w-10 px-3 py-3" />

                        <SortableTh
                            label="Source"
                            sortKey={null}
                            sortState={sortState}
                            onSort={onSortColumn}
                            className="w-24"
                        />
                        <SortableTh
                            label="Order Title"
                            sortKey="order_title"
                            sortState={sortState}
                            onSort={onSortColumn}
                        />
                        <SortableTh
                            label="Customer"
                            sortKey="customer_name"
                            sortState={sortState}
                            onSort={onSortColumn}
                        />
                        <SortableTh
                            label="Location"
                            sortKey="customer_location"
                            sortState={sortState}
                            onSort={onSortColumn}
                        />
                        <SortableTh
                            label="Ownership"
                            sortKey="ownership_name"
                            sortState={sortState}
                            onSort={onSortColumn}
                        />
                        <SortableTh
                            label="Serial No"
                            sortKey="machine_serial"
                            sortState={sortState}
                            onSort={onSortColumn}
                        />
                        <SortableTh
                            label="Model"
                            sortKey="machine_model"
                            sortState={sortState}
                            onSort={onSortColumn}
                        />
                        <SortableTh
                            label="Power"
                            sortKey="machine_power"
                            sortState={sortState}
                            onSort={onSortColumn}
                        />
                        <SortableTh
                            label="Date"
                            sortKey="row_date"
                            sortState={sortState}
                            onSort={onSortColumn}
                            className="w-40"
                        />
                        <SortableTh
                            label="Price"
                            sortKey="price"
                            sortState={sortState}
                            onSort={onSortColumn}
                            className="w-28 text-right"
                        />
                    </tr>
                </thead>

                <tbody className="divide-y divide-border">
                    {orderRows.length > 0 ? (
                        orderRows.map((row) => {
                            const serialNo = row.has_sale
                                ? Array.isArray(row.sale_data?.order_no_arr)
                                    ? row.sale_data!.order_no_arr.length > 0
                                        ? row.sale_data!.order_no_arr.join(", ")
                                        : row.machine_serial
                                    : row.sale_data?.order_no_arr || row.machine_serial
                                : row.machine_serial;

                            const power = row.has_sale
                                ? row.sale_data?.power
                                : row.machine_power;

                            const finalPrice = row.has_sale
                                ? row.sale_data?.price
                                : row.price;

                            const isBeingMoved = movedRow?.id === row.id;
                            const isMenuOpen = contextMenu?.rowId === row.id;

                            return (
                                <tr
                                    key={row.id}
                                    onContextMenu={(e) => handleContextMenu(e, row.id)}
                                    data-moving={isBeingMoved || undefined}
                                    className={[
                                        "group transition-colors",
                                        isBeingMoved
                                            ? "bg-amber-50 ring-1 ring-inset ring-amber-300 dark:bg-amber-950/20 dark:ring-amber-700"
                                            : isMenuOpen
                                            ? "bg-muted/50"
                                            : "hover:bg-muted/20",
                                    ].join(" ")}
                                >
                                    {/* Move handle */}
                                    <td className="relative w-10 px-3 py-0 text-center align-middle">
                                        {isBeingMoved && (
                                            <span className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r bg-amber-400" />
                                        )}
                                        <div
                                            title="Right-click for options"
                                            className="flex h-full items-center justify-center"
                                        >
                                            <MoveVertical
                                                className={`h-3.5 w-3.5 cursor-context-menu transition-colors ${
                                                    isBeingMoved
                                                        ? "text-amber-500"
                                                        : "text-muted-foreground/40 group-hover:text-muted-foreground"
                                                }`}
                                            />
                                        </div>
                                    </td>

                                    {/* Source badge */}
                                    <Td>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                row.has_sale
                                                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800/50"
                                                    : "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:ring-orange-800/50"
                                            }`}
                                        >
                                            {row.has_sale ? "Sale" : "Manual"}
                                        </span>
                                    </Td>

                                    <EditableTd
                                        value={row.order_title}
                                        onChange={(v) => updateCell(row.id, "order_title", v)}
                                    />
                                    <EditableTd
                                        value={row.customer_name}
                                        onChange={(v) => updateCell(row.id, "customer_name", v)}
                                    />
                                    <EditableTd
                                        value={row.customer_location}
                                        onChange={(v) => updateCell(row.id, "customer_location", v)}
                                    />
                                    <EditableTd
                                        value={row.ownership_name}
                                        onChange={(v) => updateCell(row.id, "ownership_name", v)}
                                    />

                                    <Td className="font-mono text-xs text-muted-foreground">
                                        {serialNo || <span className="text-border">—</span>}
                                    </Td>

                                    <EditableTd
                                        value={row.machine_model}
                                        onChange={(v) => updateCell(row.id, "machine_model", v)}
                                    />

                                    <Td className="text-muted-foreground">
                                        {power || <span className="text-border">—</span>}
                                    </Td>

                                    {/* Editable Date */}
                                    <td className="p-0 align-middle">
                                        <input
                                            type="date"
                                            value={row.row_date ?? ""}
                                            onChange={(e) =>
                                                updateCell(row.id, "row_date", e.target.value)
                                            }
                                            className="h-full min-h-[44px] w-full min-w-[148px] bg-transparent px-4 py-2.5 text-xs text-foreground outline-none transition-colors focus:bg-primary/5 focus:ring-1 focus:ring-inset focus:ring-primary/30 dark:focus:bg-primary/10"
                                        />
                                    </td>

                                    <Td className="text-right font-semibold tabular-nums">
                                        {finalPrice
                                            ? formatCurrency(Number(finalPrice))
                                            : <span className="font-normal text-border">—</span>}
                                    </Td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td
                                colSpan={11}
                                className="py-12 text-center text-sm text-muted-foreground"
                            >
                                No items found in this order.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="fixed z-50 min-w-52 overflow-hidden rounded-lg border border-border bg-popover shadow-xl"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <div className="px-3 py-2 border-b border-border bg-muted/40">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Row Actions
                        </p>
                    </div>

                    <div className="p-1">
                        {/* Move */}
                        <button
                            onClick={() => {
                                const row = orderRows.find((r) => r.id === contextMenu.rowId);
                                if (row) startMove(row);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                            <MoveVertical className="h-4 w-4 text-muted-foreground" />
                            <span>Move Row</span>
                        </button>

                        {/* Insert above/below — only available when a move is in progress */}
                        <button
                            onClick={() => insertMovedRow(contextMenu.rowId, "above")}
                            disabled={!movedRow}
                            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                        >
                            <ArrowUp className="h-4 w-4 text-muted-foreground" />
                            <span>Insert Above</span>
                            {!movedRow && (
                                <span className="ml-auto text-xs text-muted-foreground/60">
                                    Select a row first
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => insertMovedRow(contextMenu.rowId, "below")}
                            disabled={!movedRow}
                            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                        >
                            <ArrowDown className="h-4 w-4 text-muted-foreground" />
                            <span>Insert Below</span>
                        </button>

                        <div className="my-1 h-px bg-border" />

                        {/* Delete */}
                        <button
                            onClick={() => {
                                deleteRow(contextMenu.rowId);
                                setContextMenu(null);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/8 transition-colors"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete Row</span>
                        </button>
                    </div>

                    <div className="border-t border-border px-3 py-2 bg-muted/20">
                        <p className="text-xs text-muted-foreground/70">
                            Press <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">Esc</kbd> to cancel move
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── SortableTh ───────────────────────────────────────────────────────────────

function SortableTh({
    label,
    sortKey,
    sortState,
    onSort,
    className = "",
}: {
    label: string;
    sortKey: SortKey | null;
    sortState: SortState;
    onSort: (key: SortKey) => void;
    className?: string;
}) {
    const isActive = sortKey !== null && sortState?.key === sortKey;
    const dir = isActive ? sortState!.dir : null;

    if (sortKey === null) {
        return (
            <th
                className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground ${className}`}
            >
                {label}
            </th>
        );
    }

    return (
        <th className={`whitespace-nowrap px-4 py-3 text-left ${className}`}>
            <button
                onClick={() => onSort(sortKey)}
                className={`inline-flex items-center gap-1.5 rounded text-xs font-semibold uppercase tracking-wide transition-colors hover:text-foreground ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                }`}
            >
                {label}
                {isActive ? (
                    dir === "asc" ? (
                        <ArrowUp className="h-3 w-3 text-primary" />
                    ) : (
                        <ArrowDown className="h-3 w-3 text-primary" />
                    )
                ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                )}
            </button>
        </th>
    );
}

// ─── Td ───────────────────────────────────────────────────────────────────────

function Td({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <td
            className={`whitespace-nowrap px-4 py-2.5 align-middle text-sm ${className}`}
        >
            {children}
        </td>
    );
}

// ─── EditableTd ───────────────────────────────────────────────────────────────

function EditableTd({
    value,
    onChange,
}: {
    value: string | number | null;
    onChange: (value: string) => void;
}) {
    return (
        <td className="p-0 align-middle">
            <input
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
                className="h-full min-h-[44px] w-full min-w-[140px] bg-transparent px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:bg-primary/5 focus:ring-1 focus:ring-inset focus:ring-primary/30 dark:focus:bg-primary/10"
                placeholder="—"
            />
        </td>
    );
}
