'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchLookupJSON } from "../../../../hooks/useFetch";

import {
  BaseLeafColCfg,
  FormCfg,
  LookupItem,
  TableCfg,
  asBool,
  flattenCols,
  meets,
  normalizeLookupItems,
  resolveDynamicPath,
  rowChanged,
} from "../shared";

type Params = {
  formConfig: FormCfg | null;
  answers: Record<string, any>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, any>>>;
};

export default function useConfigFormLookups({
  formConfig,
  answers,
  setAnswers,
}: Params) {
  const [lookupOptionsByPath, setLookupOptionsByPath] = useState<Record<string, LookupItem[]>>({});
  const [lookupLoadingByPath, setLookupLoadingByPath] = useState<Record<string, boolean>>({});
  const [lookupErrorsByPath, setLookupErrorsByPath] = useState<Record<string, string>>({});
  const lookupRequestsRef = useRef<Record<string, Promise<LookupItem[]> | undefined>>({});

  const resetLookupState = useCallback(() => {
    setLookupOptionsByPath({});
    setLookupLoadingByPath({});
    setLookupErrorsByPath({});
    lookupRequestsRef.current = {};
  }, []);

  const getLookupPathForColumn = useCallback(
    (col: BaseLeafColCfg, rowValues: Record<string, any>) => {
      if (!asBool(col.is_server) || !col.api) return "";
      return resolveDynamicPath(col.api, rowValues).replace(/^\/+/, "");
    },
    []
  );

  const ensureLookupOptions = useCallback(
    async (path: string) => {
      if (!path) return [];

      const existingOptions = lookupOptionsByPath[path];
      if (existingOptions) return existingOptions;

      const existingRequest = lookupRequestsRef.current[path];
      if (existingRequest) return existingRequest;

      setLookupLoadingByPath((prev) => ({ ...prev, [path]: true }));

      const request = (async () => {
        try {
          const res = await fetchLookupJSON(path);
          const items = normalizeLookupItems(res);

          setLookupOptionsByPath((prev) => ({ ...prev, [path]: items }));
          setLookupErrorsByPath((prev) => {
            const next = { ...prev };
            delete next[path];
            return next;
          });

          return items;
        } catch (err: any) {
          const message = err?.message || "Failed to fetch lookup values";
          setLookupErrorsByPath((prev) => ({ ...prev, [path]: message }));
          return [];
        } finally {
          setLookupLoadingByPath((prev) => ({ ...prev, [path]: false }));
          delete lookupRequestsRef.current[path];
        }
      })();

      lookupRequestsRef.current[path] = request;
      return request;
    },
    [lookupOptionsByPath]
  );

  const getSelectedLookupOption = useCallback(
    (col: BaseLeafColCfg, rowValues: Record<string, any>) => {
      if (!asBool(col.is_server)) return null;

      const selectedId = rowValues?.[col.key];
      if (selectedId === undefined || selectedId === null || String(selectedId).trim() === "") {
        return null;
      }

      const path = getLookupPathForColumn(col, rowValues);
      if (!path) return null;

      const options = lookupOptionsByPath[path] || [];
      return options.find((item) => String(item.id) === String(selectedId)) || null;
    },
    [getLookupPathForColumn, lookupOptionsByPath]
  );

  const getSourceLookupOption = useCallback(
    (tbl: TableCfg, rowValues: Record<string, any>, targetCol: BaseLeafColCfg) => {
      const leafCols = flattenCols(tbl.columns);
      const targetIdx = leafCols.findIndex((c) => c.key === targetCol.key);

      const candidateKeys: string[] = [];

      if (targetCol.value_from) {
        candidateKeys.push(targetCol.value_from);
      }

      for (let i = targetIdx - 1; i >= 0; i--) {
        if (asBool(leafCols[i].is_server)) {
          candidateKeys.push(leafCols[i].key);
        }
      }

      const seen = new Set<string>();

      for (const key of candidateKeys) {
        if (!key || seen.has(key)) continue;
        seen.add(key);

        const sourceCol = leafCols.find((c) => c.key === key);
        if (!sourceCol) continue;

        const selected = getSelectedLookupOption(sourceCol, rowValues);
        if (!selected) continue;

        if (!targetCol.value_key) return selected;

        if (selected[targetCol.value_key] !== undefined && selected[targetCol.value_key] !== null) {
          return selected;
        }
      }

      return null;
    },
    [getSelectedLookupOption]
  );

  const applyConfiguredRowRules = useCallback(
    (tbl: TableCfg, rawRow: Record<string, any>) => {
      const nextRow = { ...(rawRow || {}) };
      const leafCols = flattenCols(tbl.columns);

      leafCols.forEach((col) => {
        if (!asBool(col.is_server)) return;

        const currentValue = nextRow[col.key];
        if (
          currentValue === undefined ||
          currentValue === null ||
          String(currentValue).trim() === ""
        ) {
          return;
        }

        const path = getLookupPathForColumn(col, nextRow);
        if (!path) {
          nextRow[col.key] = "";
          return;
        }

        const options = lookupOptionsByPath[path] || [];
        if (options.length && !options.some((item) => String(item.id) === String(currentValue))) {
          nextRow[col.key] = "";
        }
      });

      leafCols.forEach((col) => {
        if (!col.value_key) return;
        const source = getSourceLookupOption(tbl, nextRow, col);
        nextRow[col.key] = source?.[col.value_key] ?? "";
      });

      return nextRow;
    },
    [getLookupPathForColumn, getSourceLookupOption, lookupOptionsByPath]
  );

  useEffect(() => {
    if (!formConfig) return;

    let cancelled = false;

    const loadNeededOptions = async () => {
      const seenPaths = new Set<string>();

      for (const sec of formConfig.sections || []) {
        if (!meets(answers, sec.visible_if)) continue;

        for (const tbl of sec.tables || []) {
          if (!meets(answers, tbl.visible_if)) continue;

          const rows = Array.isArray(answers[tbl.key]) ? answers[tbl.key] : [];
          const leafCols = flattenCols(tbl.columns);

          for (const row of rows) {
            for (const col of leafCols) {
              if (!asBool(col.is_server) || !col.api) continue;

              const path = getLookupPathForColumn(col, row || {});
              if (!path || seenPaths.has(path)) continue;

              seenPaths.add(path);

              if (cancelled) return;
              await ensureLookupOptions(path);
            }
          }
        }
      }
    };

    void loadNeededOptions();

    return () => {
      cancelled = true;
    };
  }, [answers, formConfig, ensureLookupOptions, getLookupPathForColumn]);

  useEffect(() => {
    if (!formConfig) return;

    setAnswers((prev) => {
      let changed = false;
      let nextAnswers = prev;

      for (const sec of formConfig.sections || []) {
        if (!meets(nextAnswers, sec.visible_if)) continue;

        for (const tbl of sec.tables || []) {
          if (!meets(nextAnswers, tbl.visible_if)) continue;

          const rows = Array.isArray(nextAnswers[tbl.key]) ? nextAnswers[tbl.key] : [];
          let tableChanged = false;

          const nextRows = rows.map((row: any) => {
            const computed = applyConfiguredRowRules(tbl, row || {});
            if (rowChanged(row || {}, computed)) {
              tableChanged = true;
              return computed;
            }
            return row;
          });

          if (tableChanged) {
            changed = true;
            nextAnswers = { ...nextAnswers, [tbl.key]: nextRows };
          }
        }
      }

      return changed ? nextAnswers : prev;
    });
  }, [formConfig, lookupOptionsByPath, applyConfiguredRowRules, setAnswers]);

  return {
    lookupOptionsByPath,
    lookupLoadingByPath,
    lookupErrorsByPath,
    getLookupPathForColumn,
    getSelectedLookupOption,
    applyConfiguredRowRules,
    resetLookupState,
  };
}