import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic.js";
import {
  Engine,
  Scene,
  Vector3,
  HemisphericLight,
  ImportMeshAsync,
} from "@babylonjs/core";
import { Camera } from "./Camera.js";

import * as BABYLON from "@babylonjs/core";

registerBuiltInLoaders();
const LOG_TAG = "[BabylonApp]";
console.info(`${LOG_TAG} Built-in loaders registered.`);

class BabylonApp {
  private static globalErrorHooksRegistered = false;
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private scene: Scene | null = null;
  private camera: Camera | null = null;  private targetSceneHight: number = 10; // Desired size for the largest dimension of the model

  constructor(canvas: HTMLCanvasElement, targetSceneHight?: number) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true, undefined, true);
    console.info(`${LOG_TAG} Engine created.`, {
      baseURI: document.baseURI,
      canvasSize: `${canvas.clientWidth}x${canvas.clientHeight}`,
    });
    this.registerGlobalErrorHooks();
    if (targetSceneHight !== undefined) {
      this.targetSceneHight = targetSceneHight;
    }
  }

  public resetCamera() {
    if (this.camera) {
      this.camera.resetCamera();    }
  }

  private async createScene(): Promise<Scene> {
    console.info(`${LOG_TAG} createScene started.`);
    const scene = new Scene(this.engine);
    const axes = new BABYLON.AxesViewer(scene);

    this.createCamera(scene);
    this.createLight(scene);
    this.scene = scene;
    console.info(`${LOG_TAG} Scene created.`);
    
    return scene;
  }

  private startModelLoad(scene: Scene): void {
    const loadStart = performance.now();
    const watchdogMs = 10000;
    const watchdog = window.setTimeout(() => {
      console.error(`${LOG_TAG} Model load watchdog timeout after ${watchdogMs}ms.`, {
        hint: "Check Network for missing js chunks and 3dModels/body.obj",
        baseURI: document.baseURI,
      });
    }, watchdogMs);

    // Defer model loading until after first paint so the page remains interactive.
    requestAnimationFrame(() => {
      void this.loadModel(scene)
        .then(() => {
          window.clearTimeout(watchdog);
          console.info(`${LOG_TAG} Model load completed.`, {
            durationMs: Math.round(performance.now() - loadStart),
          });
        })
        .catch((error) => {
          window.clearTimeout(watchdog);
          console.error(`${LOG_TAG} Model load failed.`, error);
        });
    });
  }

  private registerGlobalErrorHooks(): void {
    if (BabylonApp.globalErrorHooksRegistered) {
      return;
    }

    BabylonApp.globalErrorHooksRegistered = true;

    window.addEventListener("error", (event) => {
      console.error(`${LOG_TAG} window error event.`, {
        message: event.message,
        fileName: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error,
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      console.error(`${LOG_TAG} unhandled promise rejection.`, event.reason);
    });
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
    console.info(`${LOG_TAG} loadModel started.`);
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
    console.info(`${LOG_TAG} Model transform applied.`, {
      uniformScale,
      size,
      position: root.position,
    });
  }

  private async loadBodyModel(scene: Scene) : Promise<BABYLON.TransformNode> {
    await this.ensureObjLoader();

    const modelUrl = new URL("3dModels/body.obj", document.baseURI).toString();
    await this.probeModelUrl(modelUrl);

    console.info(`${LOG_TAG} ImportMeshAsync request.`, { modelUrl });
    const bodyMeshes = await ImportMeshAsync(modelUrl, scene,
        { meshNames: ["BodyLeft"]}); // "BodyLeft" is a half of the body model (left for our view when looking on face).
    console.info(`${LOG_TAG} ImportMeshAsync response.`, {
      meshCount: bodyMeshes.meshes.length,
      meshNames: bodyMeshes.meshes.map((mesh) => mesh.name),
    });
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

  private async ensureObjLoader(): Promise<void> {
    console.info(`${LOG_TAG} Loading OBJ loader chunk...`);
    try {
      await import("@babylonjs/loaders/OBJ/index.js");
      console.info(`${LOG_TAG} OBJ loader chunk loaded.`);
    } catch (error) {
      console.error(`${LOG_TAG} Failed to load OBJ loader chunk.`, error);
      throw error;
    }
  }

  private async probeModelUrl(modelUrl: string): Promise<void> {
    console.info(`${LOG_TAG} Probing model URL with HEAD...`, { modelUrl });
    try {
      const response = await fetch(modelUrl, { method: "HEAD" });
      if (!response.ok) {
        throw new Error(`HEAD ${modelUrl} -> ${response.status} ${response.statusText}`);
      }
      console.info(`${LOG_TAG} Model URL probe succeeded.`, {
        status: response.status,
        contentType: response.headers.get("content-type"),
      });
    } catch (error) {
      console.error(`${LOG_TAG} Model URL probe failed.`, error);
      throw error;
    }
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
    console.info(`${LOG_TAG} init started.`);
    const scene = await this.createScene();

    window.addEventListener("resize", () => {
      this.engine.resize();
    });

    // run the main render loop
    this.engine.runRenderLoop(() => {
      scene.render();
    });
    console.info(`${LOG_TAG} render loop started.`);

    this.startModelLoad(scene);
  }
}


export function load3DScene(canvas: HTMLCanvasElement): BabylonApp {
    const app = new BabylonApp(canvas);
    app.init().catch((error) => {
        console.error("Failed to initialize Babylon app:", error);
    });

    return app;
}