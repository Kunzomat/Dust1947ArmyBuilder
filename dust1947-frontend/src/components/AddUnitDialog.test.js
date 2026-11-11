import { filterOutUsedUniqueUnits } from "./AddUnitDialog";

const available = [
  { unit_id: 1, name: "Hero", is_unique: 1 },
  { unit_id: 2, name: "Grunt", is_unique: 0 },
  { unit_id: 3, name: "Hero", is_unique: 1 }, // same name, different id
];

test("hides unique units already in the army (by id, any platoon)", () => {
  const army = [{ army_unit_id: 9, unit_id: 1, is_unique: 1, army_platoon_id: 5 }];
  expect(filterOutUsedUniqueUnits(available, army).map((u) => u.unit_id)).toEqual([2, 3]);
});

test("non-unique units stay available even when already in the army", () => {
  const army = [{ army_unit_id: 9, unit_id: 2, is_unique: 0 }];
  expect(filterOutUsedUniqueUnits(available, army)).toHaveLength(3);
});

test("unique unit reappears after removal from the army", () => {
  expect(filterOutUsedUniqueUnits(available, [])).toHaveLength(3);
  expect(filterOutUsedUniqueUnits(available, undefined)).toHaveLength(3);
});
