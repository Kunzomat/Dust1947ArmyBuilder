// `army_units` are persisted as individual rows (and may themselves carry a
// quantity).  Keep that persistence shape, but combine equivalent rows for
// the roster display.
const INSTANCE_ONLY_FIELDS = new Set([
  "army_unit_id",
  "id",
  "quantity",
  "created_at",
  "updated_at",
]);

function stableValue(value, isRoot = false) {
  if (Array.isArray(value)) {
    return value.map((item) => stableValue(item));
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      // `id` is only an instance identifier on the army-unit row. Nested
      // IDs (for example equipment IDs) are part of configuration.
      .filter((key) => !isRoot || !INSTANCE_ONLY_FIELDS.has(key))
      .sort()
      .reduce((result, key) => {
        result[key] = stableValue(value[key]);
        return result;
      }, {});
  }

  return value;
}

function unitQuantity(unit) {
  return Math.max(1, Number.parseInt(unit?.quantity, 10) || 1);
}

function unitPoints(unit) {
  return Number(unit?.unit_points ?? unit?.points) || 0;
}

// Include every persisted/configuration value returned by the API while
// excluding only row identity and quantity.  This deliberately includes
// platoon assignment, variant and equipment/configuration fields.
export function getArmyUnitAggregationKey(unit) {
  return JSON.stringify(stableValue(unit || {}, true));
}

export function aggregateArmyUnits(units = []) {
  const groups = new Map();

  for (const unit of units) {
    const key = getArmyUnitAggregationKey(unit);
    const existing = groups.get(key);
    if (existing) {
      existing.units.push(unit);
      existing.quantity += unitQuantity(unit);
      existing.groupPoints += unitPoints(unit) * unitQuantity(unit);
    } else {
      groups.set(key, {
        key,
        unit,
        units: [unit],
        quantity: unitQuantity(unit),
        unitPoints: unitPoints(unit),
        groupPoints: unitPoints(unit) * unitQuantity(unit),
      });
    }
  }

  return [...groups.values()].sort(compareArmyUnitGroups);
}

// Display order: Hero (H), Infantry (I), Vehicle (V), Aircraft (A), unknown
// last; then by unit name A-Z (case-insensitive). Display only.
const TYPE_ORDER = { H: 0, I: 1, V: 2, A: 3 };

function typeRank(unit) {
  const type = String(unit?.type ?? unit?.unit_type ?? "").trim().toUpperCase();
  return type in TYPE_ORDER ? TYPE_ORDER[type] : 4;
}

export function compareArmyUnitGroups(a, b) {
  const diff = typeRank(a?.unit) - typeRank(b?.unit);
  if (diff !== 0) return diff;
  return String(a?.unit?.unit_name ?? a?.unit?.name ?? "").localeCompare(String(b?.unit?.unit_name ?? b?.unit?.name ?? ""), undefined, {
    sensitivity: "base",
  });
}

// One entry per physical unit: every army_units row (free, platoon and
// support units alike) repeated `quantity` times, in army order.
export function expandArmyUnitsByQuantity(units = []) {
  const expanded = [];
  for (const unit of units) {
    const count = unitQuantity(unit);
    for (let i = 0; i < count; i += 1) expanded.push(unit);
  }
  return expanded;
}

export function getRemovalRequest(group) {
  const unit = group?.units?.[0];
  if (!unit?.army_unit_id) {
    throw new Error("Cannot remove a unit without an army-unit id.");
  }

  const quantity = unitQuantity(unit);
  return quantity > 1
    ? { action: "army.units.update", method: "POST", params: { id: unit.army_unit_id, quantity: quantity - 1 } }
    : { action: "army.units.delete", method: "POST", params: { id: unit.army_unit_id } };
}
