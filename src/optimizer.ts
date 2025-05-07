import decorationsData from "./decorations.json";

type Decoration = {
  name: string;
  category: string;
  green: number;
  blue: number;
  red: number;
};

type TownResult = {
  green: number;
  blue: number;
  red: number;
  decorations: { name: string; quantity: number }[];
};

export function optimizeDecorations(
  towns: string[],
  decorationQuantities: Record<string, number>,
  valhallaOnly: boolean
) {
  const results: Record<string, TownResult> = {};

  towns.forEach((town) => {
    results[town] = {
      green: 0,
      blue: 0,
      red: 0,
      decorations: [],
    };
  });

  const decorations = Object.entries(decorationQuantities)
    .map(([name, quantity]) => {
      const decorationData = decorationsData.find((d) => d.name === name);
      return decorationData ? { ...decorationData, quantity } : null;
    })
    .filter(Boolean) as (Decoration & { quantity: number })[];

  if (valhallaOnly) {
    // Filter Valhalla items for Evergarden and exclude them from other towns
    const valhallaDecorations = decorations.filter(
      (decoration) => decoration.category === "Valhalla"
    );
    const nonValhallaDecorations = decorations.filter(
      (decoration) => decoration.category !== "Valhalla"
    );

    towns.forEach((town) => {
      const townResult = results[town];

      const applicableDecorations =
        town === "evergarden" ? valhallaDecorations : nonValhallaDecorations;

      applicableDecorations.sort((a, b) => {
        const aBalance =
          Math.abs(townResult.green + a.green - (townResult.blue + a.blue)) +
          Math.abs(townResult.green + a.green - (townResult.red + a.red)) +
          Math.abs(townResult.blue + a.blue - (townResult.red + a.red));
        const bBalance =
          Math.abs(townResult.green + b.green - (townResult.blue + b.blue)) +
          Math.abs(townResult.green + b.green - (townResult.red + b.red)) +
          Math.abs(townResult.blue + b.blue - (townResult.red + b.red));
        return aBalance - bBalance; // Sort by balance improvement
      });

      applicableDecorations.forEach((decoration) => {
        while (
          decoration.quantity > 0 &&
          townResult.green + decoration.green <= 1000 &&
          townResult.blue + decoration.blue <= 1000 &&
          townResult.red + decoration.red <= 1000
        ) {
          townResult.green += decoration.green;
          townResult.blue += decoration.blue;
          townResult.red += decoration.red;
          townResult.decorations.push({ name: decoration.name, quantity: 1 });
          decoration.quantity--;
        }
      });
    });
  } else {
    // Original logic for distributing decorations
    towns.forEach((town) => {
      const townResult = results[town];

      decorations.sort((a, b) => {
        const aBalance =
          Math.abs(townResult.green + a.green - (townResult.blue + a.blue)) +
          Math.abs(townResult.green + a.green - (townResult.red + a.red)) +
          Math.abs(townResult.blue + a.blue - (townResult.red + a.red));
        const bBalance =
          Math.abs(townResult.green + b.green - (townResult.blue + b.blue)) +
          Math.abs(townResult.green + b.green - (townResult.red + b.red)) +
          Math.abs(townResult.blue + b.blue - (townResult.red + b.red));
        return aBalance - bBalance; // Sort by balance improvement
      });

      decorations.forEach((decoration) => {
        while (
          decoration.quantity > 0 &&
          townResult.green + decoration.green <= 1000 &&
          townResult.blue + decoration.blue <= 1000 &&
          townResult.red + decoration.red <= 1000
        ) {
          townResult.green += decoration.green;
          townResult.blue += decoration.blue;
          townResult.red += decoration.red;
          townResult.decorations.push({ name: decoration.name, quantity: 1 });
          decoration.quantity--;
        }
      });
    });
  }

  return results;
}
