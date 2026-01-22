"use client";

import React from "react";
import { ChevronUp, ChevronDown, Plus, Info } from "lucide-react";

type Props = {
  filterOpen: boolean;
  setFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onAddStudent: () => void;
};

export default function CommunityActionBar({ filterOpen, setFilterOpen, onAddStudent }: Props) {
  return (
    <div className="community-action-bar">
      <button
        className="community-action-btn"
        onClick={() => setFilterOpen((p) => !p)}
        aria-expanded={filterOpen}
        type="button"
      >
        {filterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {filterOpen ? "Hide filter" : "Show filter"}
      </button>

      <button
        className="community-action-btn"
        type="button"
        onClick={onAddStudent}
      >
        <Plus size={16} />
        Add Student
      </button>

      <div className="community-action-msg" role="note">
        <Info size={18} />
        <span className="community-action-msg-text">
          Aanii, Boozhoo, Wachéye, Sago! We welcome you to add and/or edit any information in the
          Shingwauk student list that is missing or inaccurate. Chi-miigwetch!
        </span>
      </div>
    </div>
  );
}
