import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import {
  PDFDocument,
  PDFName,
  PDFString,
  StandardFonts,
  rgb,
  type PDFImage,
  type PDFFont,
} from "pdf-lib";

export const runtime = "nodejs";
export const revalidate = 0;

type ExportPdfRequest = {
  headers?: unknown[];
  rows?: unknown[][];
  fileName?: string;
  format?: string;
  total?: {
    columnName?: string;
    value?: number;
    displayValue?: string;
  };
};

type PdfImageCell = {
  type: "image";
  url?: string;
  data?: string;
  alt?: string;
};

type PdfCell = string | PdfImageCell;

const pageSize: [number, number] = [841.89, 595.28];
const margin = 24;
const fontSize = 7;
const lineHeight = 9;
const cellPadding = 6;
let chineseFontBytes: Uint8Array | null = null;
const colors = {
  navy: rgb(0.035, 0.09, 0.18),
  blue: rgb(0.08, 0.36, 0.68),
  cyan: rgb(0.12, 0.72, 0.88),
  text: rgb(0.12, 0.16, 0.22),
  muted: rgb(0.45, 0.5, 0.58),
  line: rgb(0.86, 0.89, 0.93),
  zebra: rgb(0.965, 0.975, 0.988),
  white: rgb(1, 1, 1),
};

