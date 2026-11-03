"use client";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const PAGE_TOP_MARGIN_PX = 56;
const PAGE_BOTTOM_MARGIN_PX = 56;
const RASTER_SCALE = 2;

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BorderSide {
  width: number;
  color: string;
  style: string;
}

interface BoxDrawItem {
  rect: Rect;
  backgroundColor: string | null;
  radii: [number, number, number, number];
  borders: {
    top: BorderSide;
    right: BorderSide;
    bottom: BorderSide;
    left: BorderSide;
  };
}

interface TextDrawItem {
  text: string;
  rect: Rect;
  font: string;
  fontSizePx: number;
  color: string;
  lineThrough: boolean;
  underline: boolean;
  decorationColor: string;
  hasLeadingSpace?: boolean;
  hasTrailingSpace?: boolean;
}

interface SvgDrawItem {
  rect: Rect;
  image: HTMLImageElement;
}

export interface PdfPageTextItem {
  text: string;
  xPt: number;
  yPt: number;
  fontSizePt: number;
}

export interface RenderedPageData {
  jpegBytes: Uint8Array;
  widthPx: number;
  heightPx: number;
  textItems: PdfPageTextItem[];
}

function isTransparentColor(color: string | null | undefined): boolean {
  if (!color) return true;
  const trimmed = color.trim().toLowerCase();
  if (
    trimmed === "transparent" ||
    trimmed === "rgba(0, 0, 0, 0)" ||
    trimmed === "rgb(0 0 0 / 0)" ||
    trimmed === "oklch(0 0 0 / 0)"
  ) {
    return true;
  }
  const slashZeroMatch = /\/\s*0(?:\.0+)?%?\s*\)$/.test(trimmed);
  return slashZeroMatch;
}

function parsePx(val: string | null | undefined): number {
  if (!val) return 0;
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : 0;
}

function applyTextTransform(text: string, transform: string): string {
  switch (transform) {
    case "uppercase":
      return text.toUpperCase();
    case "lowercase":
      return text.toLowerCase();
    case "capitalize":
      return text.replace(/\b\w/g, (char) => char.toUpperCase());
    default:
      return text;
  }
}

function buildCanvasFont(style: CSSStyleDeclaration): {
  font: string;
  fontSizePx: number;
} {
  const fontStyle = style.fontStyle || "normal";
  const fontWeight = style.fontWeight || "400";
  const fontSizePx = parsePx(style.fontSize) || 14;
  const fontFamily = style.fontFamily || "Inter, sans-serif";
  return {
    font: `${fontStyle} ${fontWeight} ${fontSizePx}px ${fontFamily}`,
    fontSizePx,
  };
}

async function rasterizeSvgElement(
  svgEl: SVGSVGElement,
  rootRect: DOMRect
): Promise<SvgDrawItem | null> {
  const rect = svgEl.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  const computed = window.getComputedStyle(svgEl);
  if (
    computed.display === "none" ||
    computed.visibility === "hidden" ||
    parseFloat(computed.opacity || "1") === 0
  ) {
    return null;
  }

  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  const color = computed.color || "#18181b";
  const targetW = Math.max(1, Math.round(rect.width * RASTER_SCALE));
  const targetH = Math.max(1, Math.round(rect.height * RASTER_SCALE));

  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(targetW));
  clone.setAttribute("height", String(targetH));
  if (!clone.getAttribute("viewBox")) {
    clone.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
  }
  clone.style.color = color;

  const replaceCurrentColor = (el: Element) => {
    const stroke = el.getAttribute("stroke");
    if (stroke === "currentColor") el.setAttribute("stroke", color);
    const fill = el.getAttribute("fill");
    if (fill === "currentColor") el.setAttribute("fill", color);
    Array.from(el.children).forEach(replaceCurrentColor);
  };
  replaceCurrentColor(clone);

  const serialized = new XMLSerializer().serializeToString(clone);
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        rect: {
          x: rect.left - rootRect.left,
          y: rect.top - rootRect.top,
          width: rect.width,
          height: rect.height,
        },
        image: img,
      });
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

