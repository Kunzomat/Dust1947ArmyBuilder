import React from "react";
import { render, screen, within } from "@testing-library/react";
import CardFront, {
  buildRuleEntries,
  buildStatColumns,
  getWeaponCell,
} from "./CardFront";

const weapon = (id, name, extra = {}) => ({
  id,
  name,
  range: 12,
  number: 1,
  arc: "F",
  disposable: 0,
  rules: [],
  stats: {
    a: { type: "I", level: 1, dice: 3, damage: 1 },
    b: { type: "V", level: 3, dice: 2, damage: 2 },
  },
  ...extra,
});

const baseUnit = {
  id: 1,
  name: "Test Hero",
  type: "H",
  faction: "Allies",
  points: 42,
  level: 2,
  speed: 4,
  march_speed: 8,
  health: 3,
  is_unique: 1,
  notes: "Jump Pack",
  special_rules: [
    { id: 2, name: "Zeta", note: "2", desc: "Zeta text" },
    { id: 1, name: "Alpha", desc: "Alpha text" },
  ],
  weapons: [
    weapon(1, "Rifle", {
      rules: [{ id: 9, name: "Burst", desc: "Burst text" }],
    }),
    weapon(2, "Pistol", {
      disposable: 1,
      rules: [{ id: 9, name: "Burst", desc: "Burst text" }],
    }),
  ],
};

describe("CardFront helpers", () => {
  it("reads dice/damage by target type and level", () => {
    expect(getWeaponCell(baseUnit.weapons[0], "I", 1)).toBe("3/1");
    expect(getWeaponCell(baseUnit.weapons[0], "I", 2)).toBe("");
    expect(getWeaponCell({}, "I", 1)).toBe("");
  });

  it("always builds the fixed Inf 1-4 / Veh 1-7 / Air 1-3 columns", () => {
    const cols = buildStatColumns(baseUnit.weapons);
    expect(cols.map((c) => [c.type, c.levels])).toEqual([
      ["I", [1, 2, 3, 4]],
      ["V", [1, 2, 3, 4, 5, 6, 7]],
      ["A", [1, 2, 3]],
    ]);
  });

  it("sorts rules and de-duplicates weapon rules", () => {
    const entries = buildRuleEntries(
      baseUnit.special_rules,
      baseUnit.weapons
    );
    expect(entries.map((e) => e.name)).toEqual(["Alpha", "Zeta", "Burst"]);
  });
});

describe("CardFront", () => {
  it("renders all unit data", () => {
    render(<CardFront details={baseUnit} bgColor="#3f6fb5" />);
    expect(screen.getByTestId("card-name")).toHaveTextContent("Test Hero");
    expect(screen.getByTestId("card-points")).toHaveTextContent("42");
    expect(screen.getByTestId("card-move")).toHaveTextContent("4");
    expect(screen.getByTestId("card-move")).toHaveTextContent("8");
    expect(screen.getByTestId("card-level")).toHaveTextContent("2");
    expect(screen.getByTestId("card-health")).toHaveTextContent("3");
    expect(screen.getByTestId("card-unique")).toBeInTheDocument();
    expect(screen.getByTestId("card-notes")).toHaveTextContent("Jump Pack");
    expect(screen.getByText(/Allies · Hero/)).toBeInTheDocument();

    const rules = screen.getByTestId("card-rules");
    expect(within(rules).getByText(/Zeta \(2\):/)).toBeInTheDocument();
    expect(rules).toHaveTextContent("Alpha text");
    expect(rules).toHaveTextContent("Burst text");

    const rows = screen.getAllByTestId("card-weapon-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("1x Rifle");
    expect(rows[0]).toHaveTextContent("3/1");
    expect(rows[0]).toHaveTextContent("2/2");
    // fixed structure: 5 weapon rows always, 14 level headers, '–' for gaps
    expect(screen.getAllByTestId("card-weapon-empty-row")).toHaveLength(3);
    expect(screen.getAllByTestId("card-weapons-level")).toHaveLength(14);
    expect(screen.getByTestId("card-weapons-group-A")).toBeInTheDocument();
    expect(rows[0]).toHaveTextContent("–");
  });

  it("renders only the first 5 weapons of a large loadout and tolerates missing data", () => {
    const many = Array.from({ length: 9 }, (_, i) => weapon(i + 1, `W${i}`));
    render(
      <CardFront
        details={{ ...baseUnit, weapons: many, special_rules: undefined, notes: "" }}
        bgColor="#3f6fb5"
      />
    );
    expect(screen.getAllByTestId("card-weapon-row")).toHaveLength(5);
    expect(screen.queryByTestId("card-weapon-empty-row")).toBeNull();
    expect(screen.queryByTestId("card-notes")).toBeNull();
  });

  it("renders the full empty table without weapons or details", () => {
    render(<CardFront />);
    expect(screen.getByTestId("card-weapons")).toBeInTheDocument();
    expect(screen.queryAllByTestId("card-weapon-row")).toHaveLength(0);
    expect(screen.getAllByTestId("card-weapon-empty-row")).toHaveLength(5);
  });

  it("uses object-fit: cover for the unit image (export swaps these for background-size: cover)", () => {
    render(
      <CardFront
        details={{ ...baseUnit, image_url: "http://example.test/u.png" }}
        bgColor="#3f6fb5"
      />
    );
    const img = screen.getByAltText("Test Hero");
    expect(getComputedStyle(img).objectFit).toBe("cover");
  });
});
