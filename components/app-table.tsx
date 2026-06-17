"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  OnChangeFn,
  PaginationState,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronLeftIcon, ChevronRightIcon, Download, Search } from "lucide-react";

import {
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { memo, useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { useIsMobile } from "@/hooks/use-mobile";
import exportToExcel from "@/lib/exportToExcel";
import Spinner from "./ui/spinner";
import moment from "moment";


type ExtendedColumnDef<T> = ColumnDef<T> & {
  accessorKey?: keyof T;
};

type PageTableProps<T extends Record<string, any>> = {
  children?: React.ReactNode;
  columns: ColumnDef<T>[];
  data: T[];
  pageSizeOptions ?: number[]
  totalCustomerText ?:string
  disableInput?: boolean;
  onRowClick?: (row: T, event: React.MouseEvent<HTMLTableRowElement>) => void;
  loading?: boolean;
  defaultPageSize ?: number
  download?: boolean;
  tableWidth ?: string
  height ?: string
};

const PageTable = <T extends Record<string, any>>({
  children,
  columns,
  data,
  pageSizeOptions = [10, 20, 30, 40, 50],
  disableInput = false,
  totalCustomerText,
  onRowClick,
  loading = false,
  defaultPageSize = 20,
  download = false,
  tableWidth = "",
  height = "min-h-[calc(100dvh-280px)]"

}: PageTableProps<T>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
   const isMobile = useIsMobile();

  const paginationState = {
    pageIndex: currentPage - 1,
    pageSize: pageSize,
  };

   const filteredData = useMemo(() => {
    let filtered = data;
    columnFilters.forEach((filter) => {
      filtered = filtered.filter((row) => {
        const key = filter.id as keyof T;
        const cellValue = row[key];
        return String(cellValue ?? "")
          .toLowerCase()
          .includes(String(filter.value).toLowerCase());
      });
    });

    if (debouncedSearch) {
      filtered = filtered.filter((row) => {
        return Object.values(row).some((value) =>
          String(value).toLowerCase().includes(debouncedSearch.toLowerCase()),
        );
      });
    }

    return filtered;
  }, [data, columnFilters, debouncedSearch]);
  const pageCount = Math.ceil(filteredData.length / pageSize);

  const handlePaginationChange: OnChangeFn<PaginationState> = (updaterOrValue) => {
    const pagination =
      typeof updaterOrValue === "function"
        ? updaterOrValue(paginationState)
        : updaterOrValue;

    setCurrentPage(pagination.pageIndex + 1);
    setPageSize(pagination.pageSize);
  };

  const table = useReactTable<T>({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    pageCount: pageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: paginationState,
    
    },
    onPaginationChange: handlePaginationChange,
    defaultColumn: {
      size: 200,
    },
   
  });

  const startIndex = paginationState.pageIndex * paginationState.pageSize + 1;
  const endIndex = Math.min(
    (paginationState.pageIndex + 1) * paginationState.pageSize,
    filteredData.length,
  );

  function handleDownload() {
      try {
        if (!filteredData || !filteredData.length) return;
  
  
  
        const exportableColumns = columns.filter(
          (col  : ExtendedColumnDef<T>): col is ExtendedColumnDef<T> & { accessorKey: keyof T } =>
            typeof col.accessorKey === "string"
        );
  
        const headers = exportableColumns.map((col) =>
          String(col.accessorKey)
        );
  
        const formattedData = filteredData.map((row) =>
          exportableColumns.map((col) => {
            const key = col.accessorKey as keyof T;
            const value = row[key];
            if (isValidDateString(value) && value) {
              return moment(value as any).format("YYYY-MM-DD");
            }
            return value != null ? String(value) : "";
          })
        );
  
        exportToExcel(
          headers,
          formattedData,
          "Table-Export.xlsx",
          false,
          "",
          false
        );
      } catch (error) {
        console.error("Error exporting Excel:", error);
      }
    }

     function isValidDateString(value: string): boolean {
        console.log(value, moment(value, moment.ISO_8601, true).isValid())
        return moment(value, moment.ISO_8601, true).isValid();
      }

 

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex w-full flex-wrap items-center gap-2 rounded-lg border bg-background/95 p-2 shadow-sm">
        {!disableInput && (
          <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              placeholder={`Search...`}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              className="h-8 rounded-md bg-muted/20 pl-9 text-xs"
            />
          </div>
        )}
        {download && (
          <Button variant="outline" className="h-9 gap-2" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download
          </Button>
        )}
        {children}
      </div>

      <div
        className={`relative flex flex-1 ${height} ${isMobile && tableWidth ? tableWidth : ""}`}
      >
        <div className="absolute bottom-0 left-0 right-0 top-0 flex overflow-auto rounded-md border bg-background shadow-sm custom-scrollbar md:overflow-auto">
          {/* <ScrollArea className="flex-1"> */}
          <Table className="relative text-xs">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="sticky top-0 z-30 border-b border-border bg-slate-100 shadow-sm hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-900"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      style={{ width: header.getSize() }}
                      key={header.id}
                      className="h-8 whitespace-nowrap px-3 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-zinc-200"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    onClick={(e) => onRowClick?.(row.original, e)}
                    className="cursor-pointer border-b transition-colors odd:bg-white even:bg-slate-50/80 hover:bg-blue-50/70 data-[state=selected]:bg-blue-50 dark:odd:bg-zinc-950 dark:even:bg-zinc-900/70 dark:hover:bg-zinc-800/80 dark:data-[state=selected]:bg-zinc-800"
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell className="whitespace-normal break-words px-3 py-1.5 text-[12px] leading-snug text-slate-800 dark:text-zinc-100" key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, {
                          ...cell.getContext(),
                          stopRowClick: (e: React.MouseEvent<HTMLTableRowElement>) => e.stopPropagation(),
                        })}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center"
                  >
                    {loading ? (
                      <div className="flex flex-1 justify-center">
                        <Spinner />
                      </div>
                    ) : (
                      <div className="text-xs font-medium text-muted-foreground">
                        No results.
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {/* <ScrollBar orientation="horizontal" />
          </ScrollArea> */}
        </div>
      </div>

      <div className="flex flex-col items-center justify-end gap-2 rounded-lg border bg-background/95 p-2 shadow-sm sm:flex-row">
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 text-xs font-medium text-muted-foreground">
            {filteredData.length > 0 ? (
              <>
                Showing {startIndex} to {endIndex} of {filteredData.length}{" "}
                entries
              </>
            ) : (
              "No entries found"
            )}
          </div>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <p className="whitespace-nowrap text-xs font-semibold text-muted-foreground">
                Rows per page
              </p>
              <Select
                value={`${paginationState.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[72px] rounded-md text-xs">
                  <SelectValue placeholder={paginationState.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center text-xs font-semibold text-muted-foreground sm:w-[220px] sm:justify-center">
            {filteredData.length > 0 ? (
              <>
                {totalCustomerText &&
                  `${totalCustomerText} ${filteredData.length}`}{" "}
                Page {paginationState.pageIndex + 1} of {pageCount}
              </>
            ) : (
              "No pages"
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              aria-label="Go to first page"
              variant="outline"
              className="hidden h-8 w-8 rounded-md p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <DoubleArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label="Go to previous page"
              variant="outline"
              className="h-8 w-8 rounded-md p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label="Go to next page"
              variant="outline"
              className="h-8 w-8 rounded-md p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label="Go to last page"
              variant="outline"
              className="hidden h-8 w-8 rounded-md p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <DoubleArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(PageTable) as typeof PageTable;
