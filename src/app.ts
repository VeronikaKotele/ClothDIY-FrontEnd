import { load3DScene } from "./components/3dSceneLoader.js";

const canvas = document.getElementById('gameCanvas');
if (canvas instanceof HTMLCanvasElement) {
  load3DScene(canvas);
} else {
  console.error("Canvas element not found or is not a HTMLCanvasElement.");
}