export async function POST(request: Request) {
  try {
    const passingBody = await request.json();
    const body = passingBody?.data as ExportPdfRequest;

    if (!Array.isArray(body.headers) || body.headers.length === 0) {
      return Response.json(
        { message: "PDF headers are required" },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return Response.json(
        { message: "No data available to export" },
        { status: 400 },
      );
    }

    const headers = body.headers.map(formatValue);
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
    let chineseFont: PDFFont | null = null;
    const imageCache = new Map<string, PDFImage | null>();

    const resolveCell = async (value: unknown): Promise<PdfCell> => {
      if (!isImageCell(value)) return formatValue(value);

      const url = value.url || "";
      const data = value.data || "";
      const alt = value.alt || "No image found";
      if (!url && !data) return { type: "image", alt };

      const imageSource = data || url;
      if (!imageCache.has(imageSource)) {
        try {
          const image = data
            ? await embedDataUriImage(pdf, data)
            : await fetchAndEmbedImage(pdf, url);
          imageCache.set(imageSource, image);
        } catch {
          imageCache.set(imageSource, null);
        }
      }

      return { type: "image", url, data, alt };
    };

    const rows = await Promise.all(
      body.rows.map((row) => Promise.all(row.map(resolveCell))),
    );

    const needsChineseFont = [...headers, ...rows.flat()].some(
      (value) => !isImageCell(value) && containsChinese(value),
    );
    if (needsChineseFont) {
      chineseFontBytes ??= await readFile(
        path.join(process.cwd(), "public", "fonts", "NotoSansSC-Regular.ttf"),
      );
      chineseFont = await pdf.embedFont(chineseFontBytes, { subset: false });
    }
    const columnWidth = (pageSize[0] - margin * 2) / headers.length;
    let page = pdf.addPage(pageSize);
    let y = 0;
    let hasDataOnPage = false;

    const drawReportHeading = () => {
      const title = getReportTitle(body.fileName);
      const reportDate = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Karachi",
      }).format(new Date());

      const bannerTop = pageSize[1] - margin;
      const bannerHeight = 68;

      page.drawRectangle({
        x: margin,
        y: bannerTop - bannerHeight,
        width: pageSize[0] - margin * 2,
        height: bannerHeight,
        color: colors.navy,
      });
      page.drawRectangle({
        x: margin,
        y: bannerTop - bannerHeight,
        width: 6,
        height: bannerHeight,
        color: colors.cyan,
      });
      page.drawText("SENFENG  /  BUSINESS REPORT", {
        x: margin + 22,
        y: bannerTop - 17,
        size: 6.5,
        font: boldFont,
        color: colors.cyan,
      });
      const titleMaxWidth = pageSize[0] - margin * 2 - 205;
      let titleSize = 19;
      while (
        titleSize > 11 &&
        boldFont.widthOfTextAtSize(title, titleSize) > titleMaxWidth
      ) {
        titleSize -= 0.5;
      }
      page.drawText(title, {
        x: margin + 22,
        y: bannerTop - 45,
        size: titleSize,
        font: boldFont,
        color: colors.white,
      });
      page.drawText("REPORT DATE", {
        x: pageSize[0] - margin - 137,
        y: bannerTop - 22,
        size: 6.5,
        font: boldFont,
        color: colors.cyan,
      });
      page.drawText(reportDate, {
        x: pageSize[0] - margin - 137,
        y: bannerTop - 42,
        size: 10,
        font: boldFont,
        color: colors.white,
      });
      y = bannerTop - bannerHeight - 14;

      if (body.total?.columnName && Number.isFinite(body.total.value)) {
        const totalText = `TOTAL: ${body.total.displayValue ?? body.total.value}`;
        page.drawText(safeText(totalText), {
          x: margin,
          y,
          size: 8,
          font: boldFont,
          color: colors.text,
        });
        y -= 16;
      }
    };

    const getCellFont = (value: PdfCell | undefined, header = false) => {
      if (chineseFont && !isImageCell(value) && containsChinese(value || "")) {
        return chineseFont;
      }

      return header ? boldFont : font;
    };

    const drawMixedText = (
      text: string,
      x: number,
      y: number,
      header = false,
    ) => {
      const defaultFont = header ? boldFont : font;

      if (!chineseFont || !containsChinese(text)) {
        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font: defaultFont,
          color: header ? colors.white : colors.text,
        });
        return;
      }

      let cursor = x;
      for (const run of splitTextIntoFontRuns(text)) {
        const runFont = run.chinese ? chineseFont : defaultFont;
        page.drawText(run.text, {
          x: cursor,
          y,
          size: fontSize,
          font: runFont,
          color: header ? colors.white : colors.text,
        });
        cursor += runFont.widthOfTextAtSize(run.text, fontSize);
      }
    };

    const getWrappedCells = (values: PdfCell[], header = false) =>
      headers.map((_, index) =>
        wrapText(
          isImageCell(values[index])
            ? values[index].url
              ? "Open image"
              : values[index].alt || "No image found"
            : values[index] || "",
          columnWidth - cellPadding * 2,
          getCellFont(values[index], header),
        ),
      );

    const drawWrappedRow = (
      wrappedCells: string[][],
      header = false,
      shaded = false,
      row?: PdfCell[],
    ) => {
      const lines = Math.max(1, ...wrappedCells.map((cell) => cell.length));
      const includesImage = !header && row?.some(isImageCell);
      const height = includesImage
        ? Math.max(82, lines * lineHeight + cellPadding * 2)
        : Math.max(22, lines * lineHeight + cellPadding * 2);

      wrappedCells.forEach((cellLines, index) => {
        const x = margin + index * columnWidth;

        page.drawRectangle({
          x,
          y: y - height,
          width: columnWidth,
          height,
          borderWidth: header ? 0 : 0.35,
          borderColor: colors.line,
          color: header ? colors.blue : shaded ? colors.zebra : colors.white,
        });

        const imageCell = row?.[index];
        if (!header && isImageCell(imageCell)) {
          const framePadding = 4;
          const maxWidth = columnWidth - cellPadding * 2;
          const maxHeight = height - cellPadding * 2;
          const frameWidth = Math.min(82, maxWidth);
          const frameHeight = Math.min(64, maxHeight);
          const frameX = x + (columnWidth - frameWidth) / 2;
          const frameY = y - height + (height - frameHeight) / 2;
          const imageSource = imageCell.data || imageCell.url || "";
          const image = imageCache.get(imageSource);

          page.drawRectangle({
            x: frameX,
            y: frameY,
            width: frameWidth,
            height: frameHeight,
            borderWidth: 0.45,
            borderColor: colors.line,
            color: colors.zebra,
          });

          if (image) {
            const { width, height: imageHeight } = image.scaleToFit(
              Math.max(1, frameWidth - framePadding * 2),
              Math.max(1, frameHeight - framePadding * 2),
            );
            const imageX = frameX + (frameWidth - width) / 2;
            const imageY = frameY + (frameHeight - imageHeight) / 2;
            page.drawImage(image, {
              x: imageX,
              y: imageY,
              width,
              height: imageHeight,
            });
            addLinkAnnotation(
              page,
              imageX,
              imageY,
              width,
              imageHeight,
              imageCell.url!,
            );
          } else {
            page.drawText("No image found", {
              x:
                frameX +
                Math.max(
                  3,
                  (frameWidth - font.widthOfTextAtSize("No image found", 6)) /
                    2,
                ),
              y: frameY + frameHeight / 2 - 2,
              size: 6,
              font: boldFont,
              color: colors.muted,
            });
          }
          return;
        }

        cellLines.forEach((text, lineIndex) => {
          drawMixedText(
            text,
            x + cellPadding,
            y - cellPadding - fontSize - lineIndex * lineHeight,
            header,
          );
        });
      });
      y -= height;

      return height;
    };

    const wrappedHeaders = getWrappedCells(headers, true);

    const startPage = () => {
      drawReportHeading();
      drawWrappedRow(wrappedHeaders, true, false, headers);
      hasDataOnPage = false;
    };

    startPage();

    for (const [rowIndex, row] of rows.entries()) {
      const wrappedCells = getWrappedCells(row);
      const requiredHeight = Math.max(
        row.some(isImageCell) ? 82 : 22,
        Math.max(...wrappedCells.map((cell) => cell.length)) * lineHeight +
          cellPadding * 2,
      );

      if (y - requiredHeight < margin && hasDataOnPage) {
        page = pdf.addPage(pageSize);
        startPage();
      }

      // A very large cell can be taller than a whole page. Render it in
      // continued row sections so none of its text is lost.
      let lineOffset = 0;
      const totalLines = Math.max(...wrappedCells.map((cell) => cell.length));
      while (lineOffset < totalLines) {
        const linesThatFit = Math.max(
          1,
          Math.floor((y - margin - cellPadding * 2) / lineHeight),
        );
        const sectionLines = Math.min(linesThatFit, totalLines - lineOffset);
        const section = wrappedCells.map((cell) =>
          cell.slice(lineOffset, lineOffset + sectionLines),
        );

        drawWrappedRow(section, false, rowIndex % 2 === 1, row);
        hasDataOnPage = true;
        lineOffset += sectionLines;

        if (lineOffset < totalLines) {
          page = pdf.addPage(pageSize);
          startPage();
        }
      }
    }

    const pages = pdf.getPages();
    pages.forEach((reportPage, index) => {
      reportPage.drawLine({
        start: { x: margin, y: 17 },
        end: { x: pageSize[0] - margin, y: 17 },
        thickness: 0.5,
        color: colors.line,
      });
      reportPage.drawText("SENFENG  •  CONFIDENTIAL BUSINESS REPORT", {
        x: margin,
        y: 7,
        size: 5.5,
        font: boldFont,
        color: colors.muted,
      });

      const pageLabel = `PAGE ${index + 1} OF ${pages.length}`;
      reportPage.drawText(pageLabel, {
        x: pageSize[0] - margin - boldFont.widthOfTextAtSize(pageLabel, 5.5),
        y: 7,
        size: 5.5,
        font: boldFont,
        color: colors.muted,
      });
    });

    const bytes = await pdf.save();
    const pdfBuffer = Buffer.from(bytes);
    const fileName = cleanFileName(body.fileName);

    if (body.format === "base64") {
      return Response.json({
        fileName,
        mimeType: "application/pdf",
        base64: pdfBuffer.toString("base64"),
      });
    }

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);

    return Response.json(
      { message: "Failed to generate PDF file" },
      { status: 500 },
    );
  }
}

