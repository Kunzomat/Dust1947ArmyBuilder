import { useEffect, useState } from "react";

// Session-scoped UI state for list filters.  A bad or older payload is merged
// with the supplied defaults so an individual stale field cannot break a view.
export default function useSessionStorageState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined" || !window.sessionStorage) {
      return defaultValue;
    }

    try {
      const storedValue = window.sessionStorage.getItem(key);
      if (!storedValue) return defaultValue;

      const parsedValue = JSON.parse(storedValue);
      return parsedValue && typeof parsedValue === "object" && !Array.isArray(parsedValue)
        ? { ...defaultValue, ...parsedValue }
        : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.sessionStorage) return;

    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Storage can be disabled or full. Filters must remain usable in memory.
    }
  }, [key, value]);

  return [value, setValue];
}
