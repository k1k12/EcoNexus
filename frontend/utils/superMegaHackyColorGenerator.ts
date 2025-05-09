// this mega cool color generator creates colors based on material's name.
// as long as material names stay the same, generated colors will also stay the same
export const generateColor = (material: string) => {
  // Simple hash function to generate a unique color based on the material name
  let hash = 0;
  material = material.toLowerCase();
  for (let i = 0; i < material.length; i++) {
    hash = material.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Use the hash to generate a color
  const color = `hsl(${hash % 360}, 40%, 50%)`;
  return color;
};
