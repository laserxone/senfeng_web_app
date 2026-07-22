"use client"

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
} from "@tanstack/react-table"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Filter,
  RotateCcw,
  Search
} from "lucide-react"

import {
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { memo, useMemo, useState } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Spinner from "@/components/ui/spinner"
import { useDebounce } from "@/hooks/use-debounce"
import { useIsMobile } from "@/hooks/use-mobile"
import useUserDetail from "@/hooks/use-user-detail"
import exportToExcel from "@/lib/exportToExcel"
import exportToPdf from "@/lib/exportToPdf"
import moment from "moment"
import ExportButton from "../exports/export-button"

type PageTableProps<T extends object> = {
  children?: React.ReactNode
  columns: ColumnDef<T>[]
  data: T[]
  pageSizeOptions?: number[]
  totalCustomerText?: string
  disableInput?: boolean
  onRowClick?: (row: T, event: React.MouseEvent<HTMLTableRowElement>) => void
  loading?: boolean
  defaultPageSize?: number
  download?: boolean
  tableWidth?: string
  height?: string
  hideFooter?: boolean
  filter?: boolean
  reset?: boolean
  onFilterPress?: () => void
  onResetPress?: () => Promise<void>
  resetLoading?: boolean
}

const PageTable = <T extends object>({
  children,
  columns,
  data,
  pageSizeOptions = [100, 200, 300, 400, 500],
  disableInput = false,
  totalCustomerText,
  onRowClick,
  loading = false,
  defaultPageSize = 100,
  download = true,
  filter = false,
  reset = false,
  onFilterPress,
  onResetPress,
  tableWidth = "",
  height = "min-h-[calc(100dvh-280px)]",
  hideFooter = false,
  resetLoading = false
}: PageTableProps<T>) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 500)
  const { userID } = useUserDetail()
  const isMobile = useIsMobile()

  const paginationState = {
    pageIndex: currentPage - 1,
    pageSize: pageSize,
  }

  const filteredData = useMemo(() => {
    let filtered = data
    columnFilters.forEach((filter) => {
      filtered = filtered.filter((row) => {
        const key = filter.id as keyof T
        const cellValue = row[key]
        return String(cellValue ?? "")
          .toLowerCase()
          .includes(String(filter.value).toLowerCase())
      })
    })

    if (debouncedSearch) {
      filtered = filtered.filter((row) => {
        return Object.values(row).some((value) =>
          String(value).toLowerCase().includes(debouncedSearch.toLowerCase())
        )
      })
    }

    return filtered
  }, [data, columnFilters, debouncedSearch])
  const pageCount = Math.ceil(filteredData.length / pageSize)

  const handlePaginationChange: OnChangeFn<PaginationState> = (
    updaterOrValue
  ) => {
    const pagination =
      typeof updaterOrValue === "function"
        ? updaterOrValue(paginationState)
        : updaterOrValue

    setCurrentPage(pagination.pageIndex + 1)
    setPageSize(pagination.pageSize)
  }

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
  })

  const startIndex = paginationState.pageIndex * paginationState.pageSize + 1
  const endIndex = Math.min(
    (paginationState.pageIndex + 1) * paginationState.pageSize,
    filteredData.length
  )

  function getVisibleExportData() {
    const exportableColumns = table
      .getVisibleLeafColumns()
      .filter((column) => Boolean(column.accessorFn))

    const headers = exportableColumns.map((column) => {
      const header = column.columnDef.header
      return typeof header === "string"
        ? header
        : column.id
          .replace(/_/g, " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase())
    })

    const rows = table
      .getRowModel()
      .rows.map((row) =>
        exportableColumns.map((column) =>
          formatExportValue(row.getValue(column.id))
        )
      )

    return { headers, rows }
  }

  function formatExportValue(value: unknown): string {
    if (value == null) return ""
    if (
      typeof value === "string" &&
      moment(value, moment.ISO_8601, true).isValid()
    ) {
      return moment(value).format("YYYY-MM-DD")
    }
    if (Array.isArray(value)) return value.map(formatExportValue).join(", ")
    if (typeof value === "object") return JSON.stringify(value)
    return String(value)
  }

  async function handleExcelDownload() {
    try {
      const { headers, rows } = getVisibleExportData()
      if (!rows.length || !headers.length) return
      await exportToExcel(headers, rows, "Table-Export.xlsx", false, "", false, userID)
    } catch (error) {
      console.error("Error exporting Excel:", error)
    }
  }

  async function handlePdfDownload() {
    try {
      const { headers, rows } = getVisibleExportData()
      if (!rows.length || !headers.length) return
      await exportToPdf(headers, rows, "Table-Export.pdf", userID)
    }
    catch (error) {
      console.error("Error exporting PDF:", error)
    }

  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      {(children || !disableInput || download) && (
        <div className="flex w-full flex-wrap items-center gap-2 rounded-lg border bg-background/95 p-2 shadow-sm">
          {!disableInput && (
            <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                placeholder={`Search...`}
                onChange={(event) => {
                  setSearch(event.target.value)
                }}
                className="h-8 rounded-md bg-muted/20 pl-9 text-xs"
              />
            </div>
          )}
          {download && (
            <ExportButton
              handleExcelDownload={handleExcelDownload}
              handlePdfDownload={handlePdfDownload}
              disabled={!table.getRowModel().rows.length} />
          )}
          {filter &&
            <Button
              onClick={onFilterPress}
              variant="outline"
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>

          }
          {reset &&
            <Button
              variant="outline"
              className="gap-2"
              onClick={onResetPress}
            >
              {resetLoading ? <Spinner /> : <RotateCcw className="h-4 w-4" />}
              Reset
            </Button>}
          {children}
        </div>
      )}

      <div
        className={`relative flex flex-1 ${height} ${isMobile && tableWidth ? tableWidth : ""}`}
      >
        <div className="custom-scrollbar absolute top-0 right-0 bottom-0 left-0 flex overflow-auto rounded-md border bg-background shadow-sm md:overflow-auto">
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
                      className="h-8 px-3 text-[11px] font-bold tracking-wide whitespace-nowrap text-slate-700 uppercase dark:text-zinc-200"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
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
                      <TableCell
                        className="max-w-[200px] px-3 py-1.5 text-[12px] leading-snug break-words whitespace-normal text-slate-800 dark:text-zinc-100"
                        key={cell.id}
                      >
                        {flexRender(cell.column.columnDef.cell, {
                          ...cell.getContext(),
                          stopRowClick: (
                            e: React.MouseEvent<HTMLTableRowElement>
                          ) => e.stopPropagation(),
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

      {!hideFooter && (
        <div className="grid w-full grid-cols-1 items-center gap-3 rounded-lg border bg-background/95 p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="flex min-w-0 flex-col gap-3 sm:contents">
            <div className="min-w-0 text-xs font-medium text-muted-foreground">
              {filteredData.length > 0 ? (
                <>
                  Showing {startIndex} to {endIndex} of {filteredData.length}{" "}
                  entries
                </>
              ) : (
                "No entries found"
              )}
            </div>
            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <p className="whitespace-nowrap text-xs font-semibold text-muted-foreground">
                Rows per page
              </p>
              <Select
                value={`${paginationState.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="h-8 w-[72px] shrink-0 rounded-md text-xs">
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
          <div className="flex min-w-0 flex-col gap-3 sm:col-span-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between lg:col-span-1 lg:flex-nowrap lg:justify-end">
            <div className="flex min-w-0 flex-wrap items-center gap-x-1 text-xs font-semibold text-muted-foreground lg:justify-end">
              {filteredData.length > 0 ? (
                <>
                  {totalCustomerText && (
                    <span>{`${totalCustomerText} ${filteredData.length}`}</span>
                  )}
                  <span className="whitespace-nowrap">
                    Page {paginationState.pageIndex + 1} of {pageCount}
                  </span>
                </>
              ) : (
                "No pages"
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                aria-label="Go to first page"
                variant="outline"
                className="hidden h-8 w-8 rounded-md p-0 sm:inline-flex"
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
                className="hidden h-8 w-8 rounded-md p-0 sm:inline-flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <DoubleArrowRightIcon className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(PageTable) as typeof PageTable
