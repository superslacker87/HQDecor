import { optimizeDecorations } from "./optimizer";

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

export function setupInputForm() {
  const app = document.querySelector<HTMLDivElement>("#app")!;

  app.innerHTML = `
  <header>
  <img src = "hq_logo.webp" alt = "Home Quest Logo" width = "150px" height = "150px">
    <h1>Home Quest Decoration Optimizer</h1>
    </header>
    <form id="decoration-form">
      <div id="towns-container">
        <h2>Select Unlocked Towns:</h2>
        <div id="towns-inputs">
          <label><input type="checkbox" id="select-all-towns"> Select All/None</label>
          <label><input type="checkbox" class="town-checkbox" value="town1"> Town 1</label>
          <label><input type="checkbox" class="town-checkbox" value="town2"> Town 2</label>
          <label><input type="checkbox" class="town-checkbox" value="town3"> Town 3</label>
          <label><input type="checkbox" class="town-checkbox" value="town4"> Town 4</label>
          <label><input type="checkbox" class="town-checkbox" value="northern1"> Northern Town 1</label>
          <label><input type="checkbox" class="town-checkbox" value="northern2"> Northern Town 2</label>
          <label><input type="checkbox" class="town-checkbox" value="northern3"> Northern Town 3</label>
          <label><input type="checkbox" class="town-checkbox" value="evergarden"> Evergarden</label>
        </div>
      </div>

      <div id="decorations-container">
        <h2>Enter Decoration Quantities:</h2>
        <div id="decoration-inputs">
          <!-- Inputs will be dynamically added here -->
        </div>
      </div>

      <div id="options-container">
        <h2>Options:</h2>
        <label><input type="checkbox" id="valhalla-only"> Allow Valhalla items only in Evergarden</label>
        <button type="button" id="reset-values">Reset All Values</button>
      </div>

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
  const resetValuesButton =
    document.querySelector<HTMLButtonElement>("#reset-values")!;

  resetValuesButton.addEventListener("click", () => {
    const decorationInputs = document.querySelectorAll<HTMLInputElement>(
      ".decoration-input-group input"
    );
    decorationInputs.forEach((input) => {
      input.value = "0";
    });
  });

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

    const results = optimizeDecorations(
      towns,
      decorationQuantities,
      valhallaOnlyCheckbox.checked
    );

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

      if (
        townResult.green === 0 &&
        townResult.blue === 0 &&
        townResult.red === 0
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

      townResult.decorations.forEach((decoration) => {
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
          const listItem = document.createElement("li");
          listItem.textContent = `${total}x ${name}`;
          decorationList.appendChild(listItem);
        });

      townSection.appendChild(decorationList);
      resultsDiv.appendChild(townSection);
    });
  });

  const decorations = [
    { name: "Greenery Variant A", category: "Town Essentials" },
    { name: "Greenery Variant B", category: "Town Essentials" },
    { name: "The Globe", category: "Town Essentials" },
    { name: "Heroic Horse", category: "Town Essentials" },
    { name: "Tree of Life", category: "Valhalla" },
    { name: "Freya's Fortune", category: "Valhalla" },
    { name: "Golden Freya", category: "Valhalla" },
    { name: "Tree of Knowledge", category: "Valhalla" },
    { name: "Theatre", category: "Oracle" },
    { name: "Golden Theatre", category: "Oracle" },
    { name: "Wizard's Staff", category: "Mercury" },
    { name: "Park", category: "Central Park" },
    { name: "Forest", category: "Central Park" },
    { name: "Observatory", category: "Central Park" },
    { name: "The Deer", category: "Reindeer Fest" },
    { name: "Elf House", category: "Reindeer Fest" },
    { name: "Snowflake", category: "Reindeer Fest" },
    { name: "Cozy Cabin", category: "Reindeer Fest" },
    { name: "Rocks", category: "Nature Reserve" },
    { name: "Ridge", category: "Nature Reserve" },
    { name: "Lake", category: "Nature Reserve" },
    { name: "Meadow", category: "Nature Reserve" },
    { name: "Gorgon", category: "Medusa" },
    { name: "Golden Gorgon", category: "Medusa" },
  ];

  const decorationInputs =
    document.querySelector<HTMLDivElement>("#decoration-inputs")!;
  let currentCategory = "";

  decorations.forEach(({ name, category }) => {
    if (category !== currentCategory) {
      currentCategory = category;
      const categoryHeader = document.createElement("h3");
      categoryHeader.textContent = category;
      decorationInputs.appendChild(categoryHeader);
    }

    const inputGroup = document.createElement("div");
    inputGroup.className = "decoration-input-group";

    const label = document.createElement("label");
    label.textContent = `${name}:`;
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
}
