import { validateArmyComposition } from "./armyValidation";

function unit(overrides = {}) {
  return {
    army_unit_id: overrides.army_unit_id ?? Math.floor(Math.random() * 100000),
    unit_id: overrides.unit_id ?? overrides.army_unit_id ?? Math.floor(Math.random() * 100000),
    unit_name: overrides.unit_name ?? "Unit",
    faction_id: overrides.faction_id ?? 1,
    bloc_id: overrides.bloc_id ?? 1,
    type: overrides.type ?? "I",
    unit_points: overrides.unit_points ?? 10,
    quantity: overrides.quantity ?? 1,
    rule_names: overrides.rule_names ?? ["ARMOR 2"],
    ...overrides,
  };
}

function validate({ army, units = [], platoons = [], platoon_templates = [] }) {
  return validateArmyComposition({
    army: {
      id: 1,
      name: "Test Army",
      bloc_id: 1,
      points_limit: 100,
      ...army,
    },
    units,
    platoons,
    platoon_templates,
  });
}

function violationRules(result) {
  return result.violations.map((entry) => entry.rule);
}

describe("validateArmyComposition", () => {
  test("rules 1, 2, 8 and 9: bloc validation ignores mercenaries and a pure mercenary force is valid", () => {
    const blocInfantry = unit({ army_unit_id: 1, unit_id: 1, unit_name: "Bloc Infantry", unit_points: 70 });
    const mercHero = unit({
      army_unit_id: 2,
      unit_id: 2,
      unit_name: "Merc Hero",
      type: "H",
      bloc_id: 99,
      faction_id: 99,
      unit_points: 30,
      rule_names: ["MERCENARY", "ARMOR 2"],
    });
    const offBlocVehicle = unit({
      army_unit_id: 3,
      unit_id: 3,
      unit_name: "Enemy Tank",
      bloc_id: 2,
      faction_id: 2,
      type: "V",
      unit_points: 20,
      rule_names: ["ARMOR 4"],
    });

    const validBlocArmy = validate({ units: [blocInfantry, mercHero] });
    expect(validBlocArmy.isValid).toBe(true);
    expect(violationRules(validBlocArmy)).not.toContain(1);

    const invalidBlocArmy = validate({ units: [blocInfantry, offBlocVehicle] });
    expect(violationRules(invalidBlocArmy)).toContain(1);

    const pureMercArmy = validate({ units: [mercHero] });
    expect(pureMercArmy.isValid).toBe(true);
    expect(pureMercArmy.forceType).toBe("Pure Mercenary Force");
  });

  test("rules 3, 6 and 7: exactly 75% faction AP grants exactly 10% hero-only bonus", () => {
    const factionCore = unit({ army_unit_id: 10, unit_id: 10, unit_name: "Core", unit_points: 75 });
    const blocHero = unit({
      army_unit_id: 11,
      unit_id: 11,
      unit_name: "Bloc Hero",
      type: "H",
      unit_points: 10,
      rule_names: ["ARMOR 2"],
    });
    const mercSupport = unit({
      army_unit_id: 12,
      unit_id: 12,
      unit_name: "Merc Support",
      unit_points: 25,
      faction_id: 9,
      bloc_id: 9,
      rule_names: ["MERCENARY", "ARMOR 2"],
    });

    const valid = validate({ units: [factionCore, mercSupport, blocHero] });
    expect(valid.isValid).toBe(true);
    expect(valid.forceType).toBe("Faction Force");
    expect(valid.bonusApAvailable).toBe(10);
    expect(valid.bonusApUsed).toBe(10);

    const illegalBonusOnNonHero = validate({
      units: [
        factionCore,
        mercSupport,
        unit({ army_unit_id: 13, unit_id: 13, unit_name: "Extra Vehicle", type: "V", unit_points: 10, rule_names: ["ARMOR 4"] }),
      ],
    });

    expect(violationRules(illegalBonusOnNonHero)).toContain(7);
  });

  test("rules 4 and 5: another faction blocks faction-force qualification while bloc force stays otherwise legal", () => {
    const result = validate({
      units: [
        unit({ army_unit_id: 20, unit_id: 20, unit_name: "Faction A 1", faction_id: 1, unit_points: 80 }),
        unit({ army_unit_id: 21, unit_id: 21, unit_name: "Faction B", faction_id: 2, bloc_id: 1, unit_points: 20 }),
      ],
    });

    expect(result.isValid).toBe(true);
    expect(result.forceType).toBe("Bloc Force");
    expect(result.warnings.some((entry) => entry.rule === 4 || entry.rule === 3)).toBe(true);
  });

  test("rules 10 to 14: pure mercenary bonus, single captured vehicle, surcharge and capture eligibility", () => {
    const mercHero = unit({
      army_unit_id: 30,
      unit_id: 30,
      unit_name: "Merc Hero",
      type: "H",
      unit_points: 8,
      faction_id: 9,
      bloc_id: 9,
      rule_names: ["MERCENARY", "ARMOR 2"],
    });
    const capturedWalker = unit({
      army_unit_id: 31,
      unit_id: 31,
      unit_name: "Captured Walker",
      type: "V",
      unit_points: 20,
      faction_id: 2,
      bloc_id: 2,
      is_captured: true,
      can_be_captured: true,
      rule_names: ["ARMOR 4"],
    });

    const valid = validate({ units: [mercHero, capturedWalker] });
    expect(valid.isValid).toBe(true);
    expect(valid.pointsUsed).toBe(30);

    const invalid = validate({
      units: [
        mercHero,
        capturedWalker,
        unit({
          army_unit_id: 32,
          unit_id: 32,
          unit_name: "Second Captured Tank",
          type: "V",
          unit_points: 15,
          faction_id: 3,
          bloc_id: 3,
          is_captured: true,
          can_be_captured: false,
          rule_names: ["ARMOR 3"],
        }),
      ],
    });

    expect(violationRules(invalid)).toEqual(expect.arrayContaining([12, 14]));
  });

  test("rule 15: the same unique hero may only occur once", () => {
    const result = validate({
      units: [
        unit({ army_unit_id: 40, unit_id: 500, unit_name: "Unique Hero", type: "H", is_unique: true, unit_points: 10 }),
        unit({ army_unit_id: 41, unit_id: 500, unit_name: "Unique Hero", type: "H", is_unique: true, unit_points: 10 }),
      ],
    });

    expect(violationRules(result)).toContain(15);
  });

  test.each(["H", "HERO", "I", "V", "A"])("rule 15: uniqueness is independent of type %s", (type) => {
    for (const flag of [true, 1, "1", false, 0, "0", undefined, null]) {
      const first = unit({ army_unit_id: 1, unit_id: 500, type, is_unique: flag });
      const repeatedRows = [first, { ...first, army_unit_id: 2 }];
      const quantityRow = [{ ...first, quantity: "2" }];
      for (const units of [repeatedRows, quantityRow]) {
        expect(violationRules(validate({ units })).includes(15)).toBe([true, 1, "1"].includes(flag));
      }
      expect(violationRules(validate({ units: [first] }))).not.toContain(15);
    }
  });

  test("rule 15: missing flag defaults to nonunique, identity is not the display name", () => {
    const first = unit({ army_unit_id: 1, unit_id: 500, type: "H" });
    expect(validate({ units: [first, { ...first, army_unit_id: 2 }] }).isValid).toBe(true);
    expect(violationRules(validate({ units: [
      { ...first, is_unique: true },
      { ...first, army_unit_id: 2, unit_id: 501, is_unique: true },
    ] }))).not.toContain(15);
  });

  test("rule 17: generic duplicate heroes still obey attachment limit and Siblings does not bypass uniqueness", () => {
    const infantry = unit({ army_unit_id: 1, unit_id: 1 });
    const hero = unit({ army_unit_id: 2, unit_id: 500, type: "H", is_unique: false, attached_to_army_unit_id: 1 });
    const heroes = [hero, { ...hero, army_unit_id: 3 }];
    const generic = validate({ units: [infantry, ...heroes] });
    expect(violationRules(generic)).toContain(17);
    expect(violationRules(generic)).not.toContain(15);

    const siblings = heroes.map((entry) => ({ ...entry, rule_names: ["ARMOR 2", "SIBLINGS"] }));
    expect(validate({ units: [infantry, ...siblings] }).isValid).toBe(true);
    const uniqueSiblings = validate({ units: [infantry, ...siblings.map((entry) => ({ ...entry, is_unique: true }))] });
    expect(violationRules(uniqueSiblings)).toContain(15);
    expect(violationRules(uniqueSiblings)).not.toContain(17);

    // Do not broaden the legacy H predicate used by attachment rules.
    expect(violationRules(validate({ units: [infantry, ...heroes.map((entry) => ({ ...entry, type: "HERO" }))] }))).not.toContain(17);
  });

  test("rules 16 to 20: hero joins infantry with same armor, siblings exception, and pilot restrictions", () => {
    const infantry = unit({ army_unit_id: 50, unit_id: 50, unit_name: "Infantry", type: "I", rule_names: ["ARMOR 2"] });
    const vehicle = unit({ army_unit_id: 51, unit_id: 51, unit_name: "Vehicle", type: "V", rule_names: ["ARMOR 4"] });
    const siblingOne = unit({
      army_unit_id: 52,
      unit_id: 52,
      unit_name: "Sibling One",
      type: "H",
      attached_to_army_unit_id: 50,
      rule_names: ["ARMOR 2", "SIBLINGS"],
    });
    const siblingTwo = unit({
      army_unit_id: 53,
      unit_id: 53,
      unit_name: "Sibling Two",
      type: "H",
      attached_to_army_unit_id: 50,
      rule_names: ["ARMOR 2", "SIBLINGS"],
    });
    const badPilot = unit({
      army_unit_id: 54,
      unit_id: 54,
      unit_name: "Bad Pilot",
      type: "H",
      attached_to_army_unit_id: 51,
      attachment_role: "pilot",
      rule_names: ["ARMOR 2"],
    });
    const secondPilot = unit({
      army_unit_id: 55,
      unit_id: 55,
      unit_name: "Second Pilot",
      type: "H",
      attached_to_army_unit_id: 51,
      attachment_role: "pilot",
      rule_names: ["ARMOR 2", "PILOT"],
    });

    const validSiblings = validate({ units: [infantry, siblingOne, siblingTwo] });
    expect(validSiblings.isValid).toBe(true);

    const invalidPilotSetup = validate({ units: [infantry, vehicle, badPilot, secondPilot] });
    expect(violationRules(invalidPilotSetup)).toEqual(expect.arrayContaining([19, 20]));
  });

  test("rules 21 to 23: commissars must join infantry with same armor and stay limited to one per unit", () => {
    const infantry = unit({ army_unit_id: 60, unit_id: 60, unit_name: "Infantry", type: "I", rule_names: ["ARMOR 2"] });
    const commissarA = unit({
      army_unit_id: 61,
      unit_id: 61,
      unit_name: "Commissar A",
      type: "H",
      attached_to_army_unit_id: 60,
      attachment_role: "commissar",
      rule_names: ["COMMISSAR", "ARMOR 2"],
    });
    const commissarB = unit({
      army_unit_id: 62,
      unit_id: 62,
      unit_name: "Commissar B",
      type: "H",
      attached_to_army_unit_id: 60,
      attachment_role: "commissar",
      rule_names: ["COMMISSAR", "ARMOR 3"],
    });
    const looseCommissar = unit({
      army_unit_id: 63,
      unit_id: 63,
      unit_name: "Loose Commissar",
      type: "H",
      rule_names: ["COMMISSAR", "ARMOR 2"],
    });

    const result = validate({ units: [infantry, commissarA, commissarB, looseCommissar] });
    expect(violationRules(result)).toEqual(expect.arrayContaining([21, 22, 23]));
  });

  test("rules 24 to 29: platoons are optional, but chosen platoons need every required slot assigned", () => {
    const emptyArmy = validate({ units: [] });
    expect(emptyArmy.isValid).toBe(true);

    const result = validate({
      platoons: [{ army_platoon_id: 70, platoon_id: 700, name: "Infantry Platoon" }],
      platoon_templates: [
        unit({ army_platoon_id: 70, platoon_unit_id: 701, slot: "COMMAND_1", unit_name: "Officer", type: "H", rule_names: ["ARMOR 2"] }),
        unit({ army_platoon_id: 70, platoon_unit_id: 702, slot: "COMBAT_1", unit_name: "Squad", type: "I", rule_names: ["ARMOR 2"] }),
      ],
      units: [unit({ army_unit_id: 71, unit_id: 71, army_platoon_id: 70, platoon_unit_id: 701, platoon_slot: "COMMAND_1", type: "H" })],
    });

    expect(violationRules(result)).toContain(25);
  });

  test("rules 31 to 34: exactly one valid mercenary combat replacement satisfies a platoon slot", () => {
    const result = validate({
      platoons: [{ army_platoon_id: 80, platoon_id: 800, name: "Walker Platoon" }],
      platoon_templates: [
        unit({ army_platoon_id: 80, platoon_unit_id: 801, slot: "COMMAND_1", unit_name: "Commander", type: "H", rule_names: ["ARMOR 2"] }),
        unit({ army_platoon_id: 80, platoon_unit_id: 802, slot: "COMBAT_1", unit_name: "Required Walker", type: "V", rule_names: ["ARMOR 3"] }),
      ],
      units: [
        unit({ army_unit_id: 81, unit_id: 81, army_platoon_id: 80, platoon_unit_id: 801, platoon_slot: "COMMAND_1", type: "H", rule_names: ["ARMOR 2"] }),
        unit({
          army_unit_id: 82,
          unit_id: 82,
          unit_name: "Merc Walker",
          army_platoon_id: 80,
          platoon_slot: "COMBAT_1",
          type: "V",
          faction_id: 9,
          bloc_id: 9,
          unit_points: 15,
          rule_names: ["MERCENARY", "ARMOR 4"],
        }),
      ],
    });

    expect(result.isValid).toBe(true);
  });

  test("rules 31 to 34: wrong type, low armor, or multiple mercenary replacements are invalid", () => {
    const result = validate({
      platoons: [{ army_platoon_id: 90, platoon_id: 900, name: "Battle Platoon" }],
      platoon_templates: [
        unit({ army_platoon_id: 90, platoon_unit_id: 901, slot: "COMMAND_1", unit_name: "Commander", type: "H", rule_names: ["ARMOR 2"] }),
        unit({ army_platoon_id: 90, platoon_unit_id: 902, slot: "COMBAT_1", unit_name: "Required Infantry", type: "I", rule_names: ["ARMOR 3"] }),
        unit({ army_platoon_id: 90, platoon_unit_id: 903, slot: "COMBAT_2", unit_name: "Required Vehicle", type: "V", rule_names: ["ARMOR 4"] }),
      ],
      units: [
        unit({ army_unit_id: 91, unit_id: 91, army_platoon_id: 90, platoon_unit_id: 901, platoon_slot: "COMMAND_1", type: "H", rule_names: ["ARMOR 2"] }),
        unit({
          army_unit_id: 92,
          unit_id: 92,
          unit_name: "Merc Wrong Type",
          army_platoon_id: 90,
          platoon_slot: "COMBAT_1",
          type: "V",
          faction_id: 9,
          bloc_id: 9,
          rule_names: ["MERCENARY", "ARMOR 4"],
        }),
        unit({
          army_unit_id: 93,
          unit_id: 93,
          unit_name: "Merc Low Armor",
          army_platoon_id: 90,
          platoon_slot: "COMBAT_2",
          type: "V",
          faction_id: 9,
          bloc_id: 9,
          rule_names: ["MERCENARY", "ARMOR 3"],
        }),
      ],
    });

    expect(violationRules(result)).toEqual(expect.arrayContaining([31, 32, 33]));
  });
});