function collectTextDrawItems(
  rootEl: HTMLElement,
  rootRect: DOMRect
): TextDrawItem[] {
  const items: TextDrawItem[] = [];
  const range = document.createRange();

  // First collect list item markers (• for disc/circle/square, 1. for decimal)
  const listItems = rootEl.querySelectorAll("li");
  listItems.forEach((li) => {
    const style = window.getComputedStyle(li);
    if (style.display === "none" || style.visibility === "hidden") return;
    const listStyleType = style.listStyleType;
    if (!listStyleType || listStyleType === "none") return;

    const liRect = li.getBoundingClientRect();
    if (liRect.width <= 0 || liRect.height <= 0) return;

    let markerText = "";
    if (
      listStyleType === "disc" ||
      listStyleType === "circle" ||
      listStyleType === "square"
    ) {
      markerText = "•";
    } else if (listStyleType === "decimal") {
      const parent = li.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          (child) => child.tagName === "LI"
        );
        const index = siblings.indexOf(li) + 1;
        markerText = `${index}.`;
      }
    }

    if (!markerText) return;

    // Align marker vertically with the first text node inside the <li> if present
    let markerTop = liRect.top - rootRect.top + parsePx(style.paddingTop);
    let markerHeight = parsePx(style.lineHeight) || parsePx(style.fontSize) * 1.35;

    const walker = document.createTreeWalker(li, NodeFilter.SHOW_TEXT);
    const firstText = walker.nextNode() as Text | null;
    if (firstText && firstText.data.trim()) {
      range.selectNodeContents(firstText);
      const firstRect = range.getClientRects()[0];
      if (firstRect && firstRect.height > 0) {
        markerTop = firstRect.top - rootRect.top;
        markerHeight = firstRect.height;
      }
    }

    const { font, fontSizePx } = buildCanvasFont(style);
    const offsetLeft = listStyleType === "decimal" ? 18 : 13;

    items.push({
      text: markerText,
      rect: {
        x: liRect.left - rootRect.left - offsetLeft,
        y: markerTop,
        width: 12,
        height: markerHeight,
      },
      font,
      fontSizePx,
      color: style.color || "#18181b",
      lineThrough: false,
      underline: false,
      decorationColor: style.color || "#18181b",
    });
  });

  // Walk all text nodes
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode() as Text | null;

  while (currentNode) {
    const textNode = currentNode;
    currentNode = walker.nextNode() as Text | null;

    const raw = textNode.data;
    if (!raw || !raw.trim()) continue;

    const parentEl = textNode.parentElement;
    if (!parentEl || parentEl.closest("svg")) continue;

    const style = window.getComputedStyle(parentEl);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      parseFloat(style.opacity || "1") === 0
    ) {
      continue;
    }

    const firstNonSpace = raw.search(/\S/);
    if (firstNonSpace === -1) continue;
    const trailingWsMatch = raw.match(/\s+$/);
    const lastNonSpaceEnd = trailingWsMatch
      ? raw.length - trailingWsMatch[0].length
      : raw.length;
    const hasLeadingSpace = firstNonSpace > 0;
    const hasTrailingSpace = lastNonSpaceEnd < raw.length;

    range.setStart(textNode, firstNonSpace);
    range.setEnd(textNode, lastNonSpaceEnd);
    const fullRects = range.getClientRects();
    if (fullRects.length === 0) continue;

    const { font, fontSizePx } = buildCanvasFont(style);
    const color = style.color || "#18181b";
    const textTransform = style.textTransform || "none";
    const decorationLine =
      style.textDecorationLine || style.textDecoration || "";
    const lineThrough = decorationLine.includes("line-through");
    const underline = decorationLine.includes("underline");
    const decorationColor = style.textDecorationColor || color;

    if (fullRects.length === 1) {
      const r = fullRects[0];
      if (r.width > 0 && r.height > 0) {
        const normalized = applyTextTransform(
          raw.slice(firstNonSpace, lastNonSpaceEnd).replace(/\s+/g, " "),
          textTransform
        );
        if (normalized) {
          items.push({
            text: normalized,
            rect: {
              x: r.left - rootRect.left,
              y: r.top - rootRect.top,
              width: r.width,
              height: r.height,
            },
            font,
            fontSizePx,
            color,
            lineThrough,
            underline,
            decorationColor,
            hasLeadingSpace,
            hasTrailingSpace,
          });
        }
      }
      continue;
    }

    // Multi-line text node: group word tokens by line top
    const wordMatches = Array.from(raw.matchAll(/\S+/g));
    if (wordMatches.length === 0) continue;

    let lineStartIdx = wordMatches[0].index ?? 0;
    let lineEndIdx = lineStartIdx + wordMatches[0][0].length;
    range.setStart(textNode, lineStartIdx);
    range.setEnd(textNode, lineEndIdx);
    let currentLineRect = range.getBoundingClientRect();

    const flushLine = (startIdx: number, endIdx: number) => {
      range.setStart(textNode, startIdx);
      range.setEnd(textNode, endIdx);
      const r = range.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      const lineStr = applyTextTransform(
        raw.slice(startIdx, endIdx).replace(/\s+/g, " ").trim(),
        textTransform
      );
      if (!lineStr) return;
      items.push({
        text: lineStr,
        rect: {
          x: r.left - rootRect.left,
          y: r.top - rootRect.top,
          width: r.width,
          height: r.height,
        },
        font,
        fontSizePx,
        color,
        lineThrough,
        underline,
        decorationColor,
      });
    };

    for (let i = 1; i < wordMatches.length; i += 1) {
      const match = wordMatches[i];
      const wStart = match.index ?? 0;
      const wEnd = wStart + match[0].length;
      range.setStart(textNode, wStart);
      range.setEnd(textNode, wEnd);
      const wRect = range.getBoundingClientRect();

      if (Math.abs(wRect.top - currentLineRect.top) > 4) {
        flushLine(lineStartIdx, lineEndIdx);
        lineStartIdx = wStart;
        lineEndIdx = wEnd;
        currentLineRect = wRect;
      } else {
        lineEndIdx = wEnd;
      }
    }
    flushLine(lineStartIdx, lineEndIdx);
  }

  return items;
}

