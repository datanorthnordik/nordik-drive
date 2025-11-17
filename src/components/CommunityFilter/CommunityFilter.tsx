import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedCommunities } from "../../store/auth/fileSlice";
import { color_secondary, color_text_primary, color_border, color_background } from "../../constants/colors";

const ACCENT = color_secondary; // use app-wide secondary color

type CommunityFilterProps = {
  onClose?: () => void;
  showClose?: boolean; // render a close X in header when true
};

const CommunityFilter: React.FC<CommunityFilterProps> = (props) => {
    // support optional props for overlay/close behavior
    const dispatch = useDispatch();
    const communities: string[] = useSelector((state: any) => state.file?.communities ?? []);
    const selected: string[] = useSelector((state: any) => state.file?.selectedCommunities ?? []);
    const [query, setQuery] = useState("");

    const firstRenderRef = useRef(true);
    useEffect(() => {
        if (firstRenderRef.current) {
            firstRenderRef.current = false;
        }
    }, [communities]);

    // dispatch selection updates to redux (no localStorage)
    const updateSelected = useCallback((next: string[]) => {
        dispatch(setSelectedCommunities({ selected: next }));
    }, [dispatch]);

    // sanitize selected when communities list changes: drop selections that no longer exist
    useEffect(() => {
        if (!selected || selected.length === 0) return;
        const setCommunities = new Set(communities);
        const sanitized = selected.filter(s => setCommunities.has(s));
        if (sanitized.length !== selected.length) {
            updateSelected(sanitized);
        }
    }, [communities, selected, updateSelected]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return communities;
        return communities.filter(c => String(c).toLowerCase().includes(q));
    }, [communities, query]);

    const toggle = useCallback((community: string) => {
        const next = selected.includes(community)
            ? selected.filter(c => c !== community)
            : [...selected, community];
        updateSelected(next);
    }, [selected, updateSelected]);

    const selectAllVisible = useCallback(() => {
        const setPrev = new Set(selected);
        filtered.forEach(c => setPrev.add(c));
        updateSelected(Array.from(setPrev));
    }, [filtered, selected, updateSelected]);

    const clearSelectionRedux = useCallback(() => updateSelected([]), [updateSelected]);

    return (
        <div
            style={{
                padding: 14,
                width: "100%",
                boxSizing: "border-box",
                fontSize: 16,
                color: color_text_primary,
                background: color_background,
                borderRadius: 10,
                transition: "transform 220ms ease, opacity 220ms ease",
            }}
            aria-label="Community filter panel"
        >
            {/* header with optional close button for overlay/desktop collapse */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18, color: color_text_primary, flex: 1 }}>Community Filter</h3>
                {props.showClose && props.onClose && (
                    <button
                        aria-label="Close filter"
                        onClick={props.onClose}
                        style={{
                            border: "none",
                            background: "transparent",
                            color: ACCENT,
                            fontSize: 18,
                            cursor: "pointer",
                            padding: "6px 8px",
                            borderRadius: 8,
                        }}
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* rest of panel */}
            <div style={{ marginBottom: 12 }}>
                <input
                    aria-label="Search communities"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search communities..."
                    style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: `1px solid ${color_border}`,
                        fontSize: 16,
                        outline: "none",
                    }}
                />
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center" }}>
                <button
                    type="button"
                    onClick={selectAllVisible}
                    style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: ACCENT,
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 15,
                    }}
                    aria-label={`Select visible communities (${filtered.length})`}
                >
                    Select visible ({filtered.length})
                </button>

                <button
                    type="button"
                    onClick={clearSelectionRedux}
                    style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: "#fff",
                        color: ACCENT,
                        border: `1px solid ${ACCENT}`,
                        cursor: "pointer",
                        fontSize: 15,
                    }}
                    aria-label="Clear selected communities"
                >
                    Clear
                </button>

                <div style={{ marginLeft: "auto", alignSelf: "center", fontSize: 15 }}>
                    Selected: <strong style={{ color: ACCENT }}>{selected.length}</strong>
                </div>
            </div>

            <div
                role="list"
                aria-label="Community list"
                style={{
                    maxHeight: 360,
                    overflow: "auto",
                    border: `1px solid ${color_border}`,
                    borderRadius: 10,
                    padding: 10,
                    background: "#fff",
                }}
            >
                {filtered.length === 0 ? (
                    <div style={{ color: "#666", padding: 10 }}>No communities found.</div>
                ) : (
                    filtered.map((c) => {
                        const checked = selected.includes(c);
                        return (
                            <label
                                key={c}
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c); } }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 14,
                                    padding: "12px 10px",
                                    cursor: "pointer",
                                    borderRadius: 8,
                                    marginBottom: 6,
                                    background: checked ? "#fff5f6" : "transparent",
                                    border: checked ? `1px solid ${ACCENT}` : `1px solid transparent`,
                                }}
                                aria-checked={checked}
                                role="option"
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggle(c)}
                                    aria-checked={checked}
                                    style={{
                                        transform: "scale(1.4)",
                                        width: 20,
                                        height: 20,
                                        margin: 0,
                                        accentColor: ACCENT,
                                    } as React.CSSProperties}
                                />
                                <span style={{
                                    userSelect: "none",
                                    fontSize: 17,
                                    color: checked ? ACCENT : color_text_primary,
                                    fontWeight: checked ? 700 : 600,
                                }}>{c}</span>
                            </label>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default CommunityFilter;