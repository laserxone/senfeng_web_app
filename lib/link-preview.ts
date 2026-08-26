import { isIP } from "node:net";
import { resolve4, resolve6 } from "node:dns/promises";

export type LinkPreview = {
  url: string;
  title: string;
  description: string;
  image?: string;
  siteName?: string;
};

// Product pages commonly include structured product data and can exceed 512 KB.
// Keep a firm cap while allowing normal Shopify-style product pages to preview.
const MAX_HTML_BYTES = 1024 * 1024;
const REQUEST_TIMEOUT_MS = 3_000;

function firstUrl(text: string) {
  return text.match(/https?:\/\/[^\s<>{}"']+/i)?.[0]?.replace(/[),.!?]+$/, "");
}

function isPrivateIp(address: string) {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      a >= 224 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  const normalized = address.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

async function isSafeExternalUrl(value: URL) {
  if (value.protocol !== "http:" && value.protocol !== "https:") return false;
  const hostname = value.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return false;
  }
  if (isIP(hostname)) return !isPrivateIp(hostname);

  try {
    const resolutions = await Promise.allSettled([
      resolve4(hostname),
      resolve6(hostname),
    ]);
    const addresses = resolutions.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    );
    return (
      addresses.length > 0 &&
      addresses.every((address) => !isPrivateIp(address))
    );
  } catch {
    return false;
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function metaValue(html: string, property: string) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
      "i",
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }
  return "";
}

function resolvePreviewUrl(value: string, base: URL) {
  try {
    return new URL(value, base).toString();
  } catch {
    return undefined;
  }
}

async function fetchHtml(initialUrl: URL) {
  let url = initialUrl;
  for (let redirectCount = 0; redirectCount <= 2; redirectCount += 1) {
    if (!(await isSafeExternalUrl(url))) return null;
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LaserxoneLinkPreview/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return null;
      url = new URL(location, url);
      continue;
    }
    if (
      !response.ok ||
      !response.headers.get("content-type")?.includes("text/html")
    ) {
      return null;
    }
    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_HTML_BYTES)
      return null;
    const reader = response.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (received <= MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      chunks.push(value);
    }
    if (received > MAX_HTML_BYTES) return null;
    const html = new TextDecoder().decode(
      chunks.reduce((all, chunk) => {
        const next = new Uint8Array(all.length + chunk.length);
        next.set(all);
        next.set(chunk, all.length);
        return next;
      }, new Uint8Array()),
    );
    return { html, url };
  }
  return null;
}

export async function createLinkPreview(
  message: string,
): Promise<LinkPreview | null> {
  try {
    const rawUrl = firstUrl(message);
    if (!rawUrl) return null;
    const initialUrl = new URL(rawUrl);
    const result = await fetchHtml(initialUrl);
    if (!result) return null;

    const title =
      metaValue(result.html, "og:title") ||
      metaValue(result.html, "twitter:title") ||
      decodeHtml(
        result.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "",
      );
    if (!title) return null;
    const imageCandidate = resolvePreviewUrl(
      metaValue(result.html, "og:image") ||
        metaValue(result.html, "twitter:image"),
      result.url,
    );
    const image =
      imageCandidate && (await isSafeExternalUrl(new URL(imageCandidate)))
        ? imageCandidate
        : undefined;
    return {
      url: result.url.toString(),
      title: title.slice(0, 200),
      description: (
        metaValue(result.html, "og:description") ||
        metaValue(result.html, "description")
      ).slice(0, 400),
      ...(image ? { image } : {}),
      ...(metaValue(result.html, "og:site_name")
        ? { siteName: metaValue(result.html, "og:site_name").slice(0, 100) }
        : {}),
    };
  } catch {
    return null;
  }
}
