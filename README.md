# Home Quest Decor Helper

The Home Quest Decor Helper is a tool designed to optimize decoration placement in the game Home Quest. It helps players maximize their town scores by strategically assigning decorations to towns based on their heart values (green, blue, and red). The tool is accessible online at: [Home Quest Decor Helper](http://homequestdecorhelper.wuaze.com/?i=1).

## Features

- **Decoration Optimization**: Automatically assigns decorations to towns to maximize scores.
- **Valhalla-Only Option**: Restrict Evergarden to only accept Valhalla decorations (currently in progress).
- **Balanced Distribution**: Option to distribute decorations evenly across towns (planned feature).
- **Customizable Inputs**: Enter decoration quantities and town selections.
- **Dynamic Results**: View detailed results for each town, including total heart values and unused decorations.

## Planned Features

- **Import/Export**: Support for importing and exporting data in CSV and JSON formats.
- **Balanced Distribution**: Option to prioritize balanced decoration placement across towns rather than maximizing one town at a time.
- **Improved Valhalla Logic**: Ensure Evergarden logic works correctly for Valhalla-only items.

## How to Use

1. Open the tool in your browser: [Home Quest Decor Helper](http://homequestdecorhelper.wuaze.com/?i=1).
2. Select the towns you want to optimize by checking the boxes.
3. Enter the quantities of each decoration you have.
4. Click the "Optimize" button to calculate the best decoration placement.
5. Review the results, including total heart values and unused decorations.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (for running and building the project)
- [Vite](https://vitejs.dev/) (for development and bundling)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/superslacker87/HQDecor.git
   ```
2. Navigate to the project directory:
   ```bash
   cd HQDecor
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open the application in your browser at `http://localhost:3000`.

### Build

To create a production build, run:

```bash
npm run build
```

### File Structure

- `src/`: Contains the source code for the application.
  - `counter.ts`: Handles a simple counter functionality.
  - `decorations.json`: Stores decoration data.
  - `inputForm.ts`: Manages the input form and user interactions.
  - `main.ts`: Entry point for the application.
  - `optimizer.ts`: Core logic for optimizing decoration placement.
  - `style.css`: Styles for the application.
  - `vite-env.d.ts`: Type definitions for Vite.
- `public/`: Contains static assets like images.
- `index.html`: Main HTML file for the application.

## Contact

For questions or suggestions, feel free to reach out:

- **Discord**: HomeQuest server (@Omaha3DPrints)
- **Reddit**: [MetaphoricMenagerie](https://www.reddit.com/user/MetaphoricMenagerie)

We welcome feedback and contributions to improve the tool!
