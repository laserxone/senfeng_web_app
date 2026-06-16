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
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

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
import { memo, ReactNode, useMemo, useState } from "react";

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
  tableWidth = ""
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
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex w-full flex-wrap gap-4 items-center ">
        {!disableInput && (
          <Input
            value={search}
            placeholder={`Search...`}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            className="w-[60vw] max-w-sm"
          />
        )}
        {download && <Button onClick={handleDownload}>Download list</Button>}
        {children}
      </div>

      <div
        className={`relative flex flex-1 min-h-[calc(100dvh-280px)]`}
      >
        <div className="absolute bottom-0 left-0 right-0 top-0 flex rounded-md border md:overflow-auto custom-scrollbar overflow-auto">
          {/* <ScrollArea className="flex-1"> */}
          <Table className="relative">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="sticky top-0 z-20 bg-background"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      style={{ width: header.getSize() }}
                      key={header.id}
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
            <TableBody className="bg-white dark:bg-gray-900">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    onClick={(e) => onRowClick?.(row.original, e)}
                    className="even:bg-gray-100 dark:even:bg-gray-800 dark:text-white text-black cursor-pointer"
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell className="text-[13px] whitespace-normal break-words" key={cell.id}>
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
                    className="h-24 text-center"
                  >
                    {loading ? (
                      <div className="flex flex-1 justify-center">
                        <Spinner />
                      </div>
                    ) : (
                      "No results."
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

      <div className="flex flex-col items-center justify-end gap-2 space-x-2 py-2 sm:flex-row">
        <div className="flex w-full items-center justify-between">
          <div className="flex-1 text-sm text-muted-foreground">
            {filteredData.length > 0 ? (
              <>
                Showing {startIndex} to {endIndex} of {filteredData.length}{" "}
                entries
              </>
            ) : (
              "No entries found"
            )}
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
            <div className="flex items-center space-x-2">
              <p className="whitespace-nowrap text-sm font-medium">
                Rows per page
              </p>
              <Select
                value={`${paginationState.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
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
        <div className="flex w-full items-center justify-between gap-2 sm:justify-end">
          <div className="flex sm:w-[250px] items-center justify-center text-sm font-medium">
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
          <div className="flex items-center space-x-2">
            <Button
              aria-label="Go to first page"
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <DoubleArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label="Go to previous page"
              variant="outline"
              className="p-0 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label="Go to next page"
              variant="outline"
              className="p-0 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label="Go to last page"
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
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
