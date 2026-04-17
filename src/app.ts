import "@babylonjs/core/Debug/debugLayer.js";
import "@babylonjs/loaders/OBJ/index.js";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
} from "@babylonjs/core";
import { AppendSceneAsync } from "@babylonjs/core/Loading/sceneLoader.js";

class App {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private inspectorLoaded = false;

  constructor() {
    // create the canvas html element and attach it to the webpage
    this.canvas = document.createElement("canvas");
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.id = "gameCanvas";
    document.body.appendChild(this.canvas);

    this.engine = new Engine(this.canvas, true);
  }

  private async createScene(): Promise<Scene> {
    const scene = new Scene(this.engine);

    const camera = new ArcRotateCamera(
      "Camera",
      Math.PI / 2,
      Math.PI / 2,
      2,
      Vector3.Zero(),
      scene,
    );
    camera.attachControl(this.canvas, true);

    new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
    MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);

    // Load an OBJ model served by webpack dev server from /3dModels.
    await AppendSceneAsync("/3dModels/body.obj", scene);

    return scene;
  }

  async init(): Promise<void> {
    const scene = await this.createScene();

    // hide/show the Inspector
    window.addEventListener("keydown", async (ev) => {
      // Shift+Ctrl+Alt+I
      if (
        ev.shiftKey &&
        ev.ctrlKey &&
        ev.altKey &&
        (ev.key === "I" || ev.key === "i")
      ) {
        if (scene.debugLayer.isVisible()) {
          scene.debugLayer.hide();
        } else {
          if (!this.inspectorLoaded) {
            await import("@babylonjs/inspector");
            this.inspectorLoaded = true;
          }
          scene.debugLayer.show();
        }
      }
    });

    window.addEventListener("resize", () => {
      this.engine.resize();
    });

    // run the main render loop
    this.engine.runRenderLoop(() => {
      scene.render();
    });
  }
}

const app = new App();
app.init().catch((error) => {
  console.error("Failed to initialize Babylon app:", error);
});
