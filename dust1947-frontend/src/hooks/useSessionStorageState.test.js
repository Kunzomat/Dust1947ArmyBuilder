import { renderHook, act } from "@testing-library/react";
import useSessionStorageState from "./useSessionStorageState";

const key = "dust1947.filters.v1.test";
const defaults = { gameSystemId: "", factionId: "", name: "" };

beforeEach(() => window.sessionStorage.clear());

test("hydrates valid state and persists updater changes", () => {
  window.sessionStorage.setItem(key, JSON.stringify({ gameSystemId: "2", name: "Axis" }));

  const { result } = renderHook(() => useSessionStorageState(key, defaults));
  expect(result.current[0]).toEqual({ gameSystemId: "2", factionId: "", name: "Axis" });

  act(() => result.current[1]((previous) => ({ ...previous, factionId: "4" })));
  expect(JSON.parse(window.sessionStorage.getItem(key))).toEqual({
    gameSystemId: "2", factionId: "4", name: "Axis",
  });
});

test("falls back safely from malformed or stale storage", () => {
  window.sessionStorage.setItem(key, "{not json");
  const { result } = renderHook(() => useSessionStorageState(key, defaults));

  expect(result.current[0]).toEqual(defaults);
});
