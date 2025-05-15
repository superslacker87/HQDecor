// Home Quest Decor Helper - Optimization Logic
// Contains functions for distributing decorations across towns using different strategies

import decorationsData from "./decorations.json";
import decorations from "./decorations.json";

// Type definitions for decorations and optimization results
// Decoration: represents a single decoration's properties
// TownResult: represents the result for a single town

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

// Maximum Optimization: Fills up one town at a time before moving to the next
export function optimizeDecorations(
  towns: string[],
  decorationQuantities: Record<string, number>,
  valhallaOnly: boolean
) {
  const results: Record<string, TownResult> = {};

  // Initialize results for each town
  towns.forEach((town) => {
    results[town] = {
      green: 0,
      blue: 0,
      red: 0,
      decorations: [],
    };
  });

  // Map decoration quantities to their respective data
  const decorations = Object.entries(decorationQuantities)
    .map(([name, quantity]) => {
      const decorationData = decorationsData.find((d) => d.name === name);
      return decorationData ? { ...decorationData, quantity } : null;
    })
    .filter(Boolean) as (Decoration & { quantity: number })[];

  // Find specific decorations (Meadow and Snowflake)
  const meadow = decorations.find((decoration) => decoration.name === "Meadow");
  const snowflake = decorations.find((decoration) => decoration.name === "Snowflake");

  if (valhallaOnly) {
    // Filter decorations for Evergarden (Valhalla only) and other towns
    const valhallaDecorations = decorations.filter(
      (decoration) => decoration.category === "Valhalla"
    );
    const nonValhallaDecorations = decorations.filter(
      (decoration) => decoration.category !== "Valhalla"
    );

    // Assign decorations to towns
    towns.forEach((town) => {
      const townResult = results[town];

      // Determine applicable decorations based on town type
      const applicableDecorations =
        town === "evergarden" ? valhallaDecorations : nonValhallaDecorations;

      // Sort decorations to optimize balance
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

      // Assign decorations to the town while respecting limits
      applicableDecorations.forEach((decoration) => {
        while (decoration.quantity > 0) {
          const newGreen = townResult.green + decoration.green;
          const newBlue = townResult.blue + decoration.blue;
          const newRed = townResult.red + decoration.red;

          // Stop assigning decorations if any total exceeds 1000 (Valhalla-only mode)
          if (newGreen > 1000 || newBlue > 1000 || newRed > 1000) {
            break;
          }

          // Update town totals and add decoration
          townResult.green = newGreen;
          townResult.blue = newBlue;
          townResult.red = newRed;
          townResult.decorations.push({ name: decoration.name, quantity: 1 });
          decoration.quantity--;
        }
      });

      // Check for Meadow condition (green or red near 1000)
      if (
        (townResult.green >= 997 && townResult.green <= 999) &&
        meadow &&
        meadow.quantity > 0
      ) {
        townResult.green += meadow.green;
        townResult.blue += meadow.blue;
        townResult.red += meadow.red;
        townResult.decorations.push({ name: "Meadow", quantity: 1 });
        meadow.quantity--;
      }

      if (
        (townResult.red >= 997 && townResult.red <= 999) &&
        meadow &&
        meadow.quantity > 0
      ) {
        townResult.green += meadow.green;
        townResult.blue += meadow.blue;
        townResult.red += meadow.red;
        townResult.decorations.push({ name: "Meadow", quantity: 1 });
        meadow.quantity--;
      }

      // Check for Snowflake condition (blue near 1000)
      if (
        (townResult.blue >= 996 && townResult.blue <= 999) &&
        snowflake &&
        snowflake.quantity > 0
      ) {
        townResult.green += snowflake.green;
        townResult.blue += snowflake.blue;
        townResult.red += snowflake.red;
        townResult.decorations.push({ name: "Snowflake", quantity: 1 });
        snowflake.quantity--;
      }
    });
  } else {
    // Original logic for distributing decorations
    towns.forEach((town) => {
      const townResult = results[town];

      // Sort decorations to optimize balance
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

      // Assign decorations to the town while respecting limits
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

      // Check for Meadow condition (green or red near 1000)
      if (
        (townResult.green >= 997 && townResult.green <= 999) &&
        meadow &&
        meadow.quantity > 0
      ) {
        townResult.green += meadow.green;
        townResult.blue += meadow.blue;
        townResult.red += meadow.red;
        townResult.decorations.push({ name: "Meadow", quantity: 1 });
        meadow.quantity--;
      }

      if (
        (townResult.red >= 997 && townResult.red <= 999) &&
        meadow &&
        meadow.quantity > 0
      ) {
        townResult.green += meadow.green;
        townResult.blue += meadow.blue;
        townResult.red += meadow.red;
        townResult.decorations.push({ name: "Meadow", quantity: 1 });
        meadow.quantity--;
      }

      // Check for Snowflake condition (blue near 1000)
      if (
        (townResult.blue >= 996 && townResult.blue <= 999) &&
        snowflake &&
        snowflake.quantity > 0
      ) {
        townResult.green += snowflake.green;
        townResult.blue += snowflake.blue;
        townResult.red += snowflake.red;
        townResult.decorations.push({ name: "Snowflake", quantity: 1 });
        snowflake.quantity--;
      }
    });
  }

  return results;
}

