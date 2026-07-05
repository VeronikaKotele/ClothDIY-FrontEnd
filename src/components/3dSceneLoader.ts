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
import { Camera } from "./Camera.js";

import * as BABYLON from "@babylonjs/core";

registerBuiltInLoaders();

class BabylonApp {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private scene: Scene | null = null;
  private camera: Camera | null = null;  private targetSceneHight: number = 10; // Desired size for the largest dimension of the model

  constructor(canvas: HTMLCanvasElement, targetSceneHight?: number) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true, undefined, true);
    if (targetSceneHight !== undefined) {
      this.targetSceneHight = targetSceneHight;
    }
  }

  public resetCamera() {
    if (this.camera) {
      this.camera.resetCamera();    }
  }

  private async createScene(): Promise<Scene> {
    const scene = new Scene(this.engine);
    const axes = new BABYLON.AxesViewer(scene);

    this.createCamera(scene);
    this.createLight(scene);
    this.loadModel(scene);
    this.scene = scene;
    
    return scene;
  }

  private async createCamera(scene: Scene) {
    const camera = new Camera(scene, this.targetSceneHight);

    camera.attachControl(this.canvas, true);

    this.camera = camera;
  }

  private async createLight(scene: Scene) {
    const light1 = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
    const light2 = new HemisphericLight("light2", new Vector3(-1, 1, 0), scene);

    light1.intensity = 0.5;
    light2.intensity = 0.5;
  }

  private async loadModel(scene: Scene) {
    //Load an OBJ model served by webpack dev server from /3dModels.
    const root = await this.loadBodyModel(scene);

    const bounds = this.getMeshesBoundingBox(root.getChildMeshes());
    const boundsMin = bounds.min;
    const boundsMax = bounds.max;

    const size = boundsMax.subtract(boundsMin);
    const center = boundsMin.add(boundsMax).scale(0.5);
    const maxDimension = Math.max(size.x, size.y, size.z);
    const targetSceneHight = this.targetSceneHight; // Use the targetSceneHight property of the class
    const uniformScale = maxDimension > 0 ? targetSceneHight / maxDimension : 1;

    root.scaling.setAll(uniformScale);
    // With parent scale applied first, translation must also be scaled to keep center at origin.
    root.position = center.scale(-uniformScale);
    // Lift the model so its lowest point sits on y = 0.
    root.position.y += (size.y * uniformScale) / 2;
  }

  private async loadBodyModel(scene: Scene) : Promise<BABYLON.TransformNode> {
    const bodyMeshes = await ImportMeshAsync("/3dModels/body.obj", scene, 
        { meshNames: ["BodyLeft"]}); // "BodyLeft" is a half of the body model (left for our view when looking on face).
    if (bodyMeshes.meshes.length != 1) {
      console.error("Loaded meshes:", bodyMeshes.meshes.map(mesh => mesh.name));
      throw new Error("Expected to load exactly one mesh for the body model, got " + bodyMeshes.meshes.length);
    }
    const bodyLeft = bodyMeshes.meshes[0];
    const root = new BABYLON.TransformNode("bodyRoot", scene);
    bodyLeft.setParent(root);

    // For better performance, we clone the half instead of loading.
    const bodyRight = bodyLeft.clone("BodyRight", root);
    if (!bodyRight) {
      throw new Error("Failed to clone the body half mesh.");
    }

    // Mirror across the YZ plane by flipping local X scale on the clone.
    bodyRight.scaling.x *= -1;

    // Meshes are loaded with their original orientation (face to +z). Rotate 180 around Y axis.
    root.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, Math.PI, 0);

    return root;
  }

  private getMeshesBoundingBox(meshes: BABYLON.AbstractMesh[]): { min: Vector3; max: Vector3 } {
    const boundsMin = new Vector3(
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    );
    const boundsMax = new Vector3(
      Number.NEGATIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    );

    meshes.forEach((mesh) => {
      if (mesh.getTotalVertices() === 0) {
        return;
      }

      mesh.computeWorldMatrix(true);
      const boundingInfo = mesh.getBoundingInfo();
      const min = boundingInfo.boundingBox.minimumWorld;
      const max = boundingInfo.boundingBox.maximumWorld;

      boundsMin.x = Math.min(boundsMin.x, min.x);
      boundsMin.y = Math.min(boundsMin.y, min.y);
      boundsMin.z = Math.min(boundsMin.z, min.z);

      boundsMax.x = Math.max(boundsMax.x, max.x);
      boundsMax.y = Math.max(boundsMax.y, max.y);
      boundsMax.z = Math.max(boundsMax.z, max.z);
    });

    return { min: boundsMin, max: boundsMax };
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


export function load3DScene(canvas: HTMLCanvasElement): BabylonApp {
    const app = new BabylonApp(canvas);
    app.init().catch((error) => {
        console.error("Failed to initialize Babylon app:", error);
    });

    return app;
}