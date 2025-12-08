"use client";

import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable
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
import {
    useMemo,
    useState
} from "react";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import Spinner from "./ui/spinner";

const PageTable = ({
  children,
  columns,
  data,
  disableInput = false,
  onRowClick = ()=>{},
  loading = false,
}) => {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [search, setSearch] = useState("");
 
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

 
 
  const table = useReactTable({
    data : filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: customGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: search,
    },
    defaultColumn : {
      size : 200
    }
    // manualPagination: true,
    // manualFiltering: true
  });

  const isMobile = useIsMobile()

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

      <div className={`relative flex flex-1 flex-col ${isMobile && "min-h-[500px]"}`}>
        <div className="absolute bottom-0 left-0 right-0 top-0 flex overflow-scroll rounded-md border md:overflow-auto">
          <ScrollArea className="flex-1">
            <Table className="relative">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-background">
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
              <TableBody className="bg-white dark:bg-gray-900">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      onClick={(e) => onRowClick(row.original, e)}
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
                Showing {filteredData.length} entries
              </>
            ) : (
              "No entries found"
            )}
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
