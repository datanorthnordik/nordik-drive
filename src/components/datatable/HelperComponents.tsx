export const MAX_HEADER_CHARS = 25;


export const headerDisplay = (s: string, max = MAX_HEADER_CHARS) => {
  const str = String(s ?? "");
  return str.length > max ? str.slice(0, max) + "..." : str;
};


export const headerMinWidthPx = (charsToShow: number) => {
  const CHAR_PX = 10;  
  const ICONS_AND_PADDING = 70; 
  return charsToShow * CHAR_PX + ICONS_AND_PADDING;
};



