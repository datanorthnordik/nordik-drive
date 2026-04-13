import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedCommunities } from "../../store/auth/fileSlice";
import {
  color_text_primary,
  color_border,
  color_background,
} from "../../constants/colors";
import {
  COMMUNITY_FILTER_ACCENT,
  COMMUNITY_FILTER_COLORS,
  COMMUNITY_FILTER_LAYOUT,
} from "./constants";
import {
  COMMUNITY_FILTER_MESSAGES,
  getSelectVisibleAriaLabel,
  getSelectVisibleLabel,
  getSelectedCountAriaLabel,
} from "./messages";

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
      aria-label={COMMUNITY_FILTER_MESSAGES.panelAriaLabel}
      style={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        background: color_background,
        borderRadius: COMMUNITY_FILTER_LAYOUT.panelBorderRadius,
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
          zIndex: COMMUNITY_FILTER_LAYOUT.headerZIndex,
          background: color_background,
          borderBottom: `1px solid ${color_border}`,
          padding: "8px 10px",
        }}
      >
        {/* title row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: COMMUNITY_FILTER_LAYOUT.sectionGap,
          }}
        >
          <div
            style={{
              fontSize: COMMUNITY_FILTER_LAYOUT.titleFontSize,
              fontWeight: COMMUNITY_FILTER_LAYOUT.titleFontWeight,
              flex: 1,
            }}
          >
            {COMMUNITY_FILTER_MESSAGES.title}
          </div>

          {showClose && onClose && (
            <button
              aria-label={COMMUNITY_FILTER_MESSAGES.closeLabel}
              onClick={onClose}
              style={{
                width: COMMUNITY_FILTER_LAYOUT.closeButtonSize,
                height: COMMUNITY_FILTER_LAYOUT.closeButtonSize,
                borderRadius: COMMUNITY_FILTER_LAYOUT.closeButtonRadius,
                border: `1px solid ${color_border}`,
                background: COMMUNITY_FILTER_COLORS.surface,
                cursor: "pointer",
                fontSize: COMMUNITY_FILTER_LAYOUT.closeButtonFontSize,
                lineHeight: "18px",
                color: COMMUNITY_FILTER_COLORS.closeButtonText,
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
            aria-label={COMMUNITY_FILTER_MESSAGES.searchAriaLabel}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            style={{
              width: "100%",
              height: COMMUNITY_FILTER_LAYOUT.searchInputHeight,
              padding: "0 10px",
              borderRadius: COMMUNITY_FILTER_LAYOUT.actionButtonBorderRadius,
              border: `1px solid ${color_border}`,
              fontSize: COMMUNITY_FILTER_LAYOUT.searchInputFontSize,
              outline: "none",
              boxSizing: "border-box",
              background: COMMUNITY_FILTER_COLORS.surface,
            }}
          />
        </div>

        {/* actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: COMMUNITY_FILTER_LAYOUT.sectionGap,
            marginTop: 8,
          }}
        >
          <button
            type="button"
            onClick={selectAllVisible}
            style={{
              height: COMMUNITY_FILTER_LAYOUT.actionButtonHeight,
              padding: "0 10px",
              borderRadius: COMMUNITY_FILTER_LAYOUT.actionButtonBorderRadius,
              background: COMMUNITY_FILTER_ACCENT,
              color: COMMUNITY_FILTER_COLORS.surface,
              border: "none",
              cursor: "pointer",
              fontSize: COMMUNITY_FILTER_LAYOUT.actionButtonFontSize,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
            aria-label={getSelectVisibleAriaLabel(filtered.length)}
          >
            {getSelectVisibleLabel(filtered.length)}
          </button>

          <button
            type="button"
            onClick={clearSelection}
            style={{
              height: COMMUNITY_FILTER_LAYOUT.actionButtonHeight,
              padding: "0 10px",
              borderRadius: COMMUNITY_FILTER_LAYOUT.actionButtonBorderRadius,
              background: COMMUNITY_FILTER_COLORS.surface,
              color: COMMUNITY_FILTER_ACCENT,
              border: `1px solid ${COMMUNITY_FILTER_ACCENT}`,
              cursor: "pointer",
              fontSize: COMMUNITY_FILTER_LAYOUT.actionButtonFontSize,
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
            aria-label={COMMUNITY_FILTER_MESSAGES.clearAriaLabel}
          >
            {COMMUNITY_FILTER_MESSAGES.clearLabel}
          </button>

          <div
            style={{
              marginLeft: "auto",
              fontSize: COMMUNITY_FILTER_LAYOUT.countFontSize,
              fontWeight: COMMUNITY_FILTER_LAYOUT.countFontWeight,
              whiteSpace: "nowrap",
            }}
            aria-label={getSelectedCountAriaLabel(selected.length)}
          >
            {COMMUNITY_FILTER_MESSAGES.selectedLabel}{" "}
            <span
              style={{
                color: COMMUNITY_FILTER_ACCENT,
                fontWeight: COMMUNITY_FILTER_LAYOUT.selectedCountFontWeight,
              }}
            >
              {selected.length}
            </span>
          </div>
        </div>
      </div>

      {/* List area */}
      <div
        role="listbox"
        aria-label={COMMUNITY_FILTER_MESSAGES.listboxAriaLabel}
        aria-multiselectable="true"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          background: COMMUNITY_FILTER_COLORS.surface,
          padding: COMMUNITY_FILTER_LAYOUT.listPadding,
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              color: COMMUNITY_FILTER_COLORS.emptyStateText,
              padding: 10,
              fontSize: COMMUNITY_FILTER_LAYOUT.listItemFontSize,
            }}
          >
            {COMMUNITY_FILTER_MESSAGES.emptyState}
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
                  gap: COMMUNITY_FILTER_LAYOUT.listItemGap,
                  padding: "8px 10px",
                  marginBottom: 6,
                  cursor: "pointer",
                  borderRadius: COMMUNITY_FILTER_LAYOUT.listItemBorderRadius,
                  border: `1px solid ${checked ? COMMUNITY_FILTER_ACCENT : color_border}`,
                  background: checked
                    ? COMMUNITY_FILTER_COLORS.selectedItemBackground
                    : COMMUNITY_FILTER_COLORS.surface,
                }}
                aria-checked={checked}
                aria-selected={checked}
                role="option"
                title={c}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(c)}
                  aria-checked={checked}
                  style={{
                    transform: `scale(${COMMUNITY_FILTER_LAYOUT.checkboxScale})`,
                    width: COMMUNITY_FILTER_LAYOUT.checkboxSize,
                    height: COMMUNITY_FILTER_LAYOUT.checkboxSize,
                    margin: 0,
                    accentColor: COMMUNITY_FILTER_ACCENT,
                    flexShrink: 0,
                  } as React.CSSProperties}
                />

                <span
                  style={{
                    userSelect: "none",
                    fontSize: COMMUNITY_FILTER_LAYOUT.listItemFontSize,
                    lineHeight: 1.2,
                    color: checked
                      ? COMMUNITY_FILTER_COLORS.selectedItemText
                      : color_text_primary,
                    fontWeight: checked
                      ? COMMUNITY_FILTER_LAYOUT.listItemCheckedFontWeight
                      : COMMUNITY_FILTER_LAYOUT.listItemFontWeight,
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
