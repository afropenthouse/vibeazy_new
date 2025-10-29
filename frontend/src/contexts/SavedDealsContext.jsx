"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const SavedDealsContext = createContext(null);

export function SavedDealsProvider({ children }) {
  const [savedMap, setSavedMap] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("savedDeals");
        return raw ? JSON.parse(raw) : {};
      }
    } catch {}
    return {};
  });

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("savedDeals", JSON.stringify(savedMap));
      }
    } catch {}
  }, [savedMap]);

  const save = (item) => {
    setSavedMap((prev) => ({ ...prev, [item.id]: item }));
  };

  const unsave = (id) => {
    setSavedMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const toggle = (item) => {
    if (savedMap[item.id]) unsave(item.id);
    else save(item);
  };

  const isSaved = (id) => !!savedMap[id];

  const savedList = useMemo(() => Object.values(savedMap), [savedMap]);

  const value = { savedMap, savedList, save, unsave, toggle, isSaved };
  return <SavedDealsContext.Provider value={value}>{children}</SavedDealsContext.Provider>;
}

export function useSavedDeals() {
  const ctx = useContext(SavedDealsContext);
  if (!ctx) throw new Error("useSavedDeals must be used within SavedDealsProvider");
  return ctx;
}