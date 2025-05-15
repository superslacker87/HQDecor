import { optimizeDecorations, optimizeDecorationsBalanced } from "./optimizer";
import decorations from "./decorations.json";

function sanitizeId(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, "-"); // Replace invalid characters with hyphens
}

function saveUserData(
  towns: string[],
  decorationQuantities: Record<string, number>
) {
  const userData = { towns, decorationQuantities };
  document.cookie = `userData=${encodeURIComponent(
    JSON.stringify(userData)
  )}; path=/; max-age=31536000;`;
}

function loadUserData() {
  const cookies = document.cookie.split("; ");
  const userDataCookie = cookies.find((cookie) =>
    cookie.startsWith("userData=")
  );
  if (userDataCookie) {
    const userData = JSON.parse(
      decodeURIComponent(userDataCookie.split("=")[1])
    );
    return userData;
  }
  return null;
}

// Explicitly type all parameters and variables to resolve implicit 'any' errors
function exportToCsv(
  decorationQuantities: Record<string, number>,
  results: Record<string, { decorations: { name: string; quantity: number }[] }>,
  filename: string
) {
  const headers = [
    "Decoration Name",
    "Category",
    "Unused",
    ...Object.keys(results), // Dynamically include all town names
  ];

  const rows = Object.entries(decorationQuantities).map(([name, quantity]: [string, number]) => {
    const category = decorations.find((d: { name: string; category: string }) => d.name === name)?.category || "";
    const townQuantities = Object.keys(results).map((town: string) => {
      const townDecorations = results[town]?.decorations || [];
      const decoration = townDecorations.find((d: { name: string; quantity: number }) => d.name === name);
      return decoration ? decoration.quantity : 0;
    });
    const unused = quantity - townQuantities.reduce((sum: number, qty: number) => sum + qty, 0);

    // Debugging log to verify town quantities and unused values
    console.log(`Decoration: ${name}, Town Quantities: ${townQuantities}, Unused: ${unused}`);

    return [name, category, unused, ...townQuantities];
  });

  console.log("Updated rows for CSV export with corrected headers and rows:", rows);

  const csvContent = [headers.join(","), ...rows.map((row: (string | number)[]) => row.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Added debugging logs to trace issues with the "Unused" column during import
function importData(file: File, callback: (data: any) => void) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const content = event.target?.result as string;
      console.log("File content loaded:", content); // Debugging log

      if (file.type === "text/csv") {
        const rows = content.split(/\r?\n/).filter(Boolean);
        console.log("CSV rows:", rows); // Debugging log

        const headers = rows.shift()?.split(",") || [];
        console.log("CSV headers:", headers); // Debugging log

        const data = rows.map((row) => {
          const values = row.split(",");
          return headers.reduce((acc, header, index) => {
            acc[header.toLowerCase().replace(/ /g, "_")] = values[index];
            return acc;
          }, {} as Record<string, string>);
        });

        console.log("Mapped CSV data:", data); // Debugging log

        // Ensure the "Unused" column is correctly used for text box inputs
        data.forEach((row) => {
          const name = row.decoration_name;
          const input = document.querySelector<HTMLInputElement>(
            `#decoration-${sanitizeId(name)}`
          );
          if (input) {
            let totalQuantity = 0;
            Object.values(row).forEach((value) => {
              if (!isNaN(Number(value))) {
                totalQuantity += Number(value);
              }
            });
            console.log(`Setting input value for ${name}:`, totalQuantity); // Debugging log
            input.value = totalQuantity.toString();
          } else {
            console.warn(`Input element not found for decoration: ${name}`); // Debugging log
          }
        });

        callback(data);
      }
    } catch (error) {
      console.error("Failed to import data:", error); // Debugging log
      alert("Failed to import data: " + error);
    }
  };
  reader.readAsText(file);
}

