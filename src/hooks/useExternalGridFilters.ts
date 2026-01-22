import { useCallback } from "react";
import type { IRowNode } from "ag-grid-community";

type Args = {
  selectedCommunities: any[];
  sourceFilter: string | null;
};

export function useExternalGridFilters({ selectedCommunities, sourceFilter }: Args) {
  const isExternalFilterPresent = useCallback(() => {
    const communitiesActive = Array.isArray(selectedCommunities) && selectedCommunities.length > 0;
    return sourceFilter !== null || communitiesActive;
  }, [selectedCommunities, sourceFilter]);

  const doesExternalFilterPass = useCallback(
    (node: IRowNode<any>) => {
      const data = node.data || {};

      let passSource = true;
      if (sourceFilter) {
        const values = Object.values(data);
        passSource = values.some((val: any) => {
          if (!val) return false;
          const match = val.toString().match(/\(([^)]*)\)/);
          const bracketText = match?.[1]?.trim();
          return bracketText === sourceFilter;
        });
      }

      let passCommunity = true;
      if (Array.isArray(selectedCommunities) && selectedCommunities.length > 0) {
        const communityValue = String(data["First Nation/Community"] ?? "").trim().toLowerCase();
        const normalizedSelected = selectedCommunities.map((s: any) =>
          String(s ?? "").trim().toLowerCase()
        );
        passCommunity = normalizedSelected.includes(communityValue);
      }

      return passSource && passCommunity;
    },
    [selectedCommunities, sourceFilter]
  );

  return { isExternalFilterPresent, doesExternalFilterPass };
}
