// Home Quest Decor Helper - Input Form Logic
// Handles UI setup, user input, optimization, and import/export for decorations

import { optimizeDecorations, optimizeDecorationsBalanced } from "./optimizer";
import { calculateVarietyBonus } from "./scoring";
import decorations from "./decorations.json";

// Utility: Sanitize a string for use as an HTML id
function sanitizeId(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, "-");
}

const iconMap: Record<string, string> = {
  "Greenery Variant A": "Greenery_var.A.png",
  "Greenery Variant B": "Greenery_var.B.png",
  "The Globe": "The_Globe.png",
  "Heroic Horse": "Heroic_Horse.png",
  "Tree of Life": "Tree_of_Life.png",
  "Freya's Fortune": "Freya_27s_Fortune.png",
  "Golden Freya": "Golden_Freya.png",
  "Tree of Knowledge": "Tree_of_Knowledge.png",
  "Park": "Park.png",
  "Forest": "Forest.png",
  "Observatory": "Observatory.png",
  "The Deer": "The_Deer.png",
  "Elf House": "Elf_House.png",
  "Snowflake": "Snowflake.png",
  "Cozy Cabin": "Cozy_Cabin.png",
  "Rocks": "Rocks.png",
  "Ridge": "Ridge.png",
  "Lake": "Lake.png",
  "Meadow": "Meadow.png",
  "Theatre": "Theatre.png",
  "Golden Theatre": "Golden_Theatre.png",
  "Wizard's Staff": "Wizard_27s_Staff.png",
  "Gorgon": "Gorgon.png",
  "Golden Gorgon": "Golden_Gorgon.png",
  "Temple": "Temple.png",
  "Golden Temple": "Golden_Temple.png",
  "Eiffel Tower": "Eiffel_Tower.png"
};

// Save user selections and decoration quantities to a cookie
function saveUserData(
  towns: string[],
  decorationQuantities: Record<string, number>,
  selectedPacks: string[] = []
) {
  const userData = { towns, decorationQuantities, selectedPacks };
  document.cookie = `userData=${encodeURIComponent(
    JSON.stringify(userData)
  )}; path=/; max-age=31536000;`;
}

// Load user selections and decoration quantities from a cookie
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

// Export the current results and decoration quantities to a CSV file
function exportToCsv(
  decorationQuantities: Record<string, number>,
  results: Record<
    string,
    { decorations: { name: string; quantity: number }[] }
  >,
  filename: string
) {
  const headers = [
    "Decoration Name",
    "Category",
    "Green",
    "Blue",
    "Red",
    "Unused",
    ...Object.keys(results),
  ];

  const rows = Object.entries(decorationQuantities).map(
    ([name, quantity]: [string, number]) => {
      const decoration = decorations.find(
        (d: { name: string; category: string }) => d.name === name
      );
      const category = decoration?.category || "";
      const green = (decoration as any)?.green || 0;
      const blue = (decoration as any)?.blue || 0;
      const red = (decoration as any)?.red || 0;

      const townQuantities = Object.keys(results).map((town: string) => {
        const townDecorations = results[town]?.decorations || [];
        const decorationMatch = townDecorations.find(
          (d: { name: string; quantity: number }) => d.name === name
        );
        return decorationMatch ? decorationMatch.quantity : 0;
      });
      const unused =
        quantity -
        townQuantities.reduce((sum: number, qty: number) => sum + qty, 0);
      return [name, category, green, blue, red, unused, ...townQuantities];
    }
  );

  const csvContent = [
    headers.join(","),
    ...rows.map((row: (string | number)[]) => row.join(",")),
  ].join("\n");
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

// Import decoration data from a CSV file and update the UI
function importData(file: File, callback: (data: any) => void) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const content = event.target?.result as string;
      if (file.type === "text/csv") {
        const rows = content.split(/\r?\n/).filter(Boolean);
        const headers = rows.shift()?.split(",") || [];
        const data = rows.map((row) => {
          const values = row.split(",");
          return headers.reduce((acc, header, index) => {
            acc[header.toLowerCase().replace(/ /g, "_")] = values[index];
            return acc;
          }, {} as Record<string, string>);
        });
        data.forEach((row) => {
          const name = row.decoration_name;
          const input = document.querySelector<HTMLInputElement>(
            `#decoration-${sanitizeId(name)}`
          );
          if (input) {
            let totalQuantity = 0;
            Object.entries(row).forEach(([key, value]) => {
              // Only sum numeric values that are NOT part of the decoration info or scores
              if (
                !["decoration_name", "category", "green", "blue", "red"].includes(key) &&
                !isNaN(Number(value))
              ) {
                totalQuantity += Number(value);
              }
            });
            input.value = totalQuantity.toString();
          }
        });
        callback(data);
      }
    } catch (error) {
      alert("Failed to import data: " + error);
    }
  };
  reader.readAsText(file);
}

