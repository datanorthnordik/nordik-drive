import React from "react";
import {
  color_secondary,
  color_blue_lightest,
  color_blue_light,
  color_blue_lighter,
  color_white,
  color_border,
  color_secondary_dark,
  color_black_light,
} from "../../constants/colors";

export default function DataGridStyles() {
  return (
    <style>
      {`
          .ag-theme-quartz .bold-header {
            font-size: 1.1rem !important;
            font-weight: bold !important;
            background-color: ${color_blue_lightest} !important;
            color: ${color_secondary} !important;
          }
          .ag-theme-quartz .ag-row-selected {
            background-color: ${color_blue_light} !important;
            font-weight: bold;
          }
          .ag-theme-quartz .ag-row:hover {
            background-color: ${color_blue_lighter} !important;
          }
          .ag-theme-quartz .ag-paging-panel {
            display: none !important;
          }
          .mobile-filter-button { display: none; }
          .left-panel { display: block; }
          @media (max-width: 900px) {
            .mobile-filter-button { display: inline-flex !important; align-items:center; justify-content:center; }
            .left-panel { display: none !important; }
          }
          @media (min-width: 900px) and (max-width: 1200px) {
            .left-panel {
              flex: 0 0 40% !important;
              max-width: 40% !important;
            }
          }
          .ag-pinned-left-cols-container,
          .ag-pinned-left-header {
            width: max-content !important;
          }
           
            
                    
          .ag-theme-quartz .ag-cell {
       font-weight: bold !important;
   }
       .top-controls-bar {
        scrollbar-width: none;          /* Firefox */
        -ms-overflow-style: none;       /* IE/Edge legacy */
        }
        .top-controls-bar::-webkit-scrollbar {
        display: none;                  /* Chrome/Safari */
        }

        .nia-slot {
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        position: relative;
        z-index: 2;                     /* keeps it above neighbors if any overlap happens */
        }

        .nia-slot > * {
        display: flex;
        align-items: center;
        }

        .community-action-left {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
        }

        .community-action-btn:focus-visible {
        outline: 3px solid ${color_blue_light};
        outline-offset: 2px;
        }

        .community-action-bar {
  display: flex;
  align-items: stretch;          /* ✅ makes buttons match message height */
  gap: 8px;
  margin-bottom: 8px;

  padding: 6px;                  /* ✅ reduced height */
  border-radius: 10px;
  background: ${color_white};
  border: 1px solid ${color_border};
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);

  flex-wrap: wrap;               /* ✅ lets message wrap cleanly */
}

.community-action-btn {
  align-self: stretch;           /* ✅ match the tallest item */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  padding: 0 14px;               /* ✅ reduced height (no vertical padding) */
  min-height: 36px;              /* ✅ compact baseline height */
  border-radius: 8px;

  background: ${color_secondary};
  color: ${color_white};
  border: none;
  cursor: pointer;
  white-space: nowrap;

  font-size: 13px;
  font-weight: 900;
  line-height: 1;
}

.community-action-btn:hover {
  background: ${color_secondary_dark};
}

.community-action-msg {
  flex: 1 1 520px;
  min-width: 280px;

  align-self: stretch;           /* ✅ same height as buttons */
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 6px 12px;             /* ✅ reduced height */
  border-radius: 8px;

  background: ${color_blue_lightest};
  border: 1px solid ${color_blue_light};
  color: ${color_black_light};

  font-size: 13px;
  font-weight: 800;
  line-height: 1.25;
}

.community-action-msg-text {
  white-space: normal;           /* ✅ show full text */
  overflow: visible;
  text-overflow: clip;
}

        .community-action-msg-icon {
        width: 22px;
        height: 22px;
        border-radius: 999px;
        background: ${color_white};
        border: 1px solid ${color_border};
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: ${color_secondary};
        flex-shrink: 0;
        }

        @media (max-width: 900px) {
            .community-action-bar {
                flex-wrap: wrap;
            }
            .community-action-msg {
                flex: 1 1 100%;
                min-width: 100%;
            }
        }

        /* Responsive: allow message to wrap below buttons when space is tight */
        @media (max-width: 900px) {
        .community-action-bar {
            flex-wrap: wrap;
        }
        .community-action-msg {
            flex: 1 1 100%;
        }
        }
      `}
    </style>
  );
}