// Fixed the regular expression by escaping parentheses and removed the unused variable
function gatherExportData() {
  const decorationQuantities = Array.from(
    document.querySelectorAll<HTMLInputElement>(".decoration-input-group input")
  ).reduce((acc, input) => {
    acc[input.name] = parseInt(input.value, 10) || 0;
    return acc;
  }, {} as Record<string, number>);

  const resultsDiv = document.querySelector<HTMLDivElement>("#results");
  const results: Record<string, any> = {};

  if (resultsDiv) {
    const townSections = resultsDiv.querySelectorAll<HTMLDivElement>(".town-result");
    townSections.forEach((section) => {
      const townName = section.querySelector("h3")?.textContent?.replace("Results for ", "") || "";
      const decorations = Array.from(section.querySelectorAll<HTMLLIElement>("li"))
        .map((li) => {
          const match = li.textContent?.match(/^(\d+)x (.+) \(/);
          return match ? { name: match[2], quantity: parseInt(match[1], 10) } : null;
        })
        .filter(Boolean);
      results[townName] = { decorations };
    });
  }

  // If results are empty, populate with optimized data
  if (Object.keys(results).length === 0) {
    const optimizationResults = optimizeDecorations(
      Array.from(document.querySelectorAll<HTMLInputElement>(".town-checkbox:checked")).map((checkbox) => checkbox.value),
      decorationQuantities,
      document.querySelector<HTMLInputElement>("#valhalla-only")?.checked || false
    );

    Object.entries(optimizationResults).forEach(([town, data]) => {
      results[town] = { decorations: data.decorations || [] };
    });
  }

  console.log("Gathered decoration quantities:", decorationQuantities);
  console.log("Gathered results:", results);

  return { decorationQuantities, results };
}

export function setupInputForm() {
  const app = document.querySelector<HTMLDivElement>("#app")!;

  app.innerHTML = `
  <header>
  <img id="header" src="hq_logo.webp" alt="Home Quest Logo">
    <h1>Home Quest Decoration Optimizer</h1>
    </header>
    <form id="decoration-form">
      <div id="towns-container">
        <h2>Select Unlocked Towns:</h2>
        <div id="towns-inputs">
          <p><label><input type="checkbox" id="select-all-towns"> Select All/None</label></p>
          <p><label><input type="checkbox" class="town-checkbox" value="town1"> Town 1</label>
          <label><input type="checkbox" class="town-checkbox" value="town2"> Town 2</label>
          <label><input type="checkbox" class="town-checkbox" value="town3"> Town 3</label>
          <label><input type="checkbox" class="town-checkbox" value="town4"> Town 4</label></p>
          <p><label><input type="checkbox" class="town-checkbox" value="evergarden"> Evergarden</label></p>
          <p><label><input type="checkbox" class="town-checkbox" value="northern1"> Northern Town 1</label>
          <label><input type="checkbox" class="town-checkbox" value="northern2"> Northern Town 2</label>
          <label><input type="checkbox" class="town-checkbox" value="northern3"> Northern Town 3</label></p>
       
        </div>
      </div>

      <div id="decorations-container">
      <p><button type="button" id="reset-values-top">Reset All Values</button></p>
        <h2>Enter Decoration Quantities:</h2>
        <div id="decoration-inputs">
          <!-- Inputs will be dynamically added here -->
        </div>
      </div>

      <div id="options-container">
        <h2>Options:</h2>
        <p><label><input type="checkbox" id="valhalla-only"> Only place Valhalla items in the Evergarden</label></p>
        <p><button type="button" id="reset-values-bottom">Reset All Values</button></p>
      </div>
      <h2>Run Tool:</h2>
      <button type="submit">Optimize</button>
    </form>
    <div id="results"></div>
  `;

  const pasteListTextarea =
    document.querySelector<HTMLTextAreaElement>("#paste-list");
  if (pasteListTextarea) pasteListTextarea.remove();

  const selectAllCheckbox =
    document.querySelector<HTMLInputElement>("#select-all-towns")!;
  const townCheckboxes =
    document.querySelectorAll<HTMLInputElement>(".town-checkbox");

  selectAllCheckbox.addEventListener("change", () => {
    const isChecked = selectAllCheckbox.checked;
    townCheckboxes.forEach((checkbox) => {
      checkbox.checked = isChecked;
    });
  });

  townCheckboxes.forEach((checkbox) => {
    const townName = checkbox.value;
    checkbox.id = `town-${sanitizeId(townName)}`; // Add id attribute
    checkbox.name = `town-${sanitizeId(townName)}`; // Add name attribute
  });

  const form = document.querySelector<HTMLFormElement>("#decoration-form")!;
  const valhallaOnlyCheckbox =
    document.querySelector<HTMLInputElement>("#valhalla-only")!;
  const resetValuesTopButton =
    document.querySelector<HTMLButtonElement>("#reset-values-top")!;
  const resetValuesBottomButton =
    document.querySelector<HTMLButtonElement>("#reset-values-bottom")!;

  function resetAllDecorationInputs() {
    const decorationInputs = document.querySelectorAll<HTMLInputElement>(
      ".decoration-input-group input"
    );
    decorationInputs.forEach((input) => {
      input.value = "0";
    });
  }

  resetValuesTopButton.addEventListener("click", resetAllDecorationInputs);
  resetValuesBottomButton.addEventListener("click", resetAllDecorationInputs);

  // Added a radio button group for selecting optimization method
  const optimizationMethodContainer = document.createElement("div");
  optimizationMethodContainer.id = "optimization-method-container";
  optimizationMethodContainer.innerHTML = `
    <h2>Optimization Method:</h2>
    <label><input type="radio" name="optimization-method" value="maximum" checked> Maximum</label>
    <label><input type="radio" name="optimization-method" value="balanced"> Balanced</label>
  `;
  form.insertBefore(optimizationMethodContainer, form.querySelector("#options-container"));

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const towns = Array.from(townCheckboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);

    const decorationQuantities = Array.from(
      document.querySelectorAll<HTMLInputElement>(
        ".decoration-input-group input"
      )
    ).reduce((acc, input) => {
      acc[input.name] = parseInt(input.value, 10) || 0;
      return acc;
    }, {} as Record<string, number>);

    saveUserData(towns, decorationQuantities);

    const selectedMethod = document.querySelector<HTMLInputElement>(
      "input[name='optimization-method']:checked"
    )?.value || "maximum";

    let results;
    if (selectedMethod === "balanced") {
      results = optimizeDecorationsBalanced(
        towns,
        decorationQuantities,
        valhallaOnlyCheckbox.checked
      );
    } else {
      results = optimizeDecorations(
        towns,
        decorationQuantities,
        valhallaOnlyCheckbox.checked
      );
    }

    // Add debugging logs to trace data output after the optimization
    console.log("Optimization results:", JSON.stringify(results, null, 2));

    if (towns.includes("evergarden")) {
      const evergardenDecorations = results["evergarden"].decorations.filter(
        (decoration: { name: string; quantity: number }) => {
          const isValhalla = decorations.find(
            (d: { name: string; category: string }) =>
              d.name === decoration.name && d.category === "Valhalla"
          );
          if (!isValhalla) {
            decorationQuantities[decoration.name] += decoration.quantity;
          }
          return isValhalla;
        }
      );

      results["evergarden"].decorations = evergardenDecorations;

      results["evergarden"].green = evergardenDecorations.reduce(
        (sum: number, decoration: { name: string; quantity: number }) => {
          const decorationData = decorations.find(
            (d: { name: string; green: number }) => d.name === decoration.name
          );
          return sum + ((decorationData?.green || 0) * decoration.quantity);
        },
        0
      );
      results["evergarden"].blue = evergardenDecorations.reduce(
        (sum: number, decoration: { name: string; quantity: number }) => {
          const decorationData = decorations.find(
            (d: { name: string; blue: number }) => d.name === decoration.name
          );
          return sum + ((decorationData?.blue || 0) * decoration.quantity);
        },
        0
      );
      results["evergarden"].red = evergardenDecorations.reduce(
        (sum: number, decoration: { name: string; quantity: number }) => {
          const decorationData = decorations.find(
            (d: { name: string; red: number }) => d.name === decoration.name
          );
          return sum + ((decorationData?.red || 0) * decoration.quantity);
        },
        0
      );
    }

    const resultsDiv = document.querySelector<HTMLDivElement>("#results")!;
    resultsDiv.innerHTML = "";

    const townNames: Record<string, string> = {
      town1: "Town 1",
      town2: "Town 2",
      town3: "Town 3",
      town4: "Town 4",
      northern1: "Northern Town 1",
      northern2: "Northern Town 2",
      northern3: "Northern Town 3",
      evergarden: "Evergarden",
    };

    towns.forEach((town) => {
      const townResult = results[town];

      if (!townResult ||
        (townResult.green === 0 &&
        townResult.blue === 0 &&
        townResult.red === 0 &&
        (!townResult.decorations || townResult.decorations.length === 0))
      ) {
        return; // Skip towns with no decorations used
      }

      const townSection = document.createElement("div");
      townSection.className = "town-result";

      const townHeader = document.createElement("h3");
      townHeader.textContent = `Results for ${townNames[town] || town}`;
      townSection.appendChild(townHeader);

      const heartValues = document.createElement("p");
      heartValues.innerHTML = `
        <strong>Green:</strong> ${townResult.green} <span style="color: green;">&#x1F49A;</span><br>
        <strong>Blue:</strong> ${townResult.blue} <span style="color: blue;">&#x1F499;</span><br>
        <strong>Red:</strong> ${townResult.red} <span style="color: red;">&#x1F497;</span>
      `;
      townSection.appendChild(heartValues);

      const decorationList = document.createElement("ul");
      const decorationTotals: Record<string, number> = {};

      townResult.decorations.forEach((decoration: { name: string; quantity: number }) => {
        if (!decorationTotals[decoration.name]) {
          decorationTotals[decoration.name] = 0;
        }
        decorationTotals[decoration.name] += decoration.quantity;
      });

      Object.entries(decorationTotals)
        .sort(([nameA], [nameB]) => {
          const inputOrder = Object.keys(decorationQuantities);
          return inputOrder.indexOf(nameA) - inputOrder.indexOf(nameB);
        })
        .forEach(([name, total]) => {
          const decoration = decorations.find((d) => d.name === name);
          const greenTotal = (decoration?.green || 0) * total;
          const blueTotal = (decoration?.blue || 0) * total;
          const redTotal = (decoration?.red || 0) * total;

          const listItem = document.createElement("li");
          listItem.innerHTML = `${total}x ${name} (<span style='color: green;'>&#x1F49A;</span> ${greenTotal}, <span style='color: blue;'>&#x1F499;</span> ${blueTotal}, <span style='color: red;'>&#x1F497;</span> ${redTotal})`;
          decorationList.appendChild(listItem);
        });

      townSection.appendChild(decorationList);
      resultsDiv.appendChild(townSection);
    });

    const unusedDecorations = decorations.map((decoration: { name: string; green: number; blue: number; red: number }) => {
      const usedQuantity = Object.values(results).flatMap((town: { decorations: { name: string; quantity: number }[] }) =>
        town.decorations.filter((d: { name: string }) => d.name === decoration.name)
      ).reduce((sum: number, d: { quantity: number }) => sum + d.quantity, 0);
      const totalQuantity = decorationQuantities[decoration.name] || 0;
      const unusedQuantity = totalQuantity - usedQuantity;
      return { ...decoration, unusedQuantity };
    }).filter((decoration: { unusedQuantity: number }) => decoration.unusedQuantity > 0);

    if (unusedDecorations.length > 0) {
      const unusedSection = document.createElement("div");
      unusedSection.className = "unused-decorations";

      const unusedHeader = document.createElement("h3");
      unusedHeader.textContent = "Unused Decorations:";
      unusedSection.appendChild(unusedHeader);

      const unusedList = document.createElement("ul");
      unusedDecorations.forEach(({ name, green, blue, red, unusedQuantity }) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `${unusedQuantity}x ${name} (<span style='color: green;'>&#x1F49A;</span> ${green * unusedQuantity}, <span style='color: blue;'>&#x1F499;</span> ${blue * unusedQuantity}, <span style='color: red;'>&#x1F497;</span> ${red * unusedQuantity})`;
        unusedList.appendChild(listItem);
      });

      unusedSection.appendChild(unusedList);
      resultsDiv.appendChild(unusedSection);
    }
  });

  const decorationInputs =
    document.querySelector<HTMLDivElement>("#decoration-inputs")!;
  let currentCategory = "";

  decorations.forEach(({ name, category, green, blue, red }) => {
    if (category !== currentCategory) {
      currentCategory = category;
      const categoryHeader = document.createElement("h3");
      categoryHeader.textContent = category;
      decorationInputs.appendChild(categoryHeader);
    }

    const inputGroup = document.createElement("div");
    inputGroup.className = "decoration-input-group";

    const label = document.createElement("label");
    label.innerHTML = `${name} (<span style='color: green;'>&#x1F49A;</span> ${green}, <span style='color: blue;'>&#x1F499;</span> ${blue}, <span style='color: red;'>&#x1F497;</span> ${red}):`;
    label.htmlFor = `decoration-${sanitizeId(name)}`;

    const input = document.createElement("input");
    input.type = "number";
    input.id = `decoration-${sanitizeId(name)}`;
    input.name = name;
    input.min = "0";
    input.value = "0";

    inputGroup.appendChild(label);
    inputGroup.appendChild(input);
    decorationInputs.appendChild(inputGroup);
  });

  const userData = loadUserData();
  if (userData) {
    const { towns, decorationQuantities } = userData;

    townCheckboxes.forEach((checkbox) => {
      checkbox.checked = towns.includes(checkbox.value);
    });

    Object.entries(decorationQuantities).forEach(([name, quantity]) => {
      const input = document.querySelector<HTMLInputElement>(
        `#decoration-${sanitizeId(name)}`
      );
      if (input) {
        input.value = (quantity as number).toString();
      }
    });
  }

  const importExportSection = document.createElement("div");
  importExportSection.innerHTML = `
    <h2>Import/Export Data</h2>
    <button id="export-csv">Export CSV</button>
    <button id="import-csv">Import CSV</button>
    <input type="file" id="import-file" style="display:none" />
  `;
  app.appendChild(importExportSection);

  document.getElementById("export-csv")?.addEventListener("click", () => {
    const { decorationQuantities, results } = gatherExportData();

    // Updated the rows construction to populate the "Unused" column with appropriate values
    const rows = Object.entries(decorationQuantities).map(([name]) => {
      const category = decorations.find((d) => d.name === name)?.category || "";
      const townQuantities = Object.keys(results).map((town) => {
        const townDecorations = results[town]?.decorations || [];
        const decoration = townDecorations.find((d: any) => d.name === name);
        return decoration ? decoration.quantity : "";
      });
      const unused = results[name]?.unused || ""; // Populate the "Unused" column
      return [name, category, ...townQuantities, unused];
    });

    // Add debugging logs to trace the rows being processed for CSV export
    console.log("Rows for CSV export:", rows);

    exportToCsv(decorationQuantities, results, "data.csv");
  });

  document.getElementById("import-csv")?.addEventListener("click", () => {
    const fileInput = document.getElementById("import-file") as HTMLInputElement;
    fileInput.accept = ".csv";
    fileInput.onchange = () => {
      const file = fileInput.files?.[0];
      if (file) {
        importData(file, (data) => {
          // Populate decoration quantities from imported CSV data
          data.forEach((row: any) => {
            const name = row.decoration_name;
            const input = document.querySelector<HTMLInputElement>(
              `#decoration-${sanitizeId(name)}`
            );
            if (input) {
              let totalQuantity = 0;
              Object.entries(row).forEach(([_, value]) => {
                if (!isNaN(Number(value))) {
                  totalQuantity += Number(value);
                }
              });
              input.value = totalQuantity.toString();
            }
          });
        });
      }
    };
    fileInput.click();
  });

  // Fix implicit 'any' types in other parts of the file
  document.querySelectorAll<HTMLInputElement>(".decoration-input-group input").forEach((input) => {
    input.addEventListener("change", (event: Event) => {
      const target = event.target as HTMLInputElement;
      console.log(`Input changed: ${target.name} = ${target.value}`);
    });
  });

  const townResults = document.querySelectorAll<HTMLLIElement>(".town-result li");
  townResults.forEach((li: HTMLLIElement) => {
    const match = li.textContent?.match(/^\d+x (.+) \(/);
    if (match) {
      console.log(`Matched decoration: ${match[1]}`);
    }
  });
}
