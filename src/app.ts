import "./scripts/uiControls.js"
import "./scripts/bodyParametersForm.js";
import { BodyBuilderApp } from "./BodyBuilderApp.js";

const app = new BodyBuilderApp();

const bodyHeightInput = document.getElementById('height');
if (bodyHeightInput) {
  bodyHeightInput.addEventListener('input', async (event) => {
    const inputElement = event.target as HTMLInputElement;
    const newHeight = parseFloat(inputElement.value);
    if (!isNaN(newHeight)) {
      await app.onBodyHeightChanged(newHeight);
    }
  });
}

const cameraPositionTopButton = document.getElementById('camera-position-top');
if (cameraPositionTopButton) {
  cameraPositionTopButton.addEventListener('click', (event) => {
    app.OnToggleCameraPosition('top');
  });
}

const cameraPositionFrontButton = document.getElementById('camera-position-front');
if (cameraPositionFrontButton) {
  cameraPositionFrontButton.addEventListener('click', (event) => {
    app.OnToggleCameraPosition('front');
  });
}

const cameraPositionSideButton = document.getElementById('camera-position-side');
if (cameraPositionSideButton) {
  cameraPositionSideButton.addEventListener('click', (event) => {
    app.OnToggleCameraPosition('side');
  });
}


const cameraProjectionModeButton = document.getElementById('camera-projection-mode');
if (cameraProjectionModeButton) {
  cameraProjectionModeButton.addEventListener('click', (event) => {
    app.onToggleProjectionMode();
  });
}