function collectBoxDrawItems(
  rootEl: HTMLElement,
  rootRect: DOMRect
): BoxDrawItem[] {
  const boxes: BoxDrawItem[] = [];
  const elements = rootEl.querySelectorAll("*");

  elements.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.closest("svg")) return;

    const style = window.getComputedStyle(node);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      parseFloat(style.opacity || "1") === 0
    ) {
      return;
    }

    const r = node.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;

    const bg = isTransparentColor(style.backgroundColor)
      ? null
      : style.backgroundColor;

    const bt = parsePx(style.borderTopWidth);
    const br = parsePx(style.borderRightWidth);
    const bb = parsePx(style.borderBottomWidth);
    const bl = parsePx(style.borderLeftWidth);

    const hasBorder =
      (bt > 0 && style.borderTopStyle !== "none" && !isTransparentColor(style.borderTopColor)) ||
      (br > 0 && style.borderRightStyle !== "none" && !isTransparentColor(style.borderRightColor)) ||
      (bb > 0 && style.borderBottomStyle !== "none" && !isTransparentColor(style.borderBottomColor)) ||
      (bl > 0 && style.borderLeftStyle !== "none" && !isTransparentColor(style.borderLeftColor));

    if (!bg && !hasBorder) return;

    const maxR = Math.min(r.width, r.height) / 2;
    const radii: [number, number, number, number] = [
      Math.min(maxR, parsePx(style.borderTopLeftRadius)),
      Math.min(maxR, parsePx(style.borderTopRightRadius)),
      Math.min(maxR, parsePx(style.borderBottomRightRadius)),
      Math.min(maxR, parsePx(style.borderBottomLeftRadius)),
    ];

    boxes.push({
      rect: {
        x: r.left - rootRect.left,
        y: r.top - rootRect.top,
        width: r.width,
        height: r.height,
      },
      backgroundColor: bg,
      radii,
      borders: {
        top: {
          width: bt,
          color: style.borderTopColor,
          style: style.borderTopStyle,
        },
        right: {
          width: br,
          color: style.borderRightColor,
          style: style.borderRightStyle,
        },
        bottom: {
          width: bb,
          color: style.borderBottomColor,
          style: style.borderBottomStyle,
        },
        left: {
          width: bl,
          color: style.borderLeftColor,
          style: style.borderLeftStyle,
        },
      },
    });
  });

  return boxes;
}