// Gather current UI data for export (quantities and results)
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
    const townSections =
      resultsDiv.querySelectorAll<HTMLDivElement>(".town-result");
    townSections.forEach((section) => {
      const townName =
        section.querySelector("h3")?.textContent?.replace("Results for ", "") ||
        "";
      const decorationsUsed = Array.from(
        section.querySelectorAll<HTMLLIElement>(".decoration-item")
      )
        .map((li) => {
          const nameSpan = li.querySelector(".item-name");
          const qtySpan = li.querySelector(".item-qty");
          if (nameSpan && qtySpan) {
            return { name: nameSpan.textContent, quantity: parseInt(qtySpan.textContent || "0", 10) };
          }
          return null;
        })
        .filter(Boolean);
      results[townName] = { decorations: decorationsUsed };
    });
  }

  if (Object.keys(results).length === 0) {
    const maxScore = 1000 + (document.querySelectorAll<HTMLInputElement>(".pack-checkbox:checked").length * 100);
    const optimizationResults = optimizeDecorations(
      Array.from(
        document.querySelectorAll<HTMLInputElement>(".town-checkbox:checked")
      ).map((checkbox) => checkbox.value),
      decorationQuantities,
      maxScore
    );
    Object.entries(optimizationResults).forEach(([town, data]) => {
      results[town] = { decorations: data.decorations || [] };
    });
  }
  return { decorationQuantities, results };
}

