'use client';
import React, { useMemo } from "react";
import { Box, Chip, Typography } from "@mui/material";

type SmartSearchSuggestionsProps = {
  query: string;
  rowData: any[];
  hasResults: boolean; // true if quick filter found something
  maxSuggestions?: number;
  minQueryLength?: number;
  onPick: (value: string) => void; // when user clicks suggestion
};

/**
 * SmartSearchSuggestions
 * - If search returns 0 rows, suggest very similar values from ANY field.
 * - Example: query "atul" -> suggests "Athul"
 */
export default function SmartSearchSuggestions({
  query,
  rowData,
  hasResults,
  maxSuggestions = 6,
  minQueryLength = 2,
  onPick,
}: SmartSearchSuggestionsProps) {
  const q = (query || "").trim();

  // -------- helpers (fast + good enough for names/typos) --------
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  // Levenshtein distance
  const levenshtein = (a: string, b: string) => {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;

    const dp = new Array(n + 1);
    for (let j = 0; j <= n; j++) dp[j] = j;

    for (let i = 1; i <= m; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= n; j++) {
        const tmp = dp[j];
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[j] = Math.min(
          dp[j] + 1,      // delete
          dp[j - 1] + 1,  // insert
          prev + cost     // replace
        );
        prev = tmp;
      }
    }
    return dp[n];
  };

  const similarityScore = (queryN: string, candidateN: string) => {
    // Higher is better
    if (!queryN || !candidateN) return -Infinity;
    if (candidateN === queryN) return 999;

    // Boost startsWith and contains
    let score = 0;
    if (candidateN.startsWith(queryN)) score += 6;
    if (candidateN.includes(queryN)) score += 3;

    // Levenshtein penalty (good for typos)
    const dist = levenshtein(queryN, candidateN);
    score += Math.max(0, 6 - dist);

    // Prefer shorter candidates for short queries
    score -= Math.max(0, candidateN.length - queryN.length) * 0.05;

    return score;
  };

  // -------- gather candidates from ALL fields --------
  const suggestions = useMemo(() => {
    // only show suggestions when: no results and query has some length
    if (hasResults) return [];
    if (q.length < minQueryLength) return [];
    if (!rowData || rowData.length === 0) return [];

    const queryN = normalize(q);

    // Collect unique string values across all fields (limit scanning for performance)
    const unique = new Map<string, string>(); // normalized -> original best
    const MAX_ROWS_SCAN = 1500; // keep it safe for big sheets
    const rowsToScan = rowData.slice(0, MAX_ROWS_SCAN);

    for (const row of rowsToScan) {
      if (!row) continue;
      for (const v of Object.values(row)) {
        if (v === null || v === undefined) continue;

        const raw = String(v).trim();
        if (!raw) continue;

        // ignore long blobs
        if (raw.length > 80) continue;

        // remove bracket source marker: "Athul (CSA)" -> "Athul"
        const match = raw.match(/^(.*?)\s*(\(([^)]*)\))?$/);
        const cleaned = (match?.[1] || "").trim();
        if (!cleaned) continue;

        const norm = normalize(cleaned);
        if (!norm) continue;

        // keep first-seen original (or you can choose shortest)
        if (!unique.has(norm)) unique.set(norm, cleaned);
      }
    }

    // Score candidates
    const scored = Array.from(unique.entries())
      .map(([norm, original]) => ({
        value: original,
        norm,
        score: similarityScore(queryN, norm),
      }))
      .filter((x) => x.score >= 4); // threshold controls noise

    scored.sort((a, b) => b.score - a.score);

    // de-dupe display (case-insensitive)
    const out: string[] = [];
    const seen = new Set<string>();
    for (const item of scored) {
      const key = normalize(item.value);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item.value);
      if (out.length >= maxSuggestions) break;
    }

    return out;
  }, [q, rowData, hasResults, maxSuggestions, minQueryLength]);

  if (suggestions.length === 0) return null;

  return (
    <Box
      sx={{
        mt: 1,
        mb: 1,
        p: 1,
        borderRadius: 2,
        background: "rgba(25, 118, 210, 0.06)",
        border: "1px solid rgba(25, 118, 210, 0.18)"
      }}
    >
      <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", mb: 0.75 }}>
        No exact matches. Are you looking for:
      </Typography>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {suggestions.map((s) => (
          <Chip
            key={s}
            label={s}
            onClick={() => onPick(s)}
            sx={{ fontWeight: 700 }}
            clickable
          />
        ))}
      </Box>
    </Box>
  );
}