// Balanced Optimization: Distributes decorations as evenly as possible across all towns
// - Respects max 1000 per color per town
// - If valhallaOnly is true, only Valhalla decorations are used in Evergarden
// - Otherwise, Valhalla decorations can be used in any town
export function optimizeDecorationsBalanced(
  towns: string[],
  decorationQuantities: Record<string, number>,
  valhallaOnly: boolean
): Record<string, any> {
  const results: Record<string, any> = {};

  // Initialize results for each town
  towns.forEach((town) => {
    results[town] = {
      decorations: [],
      green: 0,
      blue: 0,
      red: 0,
    };
  });

  // Separate Valhalla decorations if the option is enabled
  const valhallaDecorations = Object.entries(decorationQuantities).filter(
    ([name]) => {
      const isValhalla = decorations.find(
        (d: { name: string; category: string }) =>
          d.name === name && d.category === "Valhalla"
      );
      return isValhalla;
    }
  );

  const nonValhallaDecorations = Object.entries(decorationQuantities).filter(
    ([name, quantity]) => {
      const isValhalla = decorations.find(
        (d: { name: string; category: string }) =>
          d.name === name && d.category === "Valhalla"
      );
      return !isValhalla && quantity > 0;
    }
  );

  // Distribute Valhalla decorations to Evergarden if the option is enabled
  if (valhallaOnly && towns.includes("evergarden")) {
    valhallaDecorations.forEach(([name, quantity]) => {
      const decoration = decorations.find(
        (d: { name: string }) => d.name === name
      );

      while (quantity > 0) {
        const evergardenResult = results["evergarden"];

        if (
          decoration &&
          evergardenResult.green + decoration.green <= 1000 &&
          evergardenResult.blue + decoration.blue <= 1000 &&
          evergardenResult.red + decoration.red <= 1000
        ) {
          evergardenResult.decorations.push({ name, quantity: 1 });
          evergardenResult.green += decoration.green;
          evergardenResult.blue += decoration.blue;
          evergardenResult.red += decoration.red;
          quantity--;
          decorationQuantities[name]--; // Update global pool
        } else {
          break;
        }
      }
    });
  }

  // Combine Valhalla and non-Valhalla decorations if the option is disabled
  const allDecorations = valhallaOnly
    ? nonValhallaDecorations
    : [...valhallaDecorations, ...nonValhallaDecorations];

  // Distribute decorations across all towns
  let townIndex = 0;
  allDecorations.forEach(([name, quantity]) => {
    while (quantity > 0) {
      const town = towns[townIndex];
      if (town === "evergarden" && valhallaOnly) {
        townIndex = (townIndex + 1) % towns.length;
        continue;
      }

      const townResult = results[town];
      const decoration = decorations.find(
        (d: { name: string }) => d.name === name
      );

      if (
        decoration &&
        townResult.green + decoration.green <= 1000 &&
        townResult.blue + decoration.blue <= 1000 &&
        townResult.red + decoration.red <= 1000
      ) {
        townResult.decorations.push({ name, quantity: 1 });
        townResult.green += decoration.green;
        townResult.blue += decoration.blue;
        townResult.red += decoration.red;
        quantity--;
        decorationQuantities[name]--; // Update global pool
      }

      townIndex = (townIndex + 1) % towns.length; // Rotate to the next town
    }
  });

  return results;
}
