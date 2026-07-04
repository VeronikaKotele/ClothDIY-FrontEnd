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

class BabylonApp {
  private canvas: HTMLCanvasElement;
  private engine: Engine;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
  }

  private async createScene(): Promise<Scene> {
    const scene = new Scene(this.engine);

    this.createCamera(scene);
    this.createLight(scene);
    this.loadModel(scene);
    
    return scene;
  }

  private async createCamera(scene: Scene) {
    const camera = new ArcRotateCamera(
      "Camera",
      Math.PI / 2,
      Math.PI / 2,
      20,
      Vector3.Zero(),
      scene,
    );
    camera.attachControl(this.canvas, true);
  }

  private async createLight(scene: Scene) {
    new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
  }

  private async loadModel(scene: Scene) {
    //Load an OBJ model served by webpack dev server from /3dModels.
    var bodyMeshes = await ImportMeshAsync("/3dModels/body.obj", scene);
    bodyMeshes.meshes.forEach((mesh) => {
      console.log("TransformNode:", mesh.name, mesh.position);
      mesh.translate(new Vector3(0, -10, 0), BABYLON.Space.WORLD);
      mesh.freezeWorldMatrix();
    });
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


export function load3DScene(canvas: HTMLCanvasElement): void {
    const app = new BabylonApp(canvas);
    app.init().catch((error) => {
        console.error("Failed to initialize Babylon app:", error);
    });
}