function formatValue(value: unknown) {
  if (value == null) return "";
  if (typeof value === "object") return safeText(JSON.stringify(value));
  return safeText(String(value));
}

function isImageCell(value: unknown): value is PdfImageCell {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "image"
  );
}

async function fetchAndEmbedImage(pdf: PDFDocument, url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Image request failed");

  const bytes = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("png")
    ? pdf.embedPng(bytes)
    : pdf.embedJpg(bytes);
}

async function embedDataUriImage(pdf: PDFDocument, dataUri: string) {
  const match = /^data:image\/(png|jpe?g);base64,(.+)$/i.exec(dataUri);
  if (!match) throw new Error("Invalid image data");

  const bytes = Uint8Array.from(Buffer.from(match[2], "base64"));
  return match[1].toLowerCase() === "png"
    ? pdf.embedPng(bytes)
    : pdf.embedJpg(bytes);
}

function addLinkAnnotation(
  page: ReturnType<PDFDocument["addPage"]>,
  x: number,
  y: number,
  width: number,
  height: number,
  url: string,
) {
  const annotation = page.doc.context.register(
    page.doc.context.obj({
      Type: PDFName.of("Annot"),
      Subtype: PDFName.of("Link"),
      Rect: [x, y, x + width, y + height],
      Border: [0, 0, 0],
      A: {
        Type: PDFName.of("Action"),
        S: PDFName.of("URI"),
        URI: PDFString.of(url),
      },
    }),
  );

  page.node.addAnnot(annotation);
}

function safeText(value: string) {
  return value;
}

function containsChinese(value: string) {
  return /[\u3000-\u303F\u3400-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/.test(value);
}

function splitTextIntoFontRuns(value: string) {
  const runs: { text: string; chinese: boolean }[] = [];

  for (const character of value) {
    const chinese = containsChinese(character);
    const previousRun = runs.at(-1);

    if (previousRun && previousRun.chinese === chinese) {
      previousRun.text += character;
    } else {
      runs.push({ text: character, chinese });
    }
  }

  return runs;
}

function wrapText(value: string, width: number, font: PDFFont) {
  const lines: string[] = [];

  for (const paragraph of value.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";

    for (const word of words) {
      const parts = splitLongWord(word, width, font);
      for (const part of parts) {
        const candidate = line ? `${line} ${part}` : part;
        if (font.widthOfTextAtSize(candidate, fontSize) <= width) {
          line = candidate;
        } else {
          if (line) lines.push(line);
          line = part;
        }
      }
    }

    lines.push(line);
  }

  return lines.length ? lines : [""];
}

function splitLongWord(word: string, width: number, font: PDFFont) {
  const parts: string[] = [];
  let part = "";

  for (const character of word) {
    if (part && font.widthOfTextAtSize(part + character, fontSize) > width) {
      parts.push(part);
      part = character;
    } else {
      part += character;
    }
  }

  if (part) parts.push(part);
  return parts.length ? parts : [""];
}

function getReportTitle(fileName?: string) {
  const title = (fileName || "Table Export")
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return title || "Table Export";
}

function cleanFileName(fileName?: string) {
  const cleaned = (fileName || "Table-export.pdf")
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned}.pdf`;
}
