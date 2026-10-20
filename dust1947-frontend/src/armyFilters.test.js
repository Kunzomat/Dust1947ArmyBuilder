import {
  filterArmies,
  getBlocsForGameSystem,
  getGameSystems,
} from "./armyFilters";

const blocs = [
  { id: 1, name: "Axis", game_system_id: 10, game_system_name: "Dust 1947" },
  { id: 2, name: "Allies", game_system_id: 10, game_system_name: "Dust 1947" },
  { id: 3, name: "Imperium", game_system_id: 20, game_system_name: "Other" },
];

const armies = [
  { id: 1, name: "Axis Army", bloc_id: 1 },
  { id: 2, name: "Allied Army", bloc_id: 2 },
  { id: 3, name: "Other Army", bloc_id: 3 },
];

test("includes API systems and systems referenced by blocs", () => {
  expect(getGameSystems([{ id: 10, name: "Dust 1947" }], blocs)).toEqual([
    { id: 10, name: "Dust 1947" },
    { id: 20, name: "Other" },
  ]);
});

test("limits blocs and armies by game system and then bloc", () => {
  expect(getBlocsForGameSystem(blocs, 10).map((bloc) => bloc.id)).toEqual([1, 2]);
  expect(filterArmies(armies, blocs, 10).map((army) => army.id)).toEqual([1, 2]);
  expect(filterArmies(armies, blocs, 10, 2).map((army) => army.id)).toEqual([2]);
});
