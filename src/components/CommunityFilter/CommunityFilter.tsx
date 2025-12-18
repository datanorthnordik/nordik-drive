import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedCommunities } from "../../store/auth/fileSlice";
import {
  color_secondary,
  color_text_primary,
  color_border,
  color_background,
} from "../../constants/colors";

const ACCENT = color_secondary;

type CommunityFilterProps = {
  onClose?: () => void;
  showClose?: boolean;
};

const CommunityFilter: React.FC<CommunityFilterProps> = ({ onClose, showClose }) => {
  const dispatch = useDispatch();
  const communities: string[] = useSelector(
    (state: any) => state.file?.communities ?? []
  );
  const selected: string[] = useSelector(
    (state: any) => state.file?.selectedCommunities ?? []
  );

  const [query, setQuery] = useState("");
  const firstRenderRef = useRef(true);

  const updateSelected = useCallback(
    (next: string[]) => dispatch(setSelectedCommunities({ selected: next })),
    [dispatch]
  );

  useEffect(() => {
    if (firstRenderRef.current) firstRenderRef.current = false;
  }, [communities]);

  // sanitize selected when communities list changes
  useEffect(() => {
    if (!selected?.length) return;
    const setComm = new Set(communities);
    const sanitized = selected.filter((s) => setComm.has(s));
    if (sanitized.length !== selected.length) updateSelected(sanitized);
  }, [communities, selected, updateSelected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return communities;
    return communities.filter((c) => String(c).toLowerCase().includes(q));
  }, [communities, query]);

  const toggle = useCallback(
    (community: string) => {
      const next = selected.includes(community)
        ? selected.filter((c) => c !== community)
        : [...selected, community];
      updateSelected(next);
    },
    [selected, updateSelected]
  );

  const selectAllVisible = useCallback(() => {
    const setPrev = new Set(selected);
    filtered.forEach((c) => setPrev.add(c));
    updateSelected(Array.from(setPrev));
  }, [filtered, selected, updateSelected]);

  const clearSelection = useCallback(() => updateSelected([]), [updateSelected]);

  return (
    <div
      aria-label="Community filter panel"
      style={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        background: color_background,
        borderRadius: 12,
        border: `1px solid ${color_border}`,
        overflow: "hidden",
        color: color_text_primary,
      }}
    >
      {/* Sticky compact header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: color_background,
          borderBottom: `1px solid ${color_border}`,
          padding: "8px 10px",
        }}
      >
        {/* title row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 900, flex: 1 }}>
            Community Filter
          </div>

          {showClose && onClose && (
            <button
              aria-label="Close filter"
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                border: `1px solid ${color_border}`,
                background: "#fff",
                cursor: "pointer",
                fontSize: 18,
                lineHeight: "18px",
                color: "#111",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* search */}
        <div style={{ marginTop: 8 }}>
          <input
            aria-label="Search communities"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            style={{
              width: "100%",
              height: 36,
              padding: "0 10px",
              borderRadius: 10,
              border: `1px solid ${color_border}`,
              fontSize: 15,
              outline: "none",
              boxSizing: "border-box",
              background: "#fff",
            }}
          />
        </div>

        {/* actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 8,
          }}
        >
          <button
            type="button"
            onClick={selectAllVisible}
            style={{
              height: 34,
              padding: "0 10px",
              borderRadius: 10,
              background: ACCENT,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
            aria-label={`Select visible communities (${filtered.length})`}
          >
            Select ({filtered.length})
          </button>

          <button
            type="button"
            onClick={clearSelection}
            style={{
              height: 34,
              padding: "0 10px",
              borderRadius: 10,
              background: "#fff",
              color: ACCENT,
              border: `1px solid ${ACCENT}`,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
            aria-label="Clear selected communities"
          >
            Clear
          </button>

          <div
            style={{
              marginLeft: "auto",
              fontSize: 14,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
            aria-label={`Selected count ${selected.length}`}
          >
            Selected:{" "}
            <span style={{ color: ACCENT, fontWeight: 1000 }}>
              {selected.length}
            </span>
          </div>
        </div>
      </div>

      {/* List area */}
      <div
        role="list"
        aria-label="Community list"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          background: "#fff",
          padding: 8,
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ color: "#666", padding: 10, fontSize: 15 }}>
            No communities found.
          </div>
        ) : (
          filtered.map((c) => {
            const checked = selected.includes(c);

            return (
              <label
                key={c}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle(c);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  marginBottom: 6,
                  cursor: "pointer",
                  borderRadius: 10,
                  border: `1px solid ${checked ? ACCENT : color_border}`,
                  background: checked ? "#f3f8ff" : "#fff",
                }}
                aria-checked={checked}
                role="option"
                title={c}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(c)}
                  aria-checked={checked}
                  style={{
                    transform: "scale(1.1)",
                    width: 16,
                    height: 16,
                    margin: 0,
                    accentColor: ACCENT,
                    flexShrink: 0,
                  } as React.CSSProperties}
                />

                <span
                  style={{
                    userSelect: "none",
                    fontSize: 15,
                    lineHeight: 1.2,
                    color: checked ? "#0d47a1" : color_text_primary,
                    fontWeight: checked ? 850 : 650,
                    wordBreak: "break-word",
                  }}
                >
                  {c}
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommunityFilter;
