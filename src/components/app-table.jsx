"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

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
import {
  useMemo,
  useRef,
  useState,
} from "react";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Spinner from "./ui/spinner";

const PageTable = ({
  children,
  columns,
  data,
  totalItems,
  pageSizeOptions = [10, 20, 30, 40, 50],
  disableInput = false,
  totalCustomerText,
  totalCustomer,
  onRowClick,
  loading = false,
}) => {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const inputRef = useRef();
  const [search, setSearch] = useState("");
  const paginationState = {
    pageIndex: currentPage - 1,
    pageSize: pageSize,
  };

  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply column filters
    columnFilters.forEach((filter) => {
      filtered = filtered.filter(row => {
        const cellValue = row[filter.id];
        return cellValue.toString().toLowerCase().includes(filter.value.toLowerCase());
      });
    });

    // Apply global search filter
    if (search) {
      filtered = filtered.filter(row => {
        return Object.values(row).some(value =>
          String(value).toLowerCase().includes(search.toLowerCase())
        );
      });
    }

    return filtered;
  }, [data, columnFilters, search]);

  const pageCount = Math.ceil(filteredData.length / pageSize);

  const handlePaginationChange = (updaterOrValue) => {
    const pagination =
      typeof updaterOrValue === "function"
        ? updaterOrValue(paginationState)
        : updaterOrValue;

    setCurrentPage(pagination.pageIndex + 1);
    setPageSize(pagination.pageSize);
  };

  const table = useReactTable({
    data : filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: customGlobalFilter,
    pageCount: pageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: paginationState,
      globalFilter: search,
    },
    onPaginationChange: handlePaginationChange,
    defaultColumn : {
      size : 200
    }
    // manualPagination: true,
    // manualFiltering: true
  });

  const startIndex = paginationState.pageIndex * paginationState.pageSize + 1;
  const endIndex = Math.min(
    (paginationState.pageIndex + 1) * paginationState.pageSize,
    filteredData.length
  );


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
        {children}
      </div>

      <div className="relative flex flex-1 flex-col">
        <div className="absolute bottom-0 left-0 right-0 top-0 flex overflow-scroll rounded-md border md:overflow-auto">
          <ScrollArea className="flex-1">
            <Table className="relative">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead style={{ width: header.getSize() }} key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      onClick={() => onRowClick(row.original)}
                      className="even:bg-gray-100 dark:even:bg-gray-800 dark:text-white text-black cursor-pointer"
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell className="text-[13px]" key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, {
                            ...cell.getContext(),
                            stopRowClick: (e) => e.stopPropagation(),
                          })}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
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
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      <div className="flex flex-col items-center justify-end gap-2 space-x-2 py-2 sm:flex-row">
        <div className="flex w-full items-center justify-between">
          <div className="flex-1 text-sm text-muted-foreground">
            {filteredData.length > 0 ? (
              <>
                Showing {startIndex} to {endIndex} of {filteredData.length} entries
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
          <div className="flex w-[250px] items-center justify-center text-sm font-medium">
            {filteredData.length > 0 ? (
              <>
                {totalCustomerText && `${totalCustomerText} ${filteredData.length}`} Page{" "}
                {paginationState.pageIndex + 1} of {pageCount}
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

function customGlobalFilter(row, columnId, filterValue) {
  const search = filterValue.toLowerCase();
 return row
    .getAllCells()
    .some((cell) => String(cell.getValue()).toLowerCase().includes(search));
}

export default PageTable;
