import { useCallback, useEffect, useState } from "react";

export function useSessionList<T>(storageKey: string) {
  const [items, setItems] = useState<T[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // storage full or unavailable — keep in-memory state
    }
  }, [storageKey, items]);

  const addItem = useCallback((item: T) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const removeItem = useCallback((predicate: (item: T) => boolean) => {
    setItems((prev) => prev.filter((i) => !predicate(i)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, addItem, removeItem, clear };
}