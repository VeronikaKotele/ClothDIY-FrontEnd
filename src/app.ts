import { load3DScene } from "./components/3dSceneLoader.js";

class BodyBuilderApp {
  private scene;

  constructor() {
    const canvas = document.getElementById('bodyBuilderCanvas');
    if (canvas instanceof HTMLCanvasElement) {
      this.scene = load3DScene(canvas);
    } else {
      console.error("Canvas element not found or is not a HTMLCanvasElement.");
    }

    const resetCameraButton = document.getElementById('resetCameraButton');
    if (resetCameraButton instanceof HTMLButtonElement) {
      resetCameraButton.addEventListener('click', () => {
        this.scene.resetCamera();
      });
    }
  }
}

const app = new BodyBuilderApp();