// Main function to set up the input form and handle all UI logic
export function setupInputForm() {
  const app = document.querySelector<HTMLDivElement>("#app")!;

  // Render the main form UI
  app.innerHTML = `
    <header>
      <img id="header" src="hq_logo.webp" alt="Home Quest Logo">
      <h1>Decoration Optimizer</h1>
      <p style="color: var(--text-muted); font-size: 1.1rem; margin-top: 0.5rem;">Maximize your Town Hearts with ease</p>
    </header>

    <form id="decoration-form">
      <section class="card-section" id="towns-container">
        <h2><span style="color: var(--accent-primary);">1.</span> Select Unlocked Towns</h2>
        <div class="town-checkbox-wrapper" style="margin-bottom: 1rem; background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.2);">
          <input type="checkbox" id="select-all-towns">
          <label for="select-all-towns">Select All / None</label>
        </div>
        <div id="towns-inputs">
          <div class="town-checkbox-wrapper"><input type="checkbox" class="town-checkbox" value="town1" id="town-town1"><label for="town-town1">Town 1</label></div>
          <div class="town-checkbox-wrapper"><input type="checkbox" class="town-checkbox" value="town2" id="town-town2"><label for="town-town2">Town 2</label></div>
          <div class="town-checkbox-wrapper"><input type="checkbox" class="town-checkbox" value="town3" id="town-town3"><label for="town-town3">Town 3</label></div>
          <div class="town-checkbox-wrapper"><input type="checkbox" class="town-checkbox" value="town4" id="town-town4"><label for="town-town4">Town 4</label></div>
          
          <div class="town-checkbox-wrapper"><input type="checkbox" class="town-checkbox" value="evergarden" id="town-evergarden"><label for="town-evergarden">Evergarden</label></div>
          
          <div class="town-checkbox-wrapper"><input type="checkbox" class="town-checkbox" value="northern1" id="town-northern1"><label for="town-northern1">Northern 1</label></div>
          <div class="town-checkbox-wrapper"><input type="checkbox" class="town-checkbox" value="northern2" id="town-northern2"><label for="town-northern2">Northern 2</label></div>
          <div class="town-checkbox-wrapper"><input type="checkbox" class="town-checkbox" value="northern3" id="town-northern3"><label for="town-northern3">Northern 3</label></div>
          
          <div class="town-checkbox-wrapper"><input type="checkbox" class="town-checkbox" value="southern1" id="town-southern1"><label for="town-southern1">Southern 1</label></div>
          <div class="town-checkbox-wrapper"><input type="checkbox" class="town-checkbox" value="southern2" id="town-southern2"><label for="town-southern2">Southern 2</label></div>
          <div class="town-checkbox-wrapper"><input type="checkbox" class="town-checkbox" value="southern3" id="town-southern3"><label for="town-southern3">Southern 3</label></div>
        </div>
      </section>

      <section class="card-section" id="purchased-packs-container">
        <h2><span style="color: var(--accent-primary);">2.</span> Purchased Packs</h2>
        <div style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">Select packs you own to increase your max decoration score (+100 max per pack).</div>
        <div class="town-checkbox-wrapper" style="margin-bottom: 1rem; background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.2);">
          <input type="checkbox" id="select-all-packs">
          <label for="select-all-packs">Select All / None</label>
        </div>
        <div id="packs-inputs" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
          <div class="town-checkbox-wrapper"><input type="checkbox" class="pack-checkbox" value="Trophies of Culture" id="pack-trophies"><label for="pack-trophies">Trophies of Culture</label></div>
          <div class="town-checkbox-wrapper"><input type="checkbox" class="pack-checkbox" value="Nature Reserve" id="pack-nature"><label for="pack-nature">Nature Reserve</label></div>
          <div class="town-checkbox-wrapper"><input type="checkbox" class="pack-checkbox" value="Reindeer Fest" id="pack-reindeer"><label for="pack-reindeer">Reindeer Fest</label></div>
          <div class="town-checkbox-wrapper"><input type="checkbox" class="pack-checkbox" value="Central Park" id="pack-central"><label for="pack-central">Central Park</label></div>
          <div class="town-checkbox-wrapper"><input type="checkbox" class="pack-checkbox" value="Town Essentials" id="pack-essentials"><label for="pack-essentials">Town Essentials</label></div>
        </div>
      </section>

      <section class="card-section" id="optimization-method-container">
        <h2><span style="color: var(--accent-primary);">3.</span> Strategy</h2>
        <div style="display: flex; gap: 2rem; margin-top: 1rem;">
          <label class="town-checkbox-wrapper" style="flex: 1;">
            <input type="radio" name="optimization-method" value="maximum" checked>
            <div>
              <div style="font-weight: 700;">Maximum</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">Highest possible score</div>
            </div>
          </label>
          <label class="town-checkbox-wrapper" style="flex: 1;">
            <input type="radio" name="optimization-method" value="balanced">
            <div>
              <div style="font-weight: 700;">Balanced</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">Even distribution</div>
            </div>
          </label>
        </div>
      </section>

      <section class="card-section" id="decorations-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h2 style="margin: 0;"><span style="color: var(--accent-primary);">4.</span> Quantities</h2>
          <button type="button" class="btn btn-danger" id="reset-values-top">Reset All</button>
        </div>
        <div id="decoration-inputs">
          <!-- Inputs will be dynamically added here -->
        </div>
      </section>

      <div style="text-align: center; margin-bottom: 3rem;">
        <button type="submit" class="btn btn-primary" style="padding: 1.2rem 3rem; font-size: 1.2rem; border-radius: 20px;">
          🚀 Run Optimizer
        </button>
      </div>
    </form>

    <div id="results"></div>

    <section class="card-section" style="text-align: center;">
      <h2 style="margin-bottom: 1.5rem;">Data Management</h2>
      <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
        <button id="export-csv" class="btn btn-secondary">📥 Export CSV</button>
        <button id="import-csv" class="btn btn-secondary">📤 Import CSV</button>
      </div>
      <input type="file" id="import-file" style="display:none" />
    </section>
  `;

  // Set up select all/none for towns
  const selectAllCheckbox = document.querySelector<HTMLInputElement>("#select-all-towns")!;
  const townCheckboxes = document.querySelectorAll<HTMLInputElement>(".town-checkbox");

  selectAllCheckbox.addEventListener("change", () => {
    townCheckboxes.forEach((checkbox) => {
      checkbox.checked = selectAllCheckbox.checked;
    });
  });

  // Set up select all/none for packs
  const selectAllPacksCheckbox = document.querySelector<HTMLInputElement>("#select-all-packs")!;
  const packCheckboxes = document.querySelectorAll<HTMLInputElement>(".pack-checkbox");

  selectAllPacksCheckbox.addEventListener("change", () => {
    packCheckboxes.forEach((checkbox) => {
      checkbox.checked = selectAllPacksCheckbox.checked;
    });
  });

  // Assign names based on value
  townCheckboxes.forEach((checkbox) => {
    checkbox.name = `town-${sanitizeId(checkbox.value)}`;
  });

  const form = document.querySelector<HTMLFormElement>("#decoration-form")!;
  const resetValuesTopButton = document.querySelector<HTMLButtonElement>("#reset-values-top")!;

  function resetAllDecorationInputs() {
    if (confirm("Are you sure you want to reset all quantities to zero?")) {
      document.querySelectorAll<HTMLInputElement>(".decoration-input-group input").forEach((input) => {
        input.value = "0";
      });
    }
  }
  resetValuesTopButton.addEventListener("click", resetAllDecorationInputs);

  // Handle form submission
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const towns = Array.from(townCheckboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);

    const decorationQuantities = Array.from(
      document.querySelectorAll<HTMLInputElement>(".decoration-input-group input")
    ).reduce((acc, input) => {
      acc[input.name] = parseInt(input.value, 10) || 0;
      return acc;
    }, {} as Record<string, number>);

    const selectedPacks = Array.from(
      document.querySelectorAll<HTMLInputElement>(".pack-checkbox:checked")
    ).map((checkbox) => checkbox.value);

    saveUserData(towns, decorationQuantities, selectedPacks);

    const maxScore = 1000 + (selectedPacks.length * 100);

    const selectedMethod = document.querySelector<HTMLInputElement>("input[name='optimization-method']:checked")?.value || "maximum";

    let results;
    if (selectedMethod === "balanced") {
      results = optimizeDecorationsBalanced(towns, decorationQuantities, maxScore);
    } else {
      results = optimizeDecorations(towns, decorationQuantities, maxScore);
    }

    const resultsDiv = document.querySelector<HTMLDivElement>("#results")!;
    resultsDiv.innerHTML = '<h2 style="text-align: center; margin-bottom: 2rem;">Optimized Layout</h2>';

    const townNames: Record<string, string> = {
      town1: "Town 1", town2: "Town 2", town3: "Town 3", town4: "Town 4",
      northern1: "Northern 1", northern2: "Northern 2", northern3: "Northern 3",
      evergarden: "Evergarden",
      southern1: "Southern 1", southern2: "Southern 2", southern3: "Southern 3",
    };

    towns.forEach((town) => {
      const townResult = results[town];
      if (!townResult || (townResult.green === 0 && townResult.blue === 0 && townResult.red === 0 && (!townResult.decorations || townResult.decorations.length === 0))) return;

      const townSection = document.createElement("div");
      townSection.className = "card-section town-result";

      const townHeader = document.createElement("h3");
      townHeader.textContent = `Results for ${townNames[town] || town}`;
      townSection.appendChild(townHeader);

      const baseScore = Math.min(townResult.green, maxScore) + Math.min(townResult.blue, maxScore) + Math.min(townResult.red, maxScore);
      const varietyBonusPercentage = calculateVarietyBonus(townResult.green, townResult.blue, townResult.red);
      const varietyBonusScore = baseScore * varietyBonusPercentage;
      const overallScore = baseScore + varietyBonusScore;

      townSection.innerHTML += `
        <div class="overall-score-card">
          <div style="margin-bottom: 1rem;">
             <span class="score-badge green-badge">Green Hearts: ${townResult.green}</span>
             <span class="score-badge blue-badge">Blue Hearts: ${townResult.blue}</span>
             <span class="score-badge red-badge">Red Hearts: ${townResult.red}</span>
          </div>
          <div style="font-size: 1.1rem;">
            <div>Base Score: <span style="font-weight: 700;">${baseScore.toFixed(0)}</span></div>
            <div>Variety Bonus: <span style="font-weight: 700; color: var(--accent-primary);">+${(varietyBonusPercentage * 100).toFixed(1)}%</span> (+${varietyBonusScore.toFixed(0)} pts)</div>
            <div style="font-size: 1.5rem; margin-top: 0.5rem;">Overall Score: <span style="color: var(--accent-primary); font-weight: 800;">${overallScore.toFixed(0)}</span></div>
          </div>
        </div>
      `;

      const decorationTotals: Record<string, number> = {};

      townResult.decorations.forEach((decoration: { name: string; quantity: number }) => {
        decorationTotals[decoration.name] = (decorationTotals[decoration.name] || 0) + decoration.quantity;
      });

      const pagesMap = new Map<number, { name: string; total: number }[]>();
      [1, 2, 3, 4, 5].forEach(p => pagesMap.set(p, []));

      Object.entries(decorationTotals)
        .sort(([nameA], [nameB]) => Object.keys(decorationQuantities).indexOf(nameA) - Object.keys(decorationQuantities).indexOf(nameB))
        .forEach(([name, total]) => {
          if (total === 0) return;
          const category = decorations.find((d) => d.name === name)?.category || "";
          let pageNum = 1;

          if (["Town Essentials", "Valhalla"].includes(category)) {
            pageNum = 1;
          } else if (["Central Park", "Reindeer Fest"].includes(category)) {
            pageNum = 2;
          } else if (category === "Nature Reserve") {
            pageNum = 3;
          } else if (category === "Trophies of Culture") {
            if (["Marble Column", "Bronze Statue", "Silver Statue"].includes(name)) {
              pageNum = 3;
            } else {
              pageNum = 4;
            }
          } else if (["Oracle", "Mercury", "Medusa"].includes(category)) {
            pageNum = 4;
          } else if (["Highgard", "Highard", "Omega"].includes(category)) {
            pageNum = 5;
          }

          pagesMap.get(pageNum)!.push({ name, total });
        });

      [1, 2, 3, 4, 5].forEach(pageNum => {
        const items = pagesMap.get(pageNum)!;
        if (items.length > 0) {
          const pageHeader = document.createElement("h4");
          pageHeader.textContent = `Page ${pageNum}`;
          pageHeader.style.marginTop = "1rem";
          pageHeader.style.marginBottom = "0.5rem";
          pageHeader.style.color = "var(--text-muted)";
          pageHeader.style.fontWeight = "600";
          townSection.appendChild(pageHeader);

          const decorationList = document.createElement("div");
          decorationList.className = "decoration-list";

          items.forEach(({ name, total }) => {
            const decoration = decorations.find((d) => d.name === name);
            const item = document.createElement("div");
            item.className = "decoration-item";
            const imgHtml = iconMap[name] ? `<img src="/icons/${iconMap[name]}" alt="${name}" style="width: 24px; height: 24px; object-fit: contain; vertical-align: middle; margin-right: 8px;">` : '';
            item.innerHTML = `
              <div style="display: flex; align-items: center;">
                ${imgHtml}
                <div>
                  <span class="item-name" style="font-weight: 600;">${name}</span>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">
                  <span style="color: var(--accent-green);">G:${(decoration?.green || 0) * total}</span>
                  <span style="color: var(--accent-blue);">B:${(decoration?.blue || 0) * total}</span>
                  <span style="color: var(--accent-red);">R:${(decoration?.red || 0) * total}</span>
                </div>
              </div>
              <div style="background: var(--bg-card); padding: 0.2rem 0.6rem; border-radius: 8px; font-weight: 700;">
                x<span class="item-qty">${total}</span>
              </div>
            `;
            decorationList.appendChild(item);
          });
          townSection.appendChild(decorationList);
        }
      });
      resultsDiv.appendChild(townSection);
    });

    // Unused (Always show)
    const unusedDecorations = decorations.map(d => {
      const used = Object.values(results).flatMap((t: any) => t.decorations.filter((du: any) => du.name === d.name)).reduce((s, du: any) => s + du.quantity, 0);
      return { ...d, unused: (decorationQuantities[d.name] || 0) - used };
    }).filter(d => d.unused > 0);

    const unusedSection = document.createElement("div");
    unusedSection.className = "card-section unused-decorations";
    unusedSection.style.opacity = "0.7";
    unusedSection.innerHTML = '<h3 style="margin-bottom: 1.5rem; color: var(--text-muted);">Remaining Decorations</h3>';

    if (unusedDecorations.length > 0) {
      const unusedList = document.createElement("div");
      unusedList.className = "decoration-list";

      unusedDecorations.forEach(d => {
        const item = document.createElement("div");
        item.className = "decoration-item";
        const imgHtml = iconMap[d.name] ? `<img src="/icons/${iconMap[d.name]}" alt="${d.name}" style="width: 24px; height: 24px; object-fit: contain; vertical-align: middle; margin-right: 8px;">` : '';
        item.innerHTML = `
          <div style="display: flex; align-items: center;">
            ${imgHtml}
            <span class="item-name">${d.name}</span>
          </div>
          <span style="font-weight: 700;">x${d.unused}</span>`;
        unusedList.appendChild(item);
      });
      unusedSection.appendChild(unusedList);
    } else {
      unusedSection.innerHTML += '<p style="color: var(--text-muted); font-style: italic;">None — all decorations have been placed.</p>';
    }
    resultsDiv.appendChild(unusedSection);

    // Smooth scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
  });

  // Render decoration inputs
  const decorationInputs = document.querySelector<HTMLDivElement>("#decoration-inputs")!;
  let currentCategory = "";

  decorations.forEach(({ name, category, green, blue, red }) => {
    if (category !== currentCategory) {
      currentCategory = category;
      const categoryHeader = document.createElement("h3");
      categoryHeader.className = "category-title";
      categoryHeader.textContent = category;
      decorationInputs.appendChild(categoryHeader);
    }

    const inputGroup = document.createElement("div");
    inputGroup.className = "decoration-input-group";
    const imgHtml = iconMap[name] ? `<img src="/icons/${iconMap[name]}" alt="${name}" style="width: 20px; height: 20px; object-fit: contain; vertical-align: middle; margin-right: 8px;">` : '';
    inputGroup.innerHTML = `
      <label for="decoration-${sanitizeId(name)}" style="display: flex; align-items: center;">${imgHtml}${name}</label>
      <div style="display: flex; gap: 0.5rem; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">
        <span style="color: var(--accent-green);">G:${green}</span>
        <span style="color: var(--accent-blue);">B:${blue}</span>
        <span style="color: var(--accent-red);">R:${red}</span>
      </div>
      <input type="number" id="decoration-${sanitizeId(name)}" name="${name}" min="0" value="0">
    `;
    decorationInputs.appendChild(inputGroup);
  });

  // Restore data
  const userData = loadUserData();
  if (userData) {
    const { towns, decorationQuantities, selectedPacks = [] } = userData;
    townCheckboxes.forEach(cb => cb.checked = towns.includes(cb.value));
    Object.entries(decorationQuantities).forEach(([name, qty]) => {
      const input = document.querySelector<HTMLInputElement>(`#decoration-${sanitizeId(name)}`);
      if (input) input.value = (qty as number).toString();
    });
    const packCheckboxes = document.querySelectorAll<HTMLInputElement>(".pack-checkbox");
    packCheckboxes.forEach(cb => cb.checked = selectedPacks.includes(cb.value));
  }

  // Import/Export Handlers
  document.getElementById("export-csv")?.addEventListener("click", () => {
    const { decorationQuantities, results } = gatherExportData();
    exportToCsv(decorationQuantities, results, "HomeQuest-Decor-Export.csv");
  });

  document.getElementById("import-csv")?.addEventListener("click", () => {
    const fileInput = document.getElementById("import-file") as HTMLInputElement;
    fileInput.accept = ".csv";
    fileInput.onchange = () => {
      const file = fileInput.files?.[0];
      if (file) {
        importData(file, () => {
          // After import, the gatherData inside the callback should work, but for simplicity we rely on the input updates in importData
        });
      }
    };
    fileInput.click();
  });
}