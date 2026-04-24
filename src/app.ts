import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic.js";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  Tools,
  AppendSceneAsync,
  ImportMeshAsync,
  FreeCameraGamepadInput,
} from "@babylonjs/core";

import * as BABYLON from "@babylonjs/core";

registerBuiltInLoaders();

class App {
  private canvas: HTMLCanvasElement;
  private engine: Engine;

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
      20,
      Vector3.Zero(),
      scene,
    );
    camera.attachControl(this.canvas, true);

    new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

    //Load an OBJ model served by webpack dev server from /3dModels.
    var bodyMeshes = await ImportMeshAsync("/3dModels/body.obj", scene);
    bodyMeshes.meshes.forEach((mesh) => {
      console.log("TransformNode:", mesh.name, mesh.position);
      mesh.translate(new Vector3(0, -10, 0), BABYLON.Space.WORLD);
      mesh.freezeWorldMatrix();
    });

    return scene;
  }

  async init(): Promise<void> {
    const scene = await this.createScene();

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
