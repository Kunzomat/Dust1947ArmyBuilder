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
const COL_RANGE = 22;
const COL_ARC = 26;
const COL_STAT = 17;

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
  const imageBoxRef = useRef(null);
  const rulesRef = useRef(null);
  const [unit, setUnit] = useState(FALLBACK_UNIT);
  const [clipped, setClipped] = useState(false);

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

  // Fit pass. Order matters: header text and the weapon table settle first,
  // because they decide how much height is left for the image/rules row.
  useLayoutEffect(() => {
    fitFont(nameRef.current, 12, 7);
    fitFont(subRef.current, 7, 5);
    fitFont(notesRef.current, 9, 6);
    // Weapon table has fixed geometry; only weapon names shrink to fit
    // their (nowrap, ellipsis) cell.
    weaponsRef.current
      ?.querySelectorAll("[data-weapon-name]")
      .forEach((el) => fitFont(el, 9, 5.5));

    const panel = rulesRef.current;
    const imageBox = imageBoxRef.current;
    if (!panel || !imageBox) return;
    const stages = [
      { image: 160, max: 10, min: 7 },
      { image: 120, max: 7, min: 5.5 },
    ];
    let fitted = false;
    for (const stage of stages) {
      imageBox.style.width = u(stage.image);
      if (fitFont(panel, stage.max, stage.min)) {
        fitted = true;
        break;
      }
    }
    setClipped(!fitted);
    // Overlay width depends on the final image width: re-fit its texts.
    fitFont(nameRef.current, 12, 7);
    fitFont(subRef.current, 7, 5);
  }, [unit, details]);

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
  const cell = (i, extra = {}) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: i === 0 ? "flex-start" : "center",
    textAlign: i === 0 ? "left" : "center",
    paddingLeft: i === 0 ? u(4) : 0,
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
          ref={imageBoxRef}
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
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                ref={nameRef}
                data-testid="card-name"
                sx={{
                  fontWeight: 900,
                  fontSize: u(12),
                  lineHeight: 1.1,
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
                  lineHeight: 1.2,
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
          {ruleEntries.map((r) => (
            <Box key={r.key} sx={{ marginBottom: "0.4em" }}>
              <Box component="strong" sx={{ fontWeight: 800 }}>
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
          color: "#000",
          border: `${u(TABLE_BORDER)} solid #000`,
          borderRadius: u(6),
          boxSizing: "border-box",
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
            color: "#000",
            fontWeight: 800,
            fontSize: u(7),
          }}
        >
          <Box sx={cell(0)}>Weapon</Box>
          <Box sx={cell(1)}>Range</Box>
          <Box sx={cell(2)}>Arc</Box>
          {statColumns.map((g) => (
            <Box
              key={g.type}
              data-testid={`card-weapons-group-${g.type}`}
              sx={{
                gridColumn: `span ${g.levels.length}`,
                fontSize: g.levels.length < 4 ? u(5.5) : undefined,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
            color: "#000",
            fontWeight: 700,
            fontSize: u(7.5),
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
              sx={cell(3 + ci)}
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
            color: "#000",
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
            ARC_LABELS[w.arc] || "–",
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
                    fontWeight: i === 0 ? 700 : 400,
                    fontSize: i === 0 ? undefined : i === 2 ? u(6.5) : u(7),
                    background: "none",
                    color: "#000",
                  })}
                >
                  {i === 0 ? (
                    <Box
                      data-weapon-name
                      sx={{
                        width: "100%",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
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
