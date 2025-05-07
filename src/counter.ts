// Function to set up a counter on a button element
// The counter increments each time the button is clicked
export function setupCounter(element: HTMLButtonElement) {
  let counter = 0; // Initialize counter to 0

  // Function to update the counter and button text
  const setCounter = (count: number) => {
    counter = count;
    element.innerHTML = `count is ${counter}`;
  };

  // Add click event listener to increment the counter
  element.addEventListener('click', () => setCounter(counter + 1));

  // Initialize the button with the counter value
  setCounter(0);
}
