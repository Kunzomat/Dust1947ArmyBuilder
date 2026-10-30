import React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Box } from "@mui/material";
import html2canvas from "html2canvas";
import CardFront, { LOGICAL_WIDTH, LOGICAL_HEIGHT } from "../components/CardFront";

// Single SQUARE card: 80 x 80 mm (1 logical px = 0.2 mm).
export const CARD_WIDTH = LOGICAL_WIDTH; // 400
export const CARD_HEIGHT = LOGICAL_HEIGHT; // 400
// 400*4 x 400*4 = 1600 x 1600 px (exact square, ~508 dpi at 80 mm)
export const EXPORT_SCALE = 4;

// Faction colors by id
const FACTION_COLORS_BY_ID = {
  1: "#3f6fb5", // Allies
  2: "#FF4500", // Axis
  3: "#FFB90F", // SSU
  4: "#4a7845", // Mercenaries
  5: "#744d96", // Mythos
};

export function getFactionColor(factionId) {
  return FACTION_COLORS_BY_ID[factionId] || "#3f6fb5";
}

/**
 * Renders a mounted card element (marked with data-card-export-root) to a
 * canvas of exactly CARD_WIDTH*EXPORT_SCALE x CARD_HEIGHT*EXPORT_SCALE.
 */
export async function renderCardElementToCanvas(cardEl) {
  // Wait until all images are loaded
  const images = cardEl.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) resolve();
          else img.onload = img.onerror = resolve;
        })
    )
  );

  // Let fonts settle and image fade-ins/state updates paint before capture.
  if (document.fonts?.load) {
    try {
      await Promise.all([
        document.fonts.load("400 10px Oswald"),
        document.fonts.load("700 10px Oswald"),
      ]);
    } catch (e) {
      /* fall back to the font stack */
    }
  }
  if (document.fonts?.ready) await document.fonts.ready;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const OUT_W = CARD_WIDTH * EXPORT_SCALE;
  const OUT_H = CARD_HEIGHT * EXPORT_SCALE;
  const liveRect = cardEl.getBoundingClientRect();
  const liveW = liveRect.width || CARD_WIDTH;
  const liveH = liveRect.height || CARD_HEIGHT;
  const captureScale = OUT_W / liveW;

  // Position-independent capture: in the cloned document the card is moved
  // to <body> and pinned at left/top 0 with its exact logical size
  // (400x400 CSS px), so page scroll, layout, parent overflow/transforms and
  // fractional offsets cannot shift or clip the export.
  const pinCardInClone = (doc) => {
    const card = doc.querySelector("[data-card-export-root]");
    if (!card) return;
    doc.body.appendChild(card);
    doc.documentElement.style.cssText += ";margin:0;padding:0;overflow:visible;transform:none;";
    doc.body.style.cssText += ";margin:0;padding:0;overflow:visible;transform:none;position:static;";
    const s = card.style;
    s.position = "fixed";
    s.left = "0px";
    s.top = "0px";
    s.margin = "0px";
    s.transform = "none";
    // The clone keeps the LIVE pixel size (and the live --u), so every
    // text fit/wrap decided by CardFront in the browser stays valid; no
    // re-layout at another scale. Resolution comes from html2canvas scale.
    s.width = `${liveW}px`;
    s.height = `${liveH}px`;
    s.maxWidth = "none";
    s.zIndex = "2147483647";
  };

  // html2canvas ignores object-fit/object-position on <img> and would stretch
  // the picture. In the clone, swap such images for a box with the same
  // classes/size that uses background-size: cover + the same position.
  const swapCoverImages = (doc) => {
    const view = doc.defaultView;
    doc.querySelectorAll("img").forEach((img) => {
      const cs = view.getComputedStyle(img);
      if (cs.objectFit !== "cover") return;
      const box = doc.createElement("div");
      box.className = img.className;
      box.setAttribute("role", "img");
      box.setAttribute("aria-label", img.alt || "");
      box.style.cssText = img.style.cssText;
      box.style.backgroundImage = `url("${img.getAttribute("src") || img.currentSrc}")`;
      box.style.backgroundSize = "cover";
      box.style.backgroundRepeat = "no-repeat";
      box.style.backgroundPosition = cs.objectPosition || "50% 50%";
      box.style.opacity = "1";
      img.parentNode.replaceChild(box, img);
    });
  };

  // html2canvas draws bitmaps with a single drawImage() call (no mip-maps),
  // so a 1024-1536 px source drawn into e.g. 64 px (type icon) or 88 px
  // (faction symbol) aliases/blurs. Pre-resample every <img> to its exact
  // physical size (stepwise halving, smoothing "high", lossless PNG) and let
  // the clone use that data URL, so html2canvas only draws ~1:1.
  const presampled = new Map(); // index in cardEl.querySelectorAll("img") -> dataURL
  await Promise.all(
    Array.from(cardEl.querySelectorAll("img")).map(async (img, idx) => {
      try {
        const cs = window.getComputedStyle(img);
        const r = img.getBoundingClientRect();
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        if (!nw || !nh || !r.width || !r.height) return;
        const src = img.currentSrc || img.src;
        if (!src || src.startsWith("data:image/svg")) return;
        let f;
        let dw;
        let dh;
        let tw = 0; // cover: full (uncropped) scaled size
        let th = 0;
        const isCover = cs.objectFit === "cover";
        if (isCover) {
          f = Math.max(r.width / nw, r.height / nh) * captureScale;
          tw = Math.max(1, Math.round(nw * f));
          th = Math.max(1, Math.round(nh * f));
          // Final bitmap = the visible box in physical pixels (cover-cropped).
          dw = Math.max(1, Math.round(r.width * captureScale));
          dh = Math.max(1, Math.round(r.height * captureScale));
        } else {
          dw = Math.round(r.width * captureScale);
          dh = Math.round(r.height * captureScale);
          f = Math.max(dw / nw, dh / nh);
        }
        if (f >= 0.75) return; // not a real downscale
        const source = new Image();
        source.crossOrigin = "anonymous";
        source.src = src;
        await source.decode();
        let cur = source;
        let cw = nw;
        let ch = nh;
        const stepW = isCover ? tw : dw;
        const stepH = isCover ? th : dh;
        while (cw / 2 > stepW || ch / 2 > stepH) {
          cw = Math.max(stepW, Math.round(cw / 2));
          ch = Math.max(stepH, Math.round(ch / 2));
          const step = document.createElement("canvas");
          step.width = cw;
          step.height = ch;
          const sctx = step.getContext("2d");
          sctx.imageSmoothingEnabled = true;
          sctx.imageSmoothingQuality = "high";
          sctx.drawImage(cur, 0, 0, cw, ch);
          cur = step;
        }
        const out = document.createElement("canvas");
        out.width = dw;
        out.height = dh;
        const octx = out.getContext("2d");
        octx.imageSmoothingEnabled = true;
        octx.imageSmoothingQuality = "high";
        if (isCover) {
          // Crop to the visible box using object-position (default 50% 50%).
          const pos = (cs.objectPosition || "50% 50%").split(/\s+/);
          const frac = (s) => (s && s.endsWith("%") ? parseFloat(s) / 100 : 0.5);
          const px = frac(pos[0]);
          const py = frac(pos[1]);
          const vw = Math.min(cur.width, (cur.width * dw) / tw);
          const vh = Math.min(cur.height, (cur.height * dh) / th);
          octx.drawImage(
            cur,
            (cur.width - vw) * px,
            (cur.height - vh) * py,
            vw,
            vh,
            0,
            0,
            dw,
            dh
          );
        } else {
          octx.drawImage(cur, 0, 0, dw, dh);
        }
        presampled.set(idx, { url: out.toDataURL("image/png"), cover: isCover });
      } catch (e) {
        /* keep the original image (e.g. CORS failure) */
      }
    })
  );

  const applyPresampled = (doc) => {
    doc.querySelectorAll("img").forEach((img, idx) => {
      const entry = presampled.get(idx);
      if (!entry) return;
      img.src = entry.url;
      // Already cropped to the box at physical size: draw it as a plain
      // <img> stretched 1:1 (html2canvas' background-image path would
      // re-resize it to CSS px and upscale it again, blurring it).
      if (entry.cover) {
        img.style.objectFit = "fill";
        img.style.opacity = "1";
      }
    });
  };

  const rendered = await html2canvas(cardEl, {
    useCORS: true, // images are re-requested with CORS
    allowTaint: false, // never produce a tainted (un-exportable) canvas
    backgroundColor: null,
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0,
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,
    logging: false,
    width: liveW,
    height: liveH,
    scale: captureScale,
    onclone: (doc) => {
      pinCardInClone(doc);
      applyPresampled(doc);
      swapCoverImages(doc);
    },
  });

  // Always output exactly OUT_W x OUT_H (exact 1:1 square, no distortion).
  const canvas = document.createElement("canvas");
  canvas.width = OUT_W;
  canvas.height = OUT_H;
  canvas.getContext("2d").drawImage(rendered, 0, 0, OUT_W, OUT_H);
  return canvas;
}

/**
 * Renders a unit's card offscreen (hidden container, full logical width
 * 400 px so the CardFront auto-fit matches the on-screen/PNG export) and
 * returns a 1000x1000 canvas.
 */
export async function renderUnitCardToCanvas(details) {
  const container = document.createElement("div");
  container.style.cssText =
    `position:fixed;left:-10000px;top:0;width:${CARD_WIDTH}px;height:${CARD_HEIGHT}px;` +
    "pointer-events:none;";
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    flushSync(() => {
      root.render(
        <Box
          data-card-export-root="true"
          sx={{
            width: `${CARD_WIDTH}px`,
            maxWidth: "100%",
            flexShrink: 0,
            aspectRatio: `${CARD_WIDTH} / ${CARD_HEIGHT}`,
            height: "auto",
            display: "flex",
            background: "#000000",
            border: "1px solid #000000",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <CardFront details={details} bgColor={getFactionColor(details.faction_id)} />
        </Box>
      );
    });
    // Let layout effects (auto-fit) and image state updates settle.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return await renderCardElementToCanvas(container.firstElementChild);
  } finally {
    root.unmount();
    container.remove();
  }
}
