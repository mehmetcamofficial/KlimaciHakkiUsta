import { useEffect, useState } from "react";
import { fetchCatalog, type CatalogResult } from "@/services/categories";
export function useCatalog() {
  const [catalog, setCatalog] = useState<CatalogResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    fetchCatalog()
      .then((data) => {
        if (active) setCatalog(data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  return {
    catalog,
    loading,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}
