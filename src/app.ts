import { BodyBuilderApp } from "./BodyBuilderApp.js";
import "./scripts/bodyParametersForm.js";

const app = new BodyBuilderApp();

const bodyHeightInput = document.getElementById('height');
if (bodyHeightInput) {
  bodyHeightInput.addEventListener('input', async (event) => {
    const inputElement = event.target as HTMLInputElement;
    const newHeight = parseFloat(inputElement.value);
    if (!isNaN(newHeight)) {
      console.info(`Body height input field changed to: ${newHeight}`);
      await app.onBodyHeightChanged(newHeight);
    }
  });
}