// Map each color theme to a brand profile key
// Example: gold -> lcorpnet, blue -> wcorpnet
export const themeBrandMap = {
  gold: 'lcorpnet',
  blue: 'wcorpnet',
  green: 'tcorpnet',
  red: 'zweinet',
  purple: 'default',
  cyan: 'default',
  orange: 'default',
  pink: 'default'
};

export function getThemeForBrand(brandKey) {
  const entry = Object.entries(themeBrandMap).find(([, b]) => b === brandKey);
  return entry ? entry[0] : null;
}