function computePageSlices(
  rootEl: HTMLElement,
  rootRect: DOMRect,
  boxes: BoxDrawItem[],
  texts: TextDrawItem[],
  svgs: SvgDrawItem[]
): Array<{ startY: number; endY: number; topOffsetPx: number }> {
  let maxContentBottom = 0;
  for (const t of texts) {
    maxContentBottom = Math.max(maxContentBottom, t.rect.y + t.rect.height);
  }
  for (const s of svgs) {
    maxContentBottom = Math.max(maxContentBottom, s.rect.y + s.rect.height);
  }
  for (const b of boxes) {
    if (b.rect.height < A4_HEIGHT_PX - 10) {
      maxContentBottom = Math.max(maxContentBottom, b.rect.y + b.rect.height);
    }
  }

  if (maxContentBottom <= A4_HEIGHT_PX - 16) {
    return [{ startY: 0, endY: A4_HEIGHT_PX, topOffsetPx: 0 }];
  }

  // Collect atomic vertical intervals that should not be split across pages
  const atomicIntervals: Array<{ top: number; bottom: number; priority: number }> = [];

  // Priority 1 (strictest): Individual text lines and SVG icons
  for (const t of texts) {
    atomicIntervals.push({
      top: t.rect.y - 2,
      bottom: t.rect.y + t.rect.height + 2,
      priority: 1,
    });
  }
  for (const s of svgs) {
    atomicIntervals.push({
      top: s.rect.y - 2,
      bottom: s.rect.y + s.rect.height + 2,
      priority: 1,
    });
  }

  // Priority 2: Headings kept with the first 44px of following content so headings aren't orphaned
  const headings = rootEl.querySelectorAll("h1, h2, h3, h4");
  headings.forEach((h) => {
    const r = h.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    const top = r.top - rootRect.top;
    const bottom = r.bottom - rootRect.top;
    atomicIntervals.push({
      top: top - 4,
      bottom: bottom + 48,
      priority: 2,
    });
  });

  // Priority 2: Compact cards, list items, and explicit break-inside-avoid blocks
  const atomicSelectors =
    ".print\\:break-inside-avoid, li, tr, [class*='rounded']";
  rootEl.querySelectorAll(atomicSelectors).forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0 || r.height > 260) return;
    const top = r.top - rootRect.top;
    const bottom = r.bottom - rootRect.top;
    atomicIntervals.push({
      top: top - 2,
      bottom: bottom + 2,
      priority: 2,
    });
  });

  const slices: Array<{ startY: number; endY: number; topOffsetPx: number }> = [];
  let currentStartY = 0;
  let pageIndex = 0;

  while (currentStartY < maxContentBottom - 4) {
    const topOffsetPx = pageIndex === 0 ? 0 : PAGE_TOP_MARGIN_PX;
    const usableHeight =
      A4_HEIGHT_PX - topOffsetPx - PAGE_BOTTOM_MARGIN_PX;
    const targetEndY = currentStartY + usableHeight;

    if (targetEndY >= maxContentBottom) {
      slices.push({
        startY: currentStartY,
        endY: Math.max(maxContentBottom + 16, currentStartY + 100),
        topOffsetPx,
      });
      break;
    }

    // Try finding a clean break point respecting both priority 1 and priority 2 intervals
    let breakY = targetEndY;
    for (let pass = 0; pass < 12; pass += 1) {
      const straddling = atomicIntervals.filter(
        (interval) =>
          interval.top > currentStartY + 80 &&
          interval.top < breakY &&
          interval.bottom > breakY
      );
      if (straddling.length === 0) break;
      const minTop = Math.min(...straddling.map((i) => i.top));
      breakY = minTop - 2;
    }

    // Fallback to priority 1 only (lines/SVGs) if priority 2 pulled breakY too high
    if (breakY <= currentStartY + usableHeight * 0.45) {
      breakY = targetEndY;
      for (let pass = 0; pass < 8; pass += 1) {
        const straddlingLines = atomicIntervals.filter(
          (interval) =>
            interval.priority === 1 &&
            interval.top > currentStartY + 24 &&
            interval.top < breakY &&
            interval.bottom > breakY
        );
        if (straddlingLines.length === 0) break;
        breakY = Math.min(...straddlingLines.map((i) => i.top)) - 2;
      }
    }

    slices.push({
      startY: currentStartY,
      endY: breakY,
      topOffsetPx,
    });
    currentStartY = breakY;
    pageIndex += 1;
  }

  return slices;
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: [number, number, number, number]
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, radii);
  } else {
    const r = radii[0] || 0;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

function renderPageCanvas(
  slice: { startY: number; endY: number; topOffsetPx: number },
  boxes: BoxDrawItem[],
  texts: TextDrawItem[],
  svgs: SvgDrawItem[]
): RenderedPageData {
  const canvasW = A4_WIDTH_PX * RASTER_SCALE;
  const canvasH = A4_HEIGHT_PX * RASTER_SCALE;
  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not initialize 2D canvas context for PDF export.");
  }

  ctx.save();
  ctx.scale(RASTER_SCALE, RASTER_SCALE);

  // Fill A4 page background white
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, A4_WIDTH_PX, A4_HEIGHT_PX);

  const sliceHeight = Math.min(
    slice.endY - slice.startY,
    A4_HEIGHT_PX - slice.topOffsetPx - (slice.topOffsetPx > 0 ? PAGE_BOTTOM_MARGIN_PX : 0)
  );

  // Clip to active page content slice band
  ctx.beginPath();
  ctx.rect(0, slice.topOffsetPx, A4_WIDTH_PX, sliceHeight);
  ctx.clip();

  const translateY = slice.topOffsetPx - slice.startY;
  ctx.translate(0, translateY);

  // 1. Draw boxes (backgrounds & borders)
  for (const box of boxes) {
    const { x, y, width, height } = box.rect;
    if (y + height < slice.startY || y > slice.endY) continue;

    if (box.backgroundColor) {
      drawRoundedRectPath(ctx, x, y, width, height, box.radii);
      ctx.fillStyle = box.backgroundColor;
      ctx.fill();
    }

    const { top, right, bottom, left } = box.borders;
    const allEqual =
      top.width > 0 &&
      top.width === right.width &&
      top.width === bottom.width &&
      top.width === left.width &&
      top.color === right.color &&
      top.color === bottom.color &&
      top.color === left.color;

    if (allEqual) {
      drawRoundedRectPath(ctx, x, y, width, height, box.radii);
      ctx.strokeStyle = top.color;
      ctx.lineWidth = top.width;
      if (top.style === "dashed") ctx.setLineDash([4, 3]);
      else ctx.setLineDash([]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      if (top.width > 0 && top.style !== "none" && !isTransparentColor(top.color)) {
        ctx.beginPath();
        ctx.moveTo(x, y + top.width / 2);
        ctx.lineTo(x + width, y + top.width / 2);
        ctx.strokeStyle = top.color;
        ctx.lineWidth = top.width;
        ctx.stroke();
      }
      if (bottom.width > 0 && bottom.style !== "none" && !isTransparentColor(bottom.color)) {
        ctx.beginPath();
        ctx.moveTo(x, y + height - bottom.width / 2);
        ctx.lineTo(x + width, y + height - bottom.width / 2);
        ctx.strokeStyle = bottom.color;
        ctx.lineWidth = bottom.width;
        ctx.stroke();
      }
      if (left.width > 0 && left.style !== "none" && !isTransparentColor(left.color)) {
        ctx.beginPath();
        ctx.moveTo(x + left.width / 2, y);
        ctx.lineTo(x + left.width / 2, y + height);
        ctx.strokeStyle = left.color;
        ctx.lineWidth = left.width;
        ctx.stroke();
      }
      if (right.width > 0 && right.style !== "none" && !isTransparentColor(right.color)) {
        ctx.beginPath();
        ctx.moveTo(x + width - right.width / 2, y);
        ctx.lineTo(x + width - right.width / 2, y + height);
        ctx.strokeStyle = right.color;
        ctx.lineWidth = right.width;
        ctx.stroke();
      }
    }
  }

  // 2. Draw SVG icons
  for (const svgItem of svgs) {
    const { x, y, width, height } = svgItem.rect;
    if (y + height < slice.startY || y > slice.endY) continue;
    ctx.drawImage(svgItem.image, x, y, width, height);
  }

  // 3. Draw text lines and collect PDF text layer items
  const pageTextItems: PdfPageTextItem[] = [];
  ctx.textBaseline = "alphabetic";

  let prevLineY = -9999;
  let prevDomRight = -9999;
  let prevCanvasRight = -9999;
  let prevHadTrailingSpace = false;

  for (const t of texts) {
    const { x, y, width, height } = t.rect;
    if (y + height < slice.startY || y > slice.endY) continue;

    ctx.font = t.font;
    ctx.fillStyle = t.color;

    let drawX = x;
    const sameLine = Math.abs(y - prevLineY) < 4;
    const domGap = x - prevDomRight;
    if (sameLine && domGap >= -4 && domGap < 28) {
      const needsSpace = Boolean(prevHadTrailingSpace || t.hasLeadingSpace);
      const minGap = needsSpace
        ? Math.max(domGap, t.fontSizePx * 0.26)
        : Math.max(0, domGap);
      drawX = Math.max(x, prevCanvasRight + minGap);
    }

    const baselineY = y + height * 0.78;
    ctx.fillText(t.text, drawX, baselineY);
    const measuredWidth = ctx.measureText(t.text).width;

    prevLineY = y;
    prevDomRight = x + width;
    prevCanvasRight = drawX + measuredWidth;
    prevHadTrailingSpace = Boolean(t.hasTrailingSpace);

    if (t.lineThrough) {
      const strikeY = y + height * 0.52;
      ctx.beginPath();
      ctx.moveTo(drawX, strikeY);
      ctx.lineTo(drawX + Math.max(width, measuredWidth), strikeY);
      ctx.strokeStyle = t.decorationColor;
      ctx.lineWidth = Math.max(1, t.fontSizePx * 0.07);
      ctx.stroke();
    }

    if (t.underline) {
      const underY = baselineY + 2;
      ctx.beginPath();
      ctx.moveTo(drawX, underY);
      ctx.lineTo(drawX + Math.max(width, measuredWidth), underY);
      ctx.strokeStyle = t.decorationColor;
      ctx.lineWidth = Math.max(1, t.fontSizePx * 0.07);
      ctx.stroke();
    }

    const pageY = baselineY + translateY;
    const xPt = +(drawX * (A4_WIDTH_PT / A4_WIDTH_PX)).toFixed(2);
    const yPt = +(A4_HEIGHT_PT - pageY * (A4_HEIGHT_PT / A4_HEIGHT_PX)).toFixed(2);
    const fontSizePt = Math.max(
      6,
      +(t.fontSizePx * (A4_WIDTH_PT / A4_WIDTH_PX)).toFixed(2)
    );

    pageTextItems.push({
      text: t.text,
      xPt,
      yPt,
      fontSizePt,
    });
  }

  ctx.restore();

  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const binaryStr = atob(dataUrl.split(",")[1] ?? "");
  const jpegBytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i += 1) {
    jpegBytes[i] = binaryStr.charCodeAt(i);
  }

  return {
    jpegBytes,
    widthPx: canvasW,
    heightPx: canvasH,
    textItems: pageTextItems,
  };
}

