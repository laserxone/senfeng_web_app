import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Download } from "lucide-react"

type Props = {
  handlePdfDownload: () => Promise<void>
  handleExcelDownload: () => Promise<void>
  disabled: boolean
}

export default function ExportButton({
  handlePdfDownload,
  handleExcelDownload,
  disabled,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={disabled}>
          <Download className="h-4 w-4" />
          Export
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="text-xs" align="end">
        <DropdownMenuItem className="text-xs" onSelect={handlePdfDownload}>
          PDF
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs" onSelect={handleExcelDownload}>
          EXCEL
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
