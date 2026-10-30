import React, { useLayoutEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import SmartImage from "./SmartImage";

import iconInfanterie from "../assets/icons/infanterie.png";
import iconVehicle from "../assets/icons/vehicle_tank.png";
import iconAircraft from "../assets/icons/aircraft_jet.png";

/*
 * Card front layout (own CSS/SVG implementation; no third-party code/assets).
 *
 * ONE single SQUARE card, 80 x 80 mm. It is designed on a logical 400 x 400px
 * canvas. Every length is written
 * as calc(<logical px> * var(--u)), where --u is (rendered width / 400) and is
 * set on the root element. This keeps the layout identical at any display size
 * WITHOUT CSS transforms, so the browser view and the html2canvas export
 * (UnitCard.handleExportImage) resolve to exactly the same computed px.
 *
 * Overflow strategy: text blocks (name, notes, rules) are fitted
 * by stepping their font size down until nothing overflows (see fitFont).
 * The weapon table has fixed geometry (1/3 card height, 5 rows, fixed columns);
 * only weapon names shrink. Only the rules panel has a second stage (narrower
 * image) and, as the very last resort, clips with an ellipsis marker.
 */

export const LOGICAL_WIDTH = 400; // 80 mm, 1 logical px = 0.2 mm
export const LOGICAL_HEIGHT = 400; // 80 mm
const FALLBACK_UNIT = 1;

const u = (n) => `calc(${n} * var(--u, 1px))`;

const TYPE_LABELS = {
  I: "Infantry",
  H: "Hero",
  S: "Super Human",
  V: "Vehicle",
  A: "Aircraft",
};
const TYPE_ICONS = {
  I: iconInfanterie,
  H: iconInfanterie,
  S: iconInfanterie,
  V: iconVehicle,
  A: iconAircraft,
};
const ARC_LABELS = {
  L: "Left",
  R: "Right",
  F: "Front",
  REAR: "Rear",
  T: "Turret",
};
const STAT_GROUPS = [
  { type: "I", label: "Infantry", levels: [1, 2, 3, 4] },
  { type: "V", label: "Vehicle", levels: [1, 2, 3, 4, 5, 6, 7] },
  { type: "A", label: "Aircraft / AA", levels: [1, 2, 3] },
];

const collator = (a, b) =>
  String(a || "").localeCompare(String(b || ""), "de", { sensitivity: "base" });

const asList = (value) =>
  Array.isArray(value) ? value : Object.values(value || {});

export function getWeaponCell(weapon, type, level) {
  if (!weapon || !weapon.stats) return "";
  const match = Object.values(weapon.stats).find(
    (s) => s.type === type && Number(s.level) === Number(level)
  );
  return match ? `${match.dice}/${match.damage}` : "";
}

// Display only: '*' -> black blast icon, '#' -> black skull icon, '**' -> double
// blast (inline SVG, ~0.72em high = digit height, on the text baseline).
const STAT_ICON_STYLE = {
  display: "inline-block",
  width: "0.81em",
  height: "0.81em",
  verticalAlign: "baseline",
  fill: "#000",
};
const STAT_ICON_PATHS = {
  // 12-point blast star
  "#": "M12 0.5 L14.6 6.6 L20.5 3.5 L17.4 9.4 L23.5 12 L17.4 14.6 L20.5 20.5 L14.6 17.4 L12 23.5 L9.4 17.4 L3.5 20.5 L6.6 14.6 L0.5 12 L6.6 9.4 L3.5 3.5 L9.4 6.6 Z",
  // skull: cranium + jaw, eye sockets/nose cut out (evenodd)
  "*": "M12 1 C6.5 1 3 4.8 3 9.8 C3 13 4.6 15.2 7 16.4 L7 20 C7 20.6 7.4 21 8 21 L16 21 C16.6 21 17 20.6 17 20 L17 16.4 C19.4 15.2 21 13 21 9.8 C21 4.8 17.5 1 12 1 Z M8.2 8.2 C6.9 8.2 6 9.2 6 10.4 C6 11.6 6.9 12.6 8.2 12.6 C9.5 12.6 10.4 11.6 10.4 10.4 C10.4 9.2 9.5 8.2 8.2 8.2 Z M15.8 8.2 C14.5 8.2 13.6 9.2 13.6 10.4 C13.6 11.6 14.5 12.6 15.8 12.6 C17.1 12.6 18 11.6 18 10.4 C18 9.2 17.1 8.2 15.8 8.2 Z M12 13 L10.6 16 L13.4 16 Z",
};

function renderStatSymbols(value) {
  const text = String(value ?? "");
  if (!/[#*]/.test(text)) return value;
  // '**' must be tokenized before '*'.
  return text.split(/(\*\*|\*|#)/).map((part, idx) => {
    if (part === "**") {
      return (
        <svg
          key={idx}
          // blast spans x 0.5..23.5 (23 wide); 2nd shifted 8 (~35%) => 0.5..31.5
          viewBox="0.5 0.5 31 23"
          preserveAspectRatio="xMidYMid meet"
          width="1.092em"
          height="0.81em"
          style={{
            ...STAT_ICON_STYLE,
            // exact aspect: 0.81em * 31/23 = 1.092em (Oswald digit height 0.81em)
            width: "1.092em",
            height: "0.81em",
            minWidth: "1.092em",
            flexShrink: 0,
            marginInline: 0,
          }}
          fill="#000"
          aria-label="double blast"
          role="img"
        >
          <path d={STAT_ICON_PATHS["#"]} fill="#000" />
          <path
            d={STAT_ICON_PATHS["#"]}
            fill="#000"
            stroke="#fff"
            strokeWidth="1.2"
            strokeLinejoin="miter"
            paintOrder="stroke"
            transform="translate(8 0)"
          />
        </svg>
      );
    }
    if (part === "*" || part === "#") {
      // '*' -> blast, '#' -> skull
      const isBlast = part === "*";
      return (
        <svg
          key={idx}
          viewBox={isBlast ? "0.5 0.5 23 23" : "3 1 18 20"}
          preserveAspectRatio="none"
          width={isBlast ? "0.81em" : "0.729em"}
          height="0.81em"
          style={{
            ...STAT_ICON_STYLE,
            width: isBlast ? "0.81em" : "0.729em",
          }}
          fill="#000"
          aria-label={isBlast ? "blast" : "skull"}
          role="img"
        >
          <path
            d={STAT_ICON_PATHS[isBlast ? "#" : "*"]}
            fill="#000"
            fillRule="evenodd"
          />
        </svg>
      );
    }
    return part;
  });
}

// The weapon table has a FIXED column structure (Inf 1-4, Veh 1-7, Air 1-3)
// for every unit, independent of the weapon data.
export function buildStatColumns() {
  return STAT_GROUPS.map((group) => ({ ...group, levels: [...group.levels] }));
}

// The weapon table always has exactly this many weapon rows (empty-padded).
export const WEAPON_ROWS = 5;
// Weapon block = exactly 1/3 of the card height (incl. its header rows).
export const WEAPON_BLOCK_HEIGHT = LOGICAL_HEIGHT / 3;
const TABLE_BORDER = 2;
const HEADER_ROW_HEIGHT = 11;
// 14 stat columns + range + arc = 286 of the 378 px table width; the rest is
// the weapon name column (square card: full width, fixed narrow columns).
const COL_RANGE = 21;
const COL_ARC = 24;
const COL_STAT = 18;
// Single card font (Oswald is bundled via @fontsource, see index.js); set on
// the card root so all card text inherits it.
const CARD_FONT =
  "Oswald, 'Roboto Condensed', 'Arial Narrow', 'DejaVu Sans Condensed', 'Liberation Sans Narrow', Impact, sans-serif";
const TABLE_INK = "#231f1a";

// Unit rules first (sorted), then weapon rules (sorted, de-duplicated).
export function buildRuleEntries(specialRules, weapons) {
  const entries = [...specialRules]
    .sort((a, b) => collator(a?.name, b?.name))
    .map((r) => ({
      key: `sr-${r.id ?? r.name}`,
      name: r.name,
      note: r.note,
      desc: r.desc,
    }));

  const seen = new Set();
  weapons
    .flatMap((w) =>
      asList(w?.rules).map((rule) => ({ weaponName: w?.name || "", rule }))
    )
    .sort((a, b) => collator(a.rule?.name, b.rule?.name))
    .forEach(({ weaponName, rule }) => {
      const key =
        rule.id || `${weaponName}-${rule.name || ""}-${rule.desc || ""}`;
      if (seen.has(key)) return;
      seen.add(key);
      entries.push({
        key: `wr-${key}`,
        name: rule.name,
        note: null,
        desc: rule.desc,
      });
    });
  return entries;
}

// Steps the font size of `el` down (logical px) until its content fits.
// Returns true if it fits at some size, false if even `min` overflows.
function fitFont(el, max, min, step = 0.5, extraFits = null) {
  if (!el) return true;
  for (let size = max; size >= min; size -= step) {
    el.style.fontSize = u(size);
    if (
      el.scrollHeight <= el.clientHeight + 1 &&
      el.scrollWidth <= el.clientWidth + 1 &&
      (!extraFits || extraFits())
    ) {
      return true;
    }
  }
  el.style.fontSize = u(min);
  return false;
}

function CardFront({ details = {}, bgColor }) {
  const rootRef = useRef(null);
  const nameRef = useRef(null);
  const subRef = useRef(null);
  const notesRef = useRef(null);
  const weaponsRef = useRef(null);
  const rulesRef = useRef(null);
  const [unit, setUnit] = useState(FALLBACK_UNIT);
  const [clipped, setClipped] = useState(false);
  const [fontTick, setFontTick] = useState(0);

  const weapons = asList(details.weapons);
  const specialRules = asList(details.special_rules);
  const symbolUrl = details.faction_symbol_url || details.bloc_symbol_url;
  const symbolAlt = details.faction || details.bloc_name || "Faction";
  const factionInitial = details.faction
    ? details.faction.charAt(0).toUpperCase()
    : "S";
  const typeLabel = TYPE_LABELS[details.type] || details.type || "";
  const typeIcon = TYPE_ICONS[details.type] || null;
  const isUnique = [true, 1, "1"].includes(details.is_unique);
  const health = Number(details.health) || 0;

  const shownWeapons = weapons.slice(0, WEAPON_ROWS);
  const statColumns = buildStatColumns();
  const flatColumns = statColumns.flatMap((g) =>
    g.levels.map((level) => ({ type: g.type, level }))
  );
  const statCount = flatColumns.length;
  const ruleEntries = buildRuleEntries(specialRules, weapons);

  // Track rendered width -> --u
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const measure = () => {
      const width = root.offsetWidth;
      if (width > 0) setUnit(width / LOGICAL_WIDTH);
    };
    measure();
    const observer =
      typeof window.ResizeObserver === "function"
        ? new window.ResizeObserver(measure)
        : null;
    if (observer) observer.observe(root);
    else window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Re-run the fit pass once Oswald is available (measurements depend on it).
  useLayoutEffect(() => {
    const fonts = typeof document !== "undefined" ? document.fonts : null;
    if (!fonts) return undefined;
    let active = true;
    const bump = () => active && setFontTick((t) => t + 1);
    if (fonts.load) {
      fonts.load("400 10px Oswald").then(bump, () => {});
      fonts.load("700 10px Oswald").then(bump, () => {});
    }
    if (fonts.ready) fonts.ready.then(bump);
    fonts.addEventListener?.("loadingdone", bump);
    return () => {
      active = false;
      fonts.removeEventListener?.("loadingdone", bump);
    };
  }, []);

  // Fit pass. Order matters: header text and the weapon table settle first,
  // because they decide how much height is left for the image/rules row.
  useLayoutEffect(() => {
    fitFont(nameRef.current, 12, 7);
    fitFont(subRef.current, 7, 5);
    fitFont(notesRef.current, 9, 6);
    // Weapon names use a fixed font size (same as stat values); no fitting.

    // Rules panel: FIXED font size (no shrinking); only detect clipping.
    const panel = rulesRef.current;
    if (!panel) return;
    setClipped(panel.scrollHeight > panel.clientHeight + 1);
    // Overlay width depends on the final image width: re-fit its texts.
    fitFont(nameRef.current, 12, 7);
    fitFont(subRef.current, 7, 5);
  }, [unit, details, fontTick]);

  const imgFill = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "none",
  };
  const gridColumns = `minmax(0, 1fr) ${u(COL_RANGE)} ${u(COL_ARC)} repeat(${statCount}, ${u(COL_STAT)})`;
  const rowSx = {
    display: "grid",
    gridTemplateColumns: gridColumns,
    alignItems: "stretch",
    boxSizing: "border-box",
  };
  // column index (0 = name, 1 = range, 2 = arc, 3.. = stats) where a new
  // target-type group starts
  const groupStart = new Set();
  let offset = 3;
  statColumns.forEach((g) => {
    groupStart.add(offset);
    offset += g.levels.length;
  });
  // Header labels of different font sizes share one baseline: Oswald's
  // baseline sits 0.452em below the centre of a 1em line box; compensate the
  // difference to a common target with padding (units).
  const HDR_BASELINE = 2.8;
  const hdrPad = (size) => {
    const off = 0.452 * size - HDR_BASELINE;
    return off >= 0
      ? { paddingBottom: u(2 * off), paddingTop: 0 }
      : { paddingTop: u(-2 * off), paddingBottom: 0 };
  };
  const cell = (i, extra = {}) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: i === 0 ? "flex-start" : "center",
    textAlign: i === 0 ? "left" : "center",
    paddingLeft: i === 0 ? u(4) : 0,
    // Oswald digits (cap height 0.81em) sit ~0.047em below the centre of a
    // 1em line box; lift them so they're optically centred.
    paddingBottom: i === 0 ? 0 : "0.09em",
    lineHeight: 1,
    borderLeft: groupStart.has(i)
      ? `${u(2)} solid #222`
      : i > 0
        ? `${u(1)} solid #ccc`
        : "none",
    minWidth: 0,
    overflow: "hidden",
    whiteSpace: "nowrap",
    ...extra,
  });

  return (
    <Box
      ref={rootRef}
      style={{ "--u": `${unit}px` }}
      sx={{
        width: "100%",
        height: "100%",
        background: bgColor,
        position: "relative",
        overflow: "hidden",
        border: `${u(6)} solid #000000`,
        borderRadius: u(10),
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: u(3),
        padding: u(3),
        color: "#111",
        fontFamily: CARD_FONT,
      }}
    >
      {/* ===== Image + rules row ===== */}
      <Box
        sx={{
          flex: "1 1 0",
          minHeight: u(90),
          display: "flex",
          border: `${u(2)} solid #000`,
          borderRadius: u(6),
          overflow: "hidden",
          background: "#d4dbe2",
        }}
      >
        <Box
          sx={{
            flex: "none",
            width: u(160),
            position: "relative",
            overflow: "hidden",
            background: "#e0e0e0",
            borderRight: `${u(2)} solid #000`,
          }}
        >
          {details.image_url ? (
            <SmartImage
              src={details.image_url}
              alt={details.name}
              type="unit"
              sx={{ ...imgFill, position: "absolute", inset: 0 }}
            />
          ) : (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: u(14),
                fontWeight: 700,
              }}
            >
              Kein Bild vorhanden
            </Box>
          )}

          {/* AP badge */}
          <Box
            title="Army Points"
            sx={{
              position: "absolute",
              top: u(6),
              left: u(6),
              minWidth: u(34),
              background: "#fff",
              border: `${u(2)} solid #000`,
              borderRadius: u(8),
              padding: `${u(2)} ${u(4)}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              lineHeight: 1,
              boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
              boxSizing: "border-box",
            }}
          >
            <Box
              sx={{ fontWeight: 800, letterSpacing: "0.04em", fontSize: u(8) }}
            >
              AP
            </Box>
            <Box
              data-testid="card-points"
              sx={{ fontWeight: 900, fontSize: u(20), lineHeight: 1.05 }}
            >
              {details.points}
            </Box>
          </Box>

          {isUnique && (
            <Box
              data-testid="card-unique"
              sx={{
                position: "absolute",
                top: u(6),
                right: u(6),
                background: "#000",
                color: "#fff",
                borderRadius: u(6),
                padding: `${u(2)} ${u(6)}`,
                fontSize: u(8),
                fontWeight: 800,
                letterSpacing: "0.06em",
                lineHeight: 1.2,
              }}
            >
              ★ UNIQUE
            </Box>
          )}

          {/* Title overlay: faction logo, name, faction/type */}
          <Box
            data-testid="card-title-overlay"
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              gap: u(5),
              padding: `${u(2)} ${u(5)}`,
              background: "#FFFFFF",
              color: "#000000",
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
            <Box
              title={symbolAlt}
              sx={{
                flex: "none",
                width: u(22),
                height: u(22),
                border: `${u(1.5)} solid #000`,
                borderRadius: u(3),
                background: "#fff",
                color: "#111",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              {symbolUrl ? (
                <SmartImage
                  src={symbolUrl}
                  alt={symbolAlt}
                  type="faction"
                  sx={imgFill}
                />
              ) : (
                <Box sx={{ fontWeight: 900, fontSize: u(16), lineHeight: 1 }}>
                  {factionInitial}
                </Box>
              )}
            </Box>
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                // Oswald line boxes are tall: let the text block use the
                // overlay's vertical padding so the overlay size is unchanged
                margin: `${u(-2.5)} 0`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Box
                ref={nameRef}
                data-testid="card-name"
                sx={{
                  fontWeight: 900,
                  fontSize: u(12),
                  // line box >= ink incl. descenders (Oswald 1.48em content area)
                  lineHeight: 1.35,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {details.name}
              </Box>
              <Box
                ref={subRef}
                sx={{
                  fontWeight: 700,
                  fontSize: u(7),
                  // extra room below baseline so 'y'/'p' descenders are not
                  // clipped (also in html2canvas export)
                  lineHeight: 1.5,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  opacity: 0.85,
                }}
              >
                {[details.faction, typeLabel].filter(Boolean).join(" · ")}
              </Box>
            </Box>
          </Box>

          {!!details.notes && (
            <Box
              ref={notesRef}
              data-testid="card-notes"
              sx={{
                position: "absolute",
                left: u(6),
                right: u(6),
                bottom: u(34),
                maxHeight: u(28),
                overflow: "hidden",
                background: "rgba(255,255,255,0.92)",
                border: `${u(1.5)} solid #000`,
                borderRadius: u(5),
                padding: `${u(1)} ${u(4)}`,
                fontSize: u(9),
                fontWeight: 700,
                lineHeight: 1.15,
                textAlign: "center",
                boxSizing: "border-box",
              }}
            >
              {details.notes}
            </Box>
          )}
        </Box>

        {/* Rules */}
        <Box
          ref={rulesRef}
          data-testid="card-rules"
          sx={{
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            padding: `${u(4)} ${u(5)}`,
            fontSize: u(10),
            lineHeight: 1.2,
            position: "relative",
            overflowWrap: "anywhere",
            background: "#fff",
            color: "#000",
          }}
        >
          {ruleEntries.map((r, ri) => (
            <Box
              key={r.key}
              sx={{
                marginBottom: ri < ruleEntries.length - 1 ? "0.4em" : 0,
                lineHeight: 1.2,
                fontWeight: 400,
              }}
            >
              <Box component="strong" sx={{ fontWeight: 700 }}>
                {r.name}
                {r.note ? ` (${r.note})` : ""}
                {r.desc ? ":" : ""}
              </Box>
              {r.desc ? ` ${r.desc}` : ""}
            </Box>
          ))}
          {clipped && (
            <Box
              data-testid="card-rules-clipped"
              title="Regeltext gekürzt – siehe Details"
              sx={{
                position: "absolute",
                right: u(4),
                bottom: u(2),
                paddingLeft: u(4),
                background: "#fff",
                fontWeight: 900,
                fontSize: u(12),
                lineHeight: 1,
              }}
            >
              …
            </Box>
          )}
        </Box>
      </Box>

      {/* ===== Weapon profile table ===== */}
      <Box
        ref={weaponsRef}
        data-testid="card-weapons"
        sx={{
          flex: "none",
          height: u(WEAPON_BLOCK_HEIGHT),
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "#fff",
          color: TABLE_INK,
          border: `${u(TABLE_BORDER)} solid #000`,
          borderRadius: u(6),
          boxSizing: "border-box",
          fontWeight: 700,
          fontSize: u(9),
          lineHeight: 1,
        }}
      >
        <Box
          sx={{
            ...rowSx,
            flex: "none",
            height: u(HEADER_ROW_HEIGHT),
            background: "#fff",
            color: TABLE_INK,
            fontWeight: 700,
            fontSize: u(6),
          }}
        >
          <Box sx={cell(0, hdrPad(6))}>Weapon</Box>
          <Box sx={cell(1, { fontSize: u(6), ...hdrPad(6) })}>Range</Box>
          <Box sx={cell(2, hdrPad(6))}>Arc</Box>
          {statColumns.map((g) => (
            <Box
              key={g.type}
              data-testid={`card-weapons-group-${g.type}`}
              sx={{
                gridColumn: `span ${g.levels.length}`,
                fontSize: u(6),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                ...hdrPad(6),
                overflow: "hidden",
                whiteSpace: "nowrap",
                borderLeft: `${u(2)} solid #222`,
              }}
            >
              {g.label}
            </Box>
          ))}
        </Box>
        <Box
          sx={{
            ...rowSx,
            flex: "none",
            height: u(HEADER_ROW_HEIGHT),
            background: "#fff",
            color: TABLE_INK,
            fontWeight: 700,
            fontSize: u(9),
            borderBottom: `${u(2)} solid #222`,
          }}
        >
          <Box sx={cell(0)} />
          <Box sx={cell(1)} />
          <Box sx={cell(2)} />
          {flatColumns.map((c, ci) => (
            <Box
              key={`${c.type}${c.level}`}
              data-testid="card-weapons-level"
              sx={cell(3 + ci, { fontSize: u(8), paddingBottom: u(0.75) })}
            >
              {c.level}
            </Box>
          ))}
        </Box>
        {Array.from({ length: WEAPON_ROWS }).map((_, rowIndex) => {
          const w = shownWeapons[rowIndex];
          const rowBase = {
            ...rowSx,
            flex: "1 1 0",
            minHeight: 0,
            background: "#fff",
            color: TABLE_INK,
            borderBottom:
              rowIndex < WEAPON_ROWS - 1 ? `${u(1)} solid #ccc` : "none",
          };
          if (!w) {
            return (
              <Box
                key={`empty-${rowIndex}`}
                data-testid="card-weapon-empty-row"
                sx={rowBase}
              >
                {Array.from({ length: 3 + statCount }).map((__, i) => (
                  <Box key={i} sx={cell(i)} />
                ))}
              </Box>
            );
          }
          const boxes = (w.number || 1) * (w.disposable || 0);
          const cells = [
            null,
            w.range === 0 ? "C" : w.range || "–",
            ["I", "H", "S"].includes(details.type)
              ? "–"
              : ARC_LABELS[w.arc] || "–",
            ...flatColumns.map((c) => getWeaponCell(w, c.type, c.level) || "–"),
          ];
          return (
            <Box
              key={`${w.id}-${rowIndex}`}
              data-testid="card-weapon-row"
              sx={rowBase}
            >
              {cells.map((value, i) => (
                <Box
                  key={i}
                  sx={cell(i, {
                    fontWeight: 700,
                    ...(i >= 3 ? { letterSpacing: "-0.03em", padding: 0, paddingBottom: "0.09em" } : {}),
                    // stat cells: Oswald 700, fixed size (no auto-fit);
                    // 9 keeps '10/3' (1.87em) inside the 18-unit column
                    fontSize:
                      i === 0 ? undefined : i === 1 ? u(11.2) : i === 2 ? u(8) : u(9),
                    background: "none",
                    color: TABLE_INK,
                  })}
                >
                  {i === 0 ? (
                    <Box
                      data-weapon-name
                      sx={{
                        // safety margin so the name never touches the clip edge
                        width: `calc(100% - ${u(3)})`,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        textTransform: "uppercase",
                        fontSize: u(7.5),
                        lineHeight: 1.3,
                      }}
                    >
                      {`${w.number || 1}x ${w.name || ""}`}
                      {boxes > 0 && (
                        <Box
                          component="span"
                          sx={{
                            display: "inline-flex",
                            gap: "0.15em",
                            marginLeft: "0.4em",
                            verticalAlign: "middle",
                          }}
                        >
                          {Array.from({ length: boxes }).map((__, b) => (
                            <Box
                              key={b}
                              component="span"
                              sx={{
                                width: "0.7em",
                                height: "0.7em",
                                border: `${u(1.5)} solid #222`,
                                borderRadius: "0.15em",
                                background: "#fff",
                                display: "inline-block",
                                boxSizing: "border-box",
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  ) : i >= 3 ? (
                    renderStatSymbols(value)
                  ) : (
                    value
                  )}
                </Box>
              ))}
            </Box>
          );
        })}
      </Box>

      {/* ===== Bottom bar: movement, level/type, health ===== */}
      <Box
        sx={{
          flex: "none",
          height: u(32),
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
          alignItems: "center",
          columnGap: u(10),
          background: "#fff",
          color: "#000",
          border: `${u(2)} solid #000`,
          borderRadius: u(6),
          padding: `0 ${u(8)}`,
          boxSizing: "border-box",
          fontWeight: 800,
          whiteSpace: "nowrap",
        }}
      >
        {/* LEFT: health symbol, value, boxes */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: u(10),
            minWidth: 0,
            overflow: "hidden",
            justifySelf: "stretch",
          }}
        >
        <Box
          sx={{
            flex: "none",
            display: "flex",
            alignItems: "center",
            gap: u(3),
            fontSize: u(16),
            lineHeight: 1,
          }}
          title="Health"
        >
          <svg
            viewBox="0 0 24 24"
            style={{ width: u(16), height: u(16) }}
            aria-hidden="true"
          >
            <path
              fill="#111"
              d="M12 21s-7.5-4.6-9.6-9.2C.8 8.2 3 4.5 6.6 4.5c2 0 3.6 1.1 5.4 3.2 1.8-2.1 3.4-3.2 5.4-3.2 3.6 0 5.8 3.7 4.2 7.3C19.5 16.4 12 21 12 21z"
            />
          </svg>
          <span data-testid="card-health">{details.health}</span>
        </Box>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: health > 1 ? "flex" : "none",
            gap: u(3),
            justifyContent: "flex-start",
          }}
        >
          {Array.from({ length: Math.min(Math.max(0, health), 40) }).map(
            (_, i) => (
              <Box
                key={i}
                sx={{
                  flex: `0 1 ${u(16)}`,
                  minWidth: u(4),
                  height: u(14),
                  border: `${u(2)} solid #222`,
                  borderRadius: u(4),
                  background: "#fff",
                  boxSizing: "border-box",
                }}
              />
            )
          )}
        </Box>
        </Box>
        {/* CENTER: Hero / Super Human label, empty for normal units */}
        <Box
          data-testid="card-hero-label"
          sx={{
            justifySelf: "center",
            fontSize: u(12),
            whiteSpace: "nowrap",
            textAlign: "right",
          }}
        >
          {(details.type === "H" || details.type === "S") ? typeLabel : ""}
        </Box>
        {/* RIGHT: movement, march, type, level */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: u(10),
            minWidth: 0,
          }}
        >
          <Box
            data-testid="card-move"
            sx={{ flex: "none", fontSize: u(16), whiteSpace: "nowrap" }}
          >
            ➜ {details.speed} ⇛ {details.march_speed}
          </Box>
          <Box
            sx={{
              flex: "none",
              display: "flex",
              alignItems: "center",
              gap: u(3),
              fontSize: u(16),
              lineHeight: 1,
            }}
            title={typeLabel}
          >
            {typeIcon && (
              <img
                src={typeIcon}
                alt={`${details.type} icon`}
                style={{ width: u(16), height: u(16) }}
              />
            )}
            <span data-testid="card-level">{details.level}</span>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default CardFront;
