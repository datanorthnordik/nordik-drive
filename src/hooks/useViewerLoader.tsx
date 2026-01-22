// hooks/useViewerLoader.ts
import { useEffect, useState } from "react";

type UseViewerLoaderArgs<T> = {
  loading: boolean;
  error: any;
  data: any;
  pendingRowId: number | null;
  setPendingRowId: (v: number | null) => void;
  setItems: (items: T[]) => void;
  setModalOpen: (v: boolean) => void;
  pickList: (data: any) => T[];
  onError?: (err: any) => void;
};

export function useViewerLoader<T>({
  loading,
  error,
  data,
  pendingRowId,
  setPendingRowId,
  setItems,
  setModalOpen,
  pickList,
  onError,
}: UseViewerLoaderArgs<T>) {
  useEffect(() => {
    if (!pendingRowId) return;
    if (loading) return;

    if (error) {
      onError?.(error);
      setPendingRowId(null);
      return;
    }

    if (data) {
      const list = pickList(data);
      setItems(list);
      setPendingRowId(null);
      setModalOpen(true);
    }
  }, [pendingRowId, loading, error, data, setPendingRowId, setItems, setModalOpen, pickList, onError]);
}
