import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib"

export const runtime = "nodejs"
export const revalidate = 0

type ExportPdfRequest = {
  headers?: unknown[]
  rows?: unknown[][]
  fileName?: string
  format?: string
}

const pageSize: [number, number] = [841.89, 595.28]
const margin = 24
const fontSize = 7
const lineHeight = 9
const cellPadding = 6
const colors = {
  navy: rgb(0.035, 0.09, 0.18),
  blue: rgb(0.08, 0.36, 0.68),
  cyan: rgb(0.12, 0.72, 0.88),
  text: rgb(0.12, 0.16, 0.22),
  muted: rgb(0.45, 0.5, 0.58),
  line: rgb(0.86, 0.89, 0.93),
  zebra: rgb(0.965, 0.975, 0.988),
  white: rgb(1, 1, 1),
}

export async function POST(request: Request) {
  try {
    const passingBody = await request.json()
    const body = passingBody?.data as ExportPdfRequest

    if (!Array.isArray(body.headers) || body.headers.length === 0) {
      return Response.json(
        { message: "PDF headers are required" },
        { status: 400 }
      )
    }

    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return Response.json(
        { message: "No data available to export" },
        { status: 400 }
      )
    }

    const headers = body.headers.map(formatValue)
    const rows = body.rows.map((row) => row.map(formatValue))
    const pdf = await PDFDocument.create()
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold)
    const columnWidth = (pageSize[0] - margin * 2) / headers.length
    let page = pdf.addPage(pageSize)
    let y = 0
    let hasDataOnPage = false

    const drawReportHeading = () => {
      const title = getReportTitle(body.fileName)
      const reportDate = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Karachi",
      }).format(new Date())

      const bannerTop = pageSize[1] - margin
      const bannerHeight = 68

      page.drawRectangle({
        x: margin,
        y: bannerTop - bannerHeight,
        width: pageSize[0] - margin * 2,
        height: bannerHeight,
        color: colors.navy,
      })
      page.drawRectangle({
        x: margin,
        y: bannerTop - bannerHeight,
        width: 6,
        height: bannerHeight,
        color: colors.cyan,
      })
      page.drawText("SENFENG  /  BUSINESS REPORT", {
        x: margin + 22,
        y: bannerTop - 17,
        size: 6.5,
        font: boldFont,
        color: colors.cyan,
      })
      const titleMaxWidth = pageSize[0] - margin * 2 - 205
      let titleSize = 19
      while (
        titleSize > 11 &&
        boldFont.widthOfTextAtSize(title, titleSize) > titleMaxWidth
      ) {
        titleSize -= 0.5
      }
      page.drawText(title, {
        x: margin + 22,
        y: bannerTop - 45,
        size: titleSize,
        font: boldFont,
        color: colors.white,
      })
      page.drawText("REPORT DATE", {
        x: pageSize[0] - margin - 137,
        y: bannerTop - 22,
        size: 6.5,
        font: boldFont,
        color: colors.cyan,
      })
      page.drawText(reportDate, {
        x: pageSize[0] - margin - 137,
        y: bannerTop - 42,
        size: 10,
        font: boldFont,
        color: colors.white,
      })
      y = bannerTop - bannerHeight - 14
    }

    const getWrappedCells = (values: string[], rowFont: PDFFont) =>
      headers.map((_, index) =>
        wrapText(values[index] || "", columnWidth - cellPadding * 2, rowFont)
      )

    const drawWrappedRow = (
      wrappedCells: string[][],
      header = false,
      shaded = false
    ) => {
      const lines = Math.max(1, ...wrappedCells.map((cell) => cell.length))
      const height = Math.max(22, lines * lineHeight + cellPadding * 2)

      wrappedCells.forEach((cellLines, index) => {
        const x = margin + index * columnWidth

        page.drawRectangle({
          x,
          y: y - height,
          width: columnWidth,
          height,
          borderWidth: header ? 0 : 0.35,
          borderColor: colors.line,
          color: header ? colors.blue : shaded ? colors.zebra : colors.white,
        })

        cellLines.forEach((text, lineIndex) => {
          page.drawText(text, {
            x: x + cellPadding,
            y: y - cellPadding - fontSize - lineIndex * lineHeight,
            size: fontSize,
            font: header ? boldFont : font,
            color: header ? colors.white : colors.text,
          })
        })
      })
      y -= height

      return height
    }

    const wrappedHeaders = getWrappedCells(headers, boldFont)

    const startPage = () => {
      drawReportHeading()
      drawWrappedRow(wrappedHeaders, true)
      hasDataOnPage = false
    }

    startPage()

    rows.forEach((row, rowIndex) => {
      const wrappedCells = getWrappedCells(row, font)
      const requiredHeight = Math.max(
        22,
        Math.max(...wrappedCells.map((cell) => cell.length)) * lineHeight +
          cellPadding * 2
      )

      if (y - requiredHeight < margin && hasDataOnPage) {
        page = pdf.addPage(pageSize)
        startPage()
      }

      // A very large cell can be taller than a whole page. Render it in
      // continued row sections so none of its text is lost.
      let lineOffset = 0
      const totalLines = Math.max(...wrappedCells.map((cell) => cell.length))
      while (lineOffset < totalLines) {
        const linesThatFit = Math.max(
          1,
          Math.floor((y - margin - cellPadding * 2) / lineHeight)
        )
        const sectionLines = Math.min(linesThatFit, totalLines - lineOffset)
        const section = wrappedCells.map((cell) =>
          cell.slice(lineOffset, lineOffset + sectionLines)
        )

        drawWrappedRow(section, false, rowIndex % 2 === 1)
        hasDataOnPage = true
        lineOffset += sectionLines

        if (lineOffset < totalLines) {
          page = pdf.addPage(pageSize)
          startPage()
        }
      }
    })

    const pages = pdf.getPages()
    pages.forEach((reportPage, index) => {
      reportPage.drawLine({
        start: { x: margin, y: 17 },
        end: { x: pageSize[0] - margin, y: 17 },
        thickness: 0.5,
        color: colors.line,
      })
      reportPage.drawText("SENFENG  •  CONFIDENTIAL BUSINESS REPORT", {
        x: margin,
        y: 7,
        size: 5.5,
        font: boldFont,
        color: colors.muted,
      })

      const pageLabel = `PAGE ${index + 1} OF ${pages.length}`
      reportPage.drawText(pageLabel, {
        x: pageSize[0] - margin - boldFont.widthOfTextAtSize(pageLabel, 5.5),
        y: 7,
        size: 5.5,
        font: boldFont,
        color: colors.muted,
      })
    })

    const bytes = await pdf.save()
    const pdfBuffer = Buffer.from(bytes)
    const fileName = cleanFileName(body.fileName)

    if (body.format === "base64") {
      return Response.json({
        fileName,
        mimeType: "application/pdf",
        base64: pdfBuffer.toString("base64"),
      })
    }

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("PDF generation failed:", error)

    return Response.json(
      { message: "Failed to generate PDF file" },
      { status: 500 }
    )
  }
}

