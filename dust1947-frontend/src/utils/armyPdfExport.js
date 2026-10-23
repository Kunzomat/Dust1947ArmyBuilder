import { apiCall } from "../apiClient";
import { expandArmyUnitsByQuantity } from "../armyUnitAggregation";
import { renderUnitCardToCanvas, EXPORT_SCALE } from "./cardExport";

// CardFront frame border-radius: u(10) = 10 logical px (x2.5 = 25 px at 1000x1000).
const CARD_CORNER_RADIUS_LOGICAL = 10;

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// Document geometry: A4 portrait 210 x 297 mm, square cards of exactly
// 80 x 80 mm (real size, no scaling), 2 columns x 3 rows = 6 per page
// (160 x 240 mm block, centered: 25 mm side margins, 28.5 mm top/bottom).
export const PDF_CARD_WIDTH_MM = 80;
export const PDF_CARD_HEIGHT_MM = 80;
const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const COLUMNS = 2;
const ROWS = 3;

export function getArmyPdfFileName(armyName) {
  const safe = String(armyName || "Armee")
    .replace(/[^\w\-äöüÄÖÜß]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `Dust1947-${safe || "Armee"}-Karten.pdf`;
}

/**
 * Generates and downloads a PDF with one card per unit of the army
 * (units with quantity N appear N times).
 * @param {object} armyDetail result of armies.get
 * @param {string} armyName
 * @param {(done:number,total:number)=>void} onProgress
 */
export async function exportArmyCardsPdf(armyDetail, armyName, onProgress = () => {}) {
  const entries = expandArmyUnitsByQuantity(armyDetail?.units || []);
  if (!entries.length) throw new Error("Die Armee enthält keine Einheiten.");

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const marginX = (PAGE_WIDTH_MM - COLUMNS * PDF_CARD_WIDTH_MM) / 2;
  const marginY = (PAGE_HEIGHT_MM - ROWS * PDF_CARD_HEIGHT_MM) / 2;
  const perPage = COLUMNS * ROWS;

  // unit id -> rendered PNG data URL (each distinct unit fetched/rendered once)
  const cache = new Map();
  const total = entries.length;
  onProgress(0, total);

  for (let i = 0; i < total; i += 1) {
    const unitId = entries[i].unit_id;
    if (!cache.has(unitId)) {
      const res = await apiCall("unit.get", { id: unitId });
      if (!res?.unit) throw new Error(`Einheit ${unitId} konnte nicht geladen werden.`);
      const canvas = await renderUnitCardToCanvas(res.unit);
      // Flatten onto opaque white (rounded corners become white, not black)
      // and encode as JPEG to keep the PDF small. PNG download is unaffected.
      const flat = document.createElement("canvas");
      flat.width = canvas.width;
      flat.height = canvas.height;
      const ctx = flat.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, flat.width, flat.height);
      // The export wrapper is a square, black-filled box while the card frame
      // (CardFront) has a 10 logical px radius -> black corner artifacts.
      // Clip to the card's rounded outer shape so the outside stays white.
      ctx.save();
      roundedRectPath(ctx, 0, 0, flat.width, flat.height, CARD_CORNER_RADIUS_LOGICAL * EXPORT_SCALE);
      ctx.clip();
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();
      cache.set(unitId, flat.toDataURL("image/jpeg", 0.92));
    }

    const slot = i % perPage;
    if (i > 0 && slot === 0) pdf.addPage("a4", "portrait");
    const x = marginX + (slot % COLUMNS) * PDF_CARD_WIDTH_MM;
    const y = marginY + Math.floor(slot / COLUMNS) * PDF_CARD_HEIGHT_MM;
    pdf.addImage(cache.get(unitId), "JPEG", x, y, PDF_CARD_WIDTH_MM, PDF_CARD_HEIGHT_MM, `unit-${unitId}`);
    onProgress(i + 1, total);
  }

  pdf.save(getArmyPdfFileName(armyName));
}
