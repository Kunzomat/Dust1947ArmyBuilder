import {
  aggregateArmyUnits,
  getArmyUnitAggregationKey,
  getRemovalRequest,
  expandArmyUnitsByQuantity,
} from "./armyUnitAggregation";

test("expandArmyUnitsByQuantity repeats each row by its quantity", () => {
  const out = expandArmyUnitsByQuantity([
    { unit_id: 1, quantity: 3 },
    { unit_id: 2 },
    { unit_id: 3, quantity: 2, army_platoon_id: 5 },
  ]);
  expect(out.map((u) => u.unit_id)).toEqual([1, 1, 1, 2, 3, 3]);
});

const clone = (overrides = {}) => ({
  army_unit_id: 1,
  army_id: 10,
  army_platoon_id: null,
  platoon_unit_id: null,
  unit_id: 42,
  unit_name: "Clone Troopers",
  unit_points: 12,
  type: "I",
  variant: "standard",
  equipment: [{ id: 7, name: "Blaster" }],
  quantity: 1,
  ...overrides,
});

describe("army unit aggregation", () => {
  test("groups equivalent infantry or vehicle rows and totals their points", () => {
    const groups = aggregateArmyUnits([
      clone({ army_unit_id: 1, quantity: 2 }),
      clone({ army_unit_id: 2, quantity: 1 }),
      clone({
        army_unit_id: 3,
        unit_id: 99,
        unit_name: "TX-130 Tank",
        unit_points: 30,
        type: "V",
      }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      quantity: 3,
      unitPoints: 12,
      groupPoints: 36,
    });
    expect(groups[1]).toMatchObject({
      quantity: 1,
      unitPoints: 30,
      groupPoints: 30,
    });
  });

  test("keeps platoon assignments, variants, and equipment configurations separate", () => {
    const base = clone();
    const groups = aggregateArmyUnits([
      base,
      clone({ army_unit_id: 2, army_platoon_id: 11 }),
      clone({ army_unit_id: 3, variant: "heavy" }),
      clone({ army_unit_id: 4, equipment: [{ id: 8, name: "Heavy Blaster" }] }),
      clone({ army_unit_id: 5, equipment: [{ id: 9, name: "Blaster" }] }),
    ]);

    expect(groups).toHaveLength(5);
    expect(getArmyUnitAggregationKey(base)).not.toBe(
      getArmyUnitAggregationKey({ ...base, army_platoon_id: 11 })
    );
  });

  test("removes one persisted instance at a time and removes the row at zero", () => {
    const quantityGroup = aggregateArmyUnits([clone({ army_unit_id: 7, quantity: 3 })])[0];
    expect(getRemovalRequest(quantityGroup)).toEqual({
      action: "army.units.update",
      method: "POST",
      params: { id: 7, quantity: 2 },
    });

    const oneUnitGroup = aggregateArmyUnits([clone({ army_unit_id: 8, quantity: 1 })])[0];
    expect(getRemovalRequest(oneUnitGroup)).toEqual({
      action: "army.units.delete",
      method: "POST",
      params: { id: 8 },
    });
  });

  test("re-aggregates persisted API rows identically after reload", () => {
    const beforeReload = [
      clone({ army_unit_id: 1, quantity: 1 }),
      clone({ army_unit_id: 2, quantity: 2 }),
    ];
    const reloadedApiRows = JSON.parse(JSON.stringify(beforeReload));

    expect(aggregateArmyUnits(reloadedApiRows)).toEqual(
      aggregateArmyUnits(beforeReload)
    );
  });
});