function formatValue(value: unknown) {
  if (value == null) return ""
  if (typeof value === "object") return safeText(JSON.stringify(value))
  return safeText(String(value))
}

function safeText(value: string) {
  return value.replace(/[^\x20-\x7E\n]/g, "?")
}

function wrapText(value: string, width: number, font: PDFFont) {
  const lines: string[] = []

  for (const paragraph of value.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    let line = ""

    for (const word of words) {
      const parts = splitLongWord(word, width, font)
      for (const part of parts) {
        const candidate = line ? `${line} ${part}` : part
        if (font.widthOfTextAtSize(candidate, fontSize) <= width) {
          line = candidate
        } else {
          if (line) lines.push(line)
          line = part
        }
      }
    }

    lines.push(line)
  }

  return lines.length ? lines : [""]
}

function splitLongWord(word: string, width: number, font: PDFFont) {
  const parts: string[] = []
  let part = ""

  for (const character of word) {
    if (part && font.widthOfTextAtSize(part + character, fontSize) > width) {
      parts.push(part)
      part = character
    } else {
      part += character
    }
  }

  if (part) parts.push(part)
  return parts.length ? parts : [""]
}

function getReportTitle(fileName?: string) {
  const title = (fileName || "Table Export")
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  return title || "Table Export"
}

function cleanFileName(fileName?: string) {
  const cleaned = (fileName || "Table-export.pdf")
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, " ")
    .trim()

  return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned}.pdf`
}