export function escapePdfLiteralString(input: string): string {
  return input
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2022/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

export function buildNativePdfBytes(pages: RenderedPageData[]): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let byteLength = 0;

  const pushStr = (str: string) => {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    byteLength += bytes.length;
  };

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    byteLength += bytes.length;
  };

  const startObj = (id: number) => {
    offsets[id] = byteLength;
    pushStr(`${id} 0 obj\n`);
  };

  const endObj = () => pushStr("\nendobj\n");

  // PDF 1.4 Header
  pushStr("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");

  // Object 1: Catalog
  startObj(1);
  pushStr("<< /Type /Catalog /Pages 2 0 R >>");
  endObj();

  // Object 2: Pages
  const pageObjIds = pages.map((_, i) => 4 + i * 3);
  startObj(2);
  pushStr(
    `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`
  );
  endObj();

  // Object 3: Standard Type1 Font for invisible searchable/ATS text layer
  startObj(3);
  pushStr(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
  );
  endObj();

  // Per-page objects
  pages.forEach((page, i) => {
    const pageId = 4 + i * 3;
    const contentId = pageId + 1;
    const imgId = pageId + 2;

    startObj(pageId);
    pushStr(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_WIDTH_PT} ${A4_HEIGHT_PT}] /Resources << /Font << /F1 3 0 R >> /XObject << /Im${i} ${imgId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    endObj();

    const textOps = page.textItems
      .map((item) => {
        const escaped = escapePdfLiteralString(item.text);
        if (!escaped) return "";
        return `BT 3 Tr /F1 ${item.fontSizePt} Tf 1 0 0 1 ${item.xPt} ${item.yPt} Tm (${escaped}) Tj ET`;
      })
      .filter(Boolean)
      .join("\n");

    const contentStream = `q ${A4_WIDTH_PT} 0 0 ${A4_HEIGHT_PT} 0 0 cm /Im${i} Do Q${
      textOps ? `\n${textOps}` : ""
    }`;
    const contentBytes = encoder.encode(contentStream);

    startObj(contentId);
    pushStr(`<< /Length ${contentBytes.length} >>\nstream\n`);
    pushBytes(contentBytes);
    pushStr("\nendstream");
    endObj();

    startObj(imgId);
    pushStr(
      `<< /Type /XObject /Subtype /Image /Width ${page.widthPx} /Height ${page.heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpegBytes.length} >>\nstream\n`
    );
    pushBytes(page.jpegBytes);
    pushStr("\nendstream");
    endObj();
  });

  const totalObjs = 3 + pages.length * 3;
  const xrefOffset = byteLength;
  pushStr(`xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`);
  for (let id = 1; id <= totalObjs; id += 1) {
    pushStr(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }
  pushStr(
    `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );

  const output = new Uint8Array(byteLength);
  let cursor = 0;
  for (const chunk of chunks) {
    output.set(chunk, cursor);
    cursor += chunk.length;
  }
  return output;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function shouldUseServerAttachmentDownload(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari =
    /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua);
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  return isIOS || isSafari || isMobile;
}

function triggerPdfDownload(pdfBytes: Uint8Array, safeFilename: string): void {
  if (shouldUseServerAttachmentDownload()) {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = `/api/pdf-download/${encodeURIComponent(safeFilename)}`;
    form.style.display = "none";

    const nameInput = document.createElement("input");
    nameInput.type = "hidden";
    nameInput.name = "filename";
    nameInput.value = safeFilename;
    form.appendChild(nameInput);

    const dataInput = document.createElement("input");
    dataInput.type = "hidden";
    dataInput.name = "pdfBase64";
    dataInput.value = uint8ArrayToBase64(pdfBytes);
    form.appendChild(dataInput);

    document.body.appendChild(form);
    form.submit();
    window.setTimeout(() => {
      form.remove();
    }, 5_000);
    return;
  }

  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
    type: "application/octet-stream",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeFilename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function exportElementToPdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }

  const rootRect = element.getBoundingClientRect();
  if (rootRect.width <= 0 || rootRect.height <= 0) {
    throw new Error("The document preview is not ready to export.");
  }

  const svgNodeList = Array.from(element.querySelectorAll("svg"));
  const rasterizedSvgs = (
    await Promise.all(
      svgNodeList.map((svg) => rasterizeSvgElement(svg, rootRect))
    )
  ).filter((item): item is SvgDrawItem => item !== null);

  const boxes = collectBoxDrawItems(element, rootRect);
  const texts = collectTextDrawItems(element, rootRect);
  const slices = computePageSlices(
    element,
    rootRect,
    boxes,
    texts,
    rasterizedSvgs
  );

  const renderedPages = slices.map((slice) =>
    renderPageCanvas(slice, boxes, texts, rasterizedSvgs)
  );

  const pdfBytes = buildNativePdfBytes(renderedPages);
  const safeFilename = filename.toLowerCase().endsWith(".pdf")
    ? filename
    : `${filename}.pdf`;

  triggerPdfDownload(pdfBytes, safeFilename);
}
