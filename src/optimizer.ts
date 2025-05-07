// Import decorations data from JSON file
import decorationsData from "./decorations.json";

// Define types for decorations and town results
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

// Main function to optimize decorations for towns
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

          // Debugging logs for decoration assignment
          console.log(`Attempting to add decoration: ${decoration.name}`);
          console.log(`Current totals - Green: ${townResult.green}, Blue: ${townResult.blue}, Red: ${townResult.red}`);
          console.log(`New totals if added - Green: ${newGreen}, Blue: ${newBlue}, Red: ${newRed}`);

          // Stop assigning decorations if all totals exceed 1000
          if (newGreen > 1000 && newBlue > 1000 && newRed > 1000) {
            console.log(`Stopping assignment for ${town} as all totals exceed 1000.`);
            break;
          }

          // Update town totals and add decoration
          townResult.green = newGreen;
          townResult.blue = newBlue;
          townResult.red = newRed;
          townResult.decorations.push({ name: decoration.name, quantity: 1 });
          decoration.quantity--;

          console.log(`Added decoration: ${decoration.name}`);
          console.log(`Updated totals - Green: ${townResult.green}, Blue: ${townResult.blue}, Red: ${townResult.red}`);
        }
      });

      // Check for Meadow condition (green or red near 1000)
      if (
        (townResult.green >= 997 && townResult.green <= 999) &&
        meadow &&
        meadow.quantity > 0
      ) {
        console.log(`Adding Meadow to ${town} due to green total: ${townResult.green}`);
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
        console.log(`Adding Meadow to ${town} due to red total: ${townResult.red}`);
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
        console.log(`Adding Snowflake to ${town} due to blue total: ${townResult.blue}`);
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
        console.log(`Adding Meadow to ${town} due to green total: ${townResult.green}`);
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
        console.log(`Adding Meadow to ${town} due to red total: ${townResult.red}`);
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
        console.log(`Adding Snowflake to ${town} due to blue total: ${townResult.blue}`);
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
