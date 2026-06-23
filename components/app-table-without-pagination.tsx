"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

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

import { useDebounce } from "@/hooks/use-debounce";
import { useIsMobile } from "@/hooks/use-mobile";
import exportToExcel from "@/lib/exportToExcel";
import { Button } from "./ui/button";
import Spinner from "./ui/spinner";
import moment from "moment";

type ExtendedColumnDef<T> = ColumnDef<T> & {
  accessorKey?: keyof T;
};

type PageTableProps<T extends Record<string, any>> = {
  children?: React.ReactNode;
  columns: ColumnDef<T>[];
  data: T[];
  disableInput?: boolean;
  loading?: boolean;
  download?: boolean;
  onRowClick?: (row: T, event: React.MouseEvent<HTMLTableRowElement>) => void;
  height?: string
  tableWidth ?:string
};
const PageTable = <T extends Record<string, any>>({
  children,
  columns,
  data,
  disableInput = false,
  onRowClick = () => { },
  loading = false,
  download = false,
  height = "min-h-[calc(100dvh-280px)]",
  tableWidth
}: PageTableProps<T>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

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

  const table = useReactTable<T>({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    defaultColumn: {
      size: 200,
    },
  });

  const isMobile = useIsMobile();

  function handleDownload() {
    try {
      if (!filteredData || !filteredData.length) return;



      const exportableColumns = columns.filter(
        (col : ExtendedColumnDef<T>): col is ExtendedColumnDef<T> & { accessorKey: keyof T } =>
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
    <div className="flex flex-1 flex-col space-y-2">
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
        className={`relative flex flex-1 ${height}`}
      >
        <div className="absolute bottom-0 left-0 right-0 top-0 flex rounded-md border custom-scrollbar">
          <Table className="relative">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="sticky top-0 z-1 bg-background"
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
            <TableBody className="bg-white dark:bg-gray-900">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    onClick={(e) => onRowClick(row.original, e)}
                    className="cursor-pointer border-b transition-colors odd:bg-white even:bg-slate-50/80 hover:bg-blue-50/70 data-[state=selected]:bg-blue-50 dark:odd:bg-zinc-950 dark:even:bg-zinc-900/70 dark:hover:bg-zinc-800/80 dark:data-[state=selected]:bg-zinc-800"
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell className="whitespace-normal break-words px-3 py-1.5 text-[12px] leading-snug text-slate-800 dark:text-zinc-100 max-w-[200px]" key={cell.id}>
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
        </div>
      </div>

      <div className="flex flex-col items-center justify-end gap-2 space-x-2  sm:flex-row">
        <div className="flex w-full items-center justify-between">
          <div className="flex-1 text-sm text-muted-foreground pl-2">
            {filteredData.length > 0 ? (
              <>Showing {filteredData.length} entries</>
            ) : (
              "No entries found"
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default memo(PageTable) as typeof PageTable;