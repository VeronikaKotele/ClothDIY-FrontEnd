import { Vector3, Quaternion } from "@babylonjs/core/Maths/math.vector.js";
import { Scene } from "@babylonjs/core/scene.js";
import { ImportMeshAsync } from "@babylonjs/core/Loading/sceneLoader.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { getMeshesBoundingBox, applyTargetHeight, placeNodeOnOrigin } from "./3dTransformations.js";
import type { IBodyLoader } from "../interfaces/3dSceneInterfaces.js";
import type { BodyModel } from "../interfaces/structures.js";

const LOG_TAG = "[BodyLoader]";
console.info(`${LOG_TAG} App bootstrap started.`);

export class BodyLoader implements IBodyLoader {
  private scene: Scene;
  private modelRoot: TransformNode | null = null;
  private bodyHeight: number = 0;
  private boundingBox: { min: Vector3; max: Vector3 } | null = null;

  private _state: "not_loaded" | "loading" | "loaded" = "not_loaded";
  public get state() { return this._state; }
  private set state(value) { this._state = value; }

  constructor(scene: Scene, targetModelHeight: number) {
    this.scene = scene;
    this.bodyHeight = targetModelHeight;
  }

  public startModelLoad() {
    this.state = "loading";

    const loadStart = performance.now();
    const watchdogMs = 10000;
    const watchdog = window.setTimeout(() => {
      console.error(`${LOG_TAG} Model load watchdog timeout after ${watchdogMs}ms.`, {
        hint: "Check Network for missing js chunks and 3dModels/*",
        baseURI: document.baseURI,
      });
    }, watchdogMs);

    // Defer model loading until after first paint so the page remains interactive.
    requestAnimationFrame(() => {
      void this.loadModel()
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

  public getBodyModel(): BodyModel | null {
    if (!this.modelRoot || !this.boundingBox) {
      console.warn(`${LOG_TAG} Body model is not loaded yet.`);
      return null;
    }

    return {
      modelRoot: this.modelRoot,
      bodyHeight: this.bodyHeight,
      boundingBox: this.boundingBox,
    };
  }

  private async loadModel() {
    console.info(`${LOG_TAG} loadModel started.`);
    const root = await this.loadBodyModel();
    if (!root) {
      console.error(`${LOG_TAG} loadBodyModel returned null or undefined.`);
      return;
    }
    this.modelRoot = root;

    this.boundingBox = getMeshesBoundingBox(root);

    applyTargetHeight(root, this.bodyHeight, this.boundingBox);

    placeNodeOnOrigin(root, this.boundingBox);

    this.state = "loaded";
  }

  private async loadBodyModel() : Promise<TransformNode> {
    await this.ensureGltfLoader();

    const modelUrl = new URL("3dModels/body-compressed.glb", document.baseURI).toString();

    console.info(`${LOG_TAG} ImportMeshAsync request.`, { modelUrl });
    const bodyMeshes = await ImportMeshAsync(modelUrl, this.scene);
    console.info(`${LOG_TAG} ImportMeshAsync response.`, {
      meshCount: bodyMeshes.meshes.length,
      meshNames: bodyMeshes.meshes.map((mesh) => mesh.name),
    });
    if (bodyMeshes.meshes.length === 0) {
      console.error("Loaded meshes:", bodyMeshes.meshes.map(mesh => mesh.name));
      throw new Error("Expected at least one mesh for the body model, got 0");
    }

    const root = new TransformNode("bodyRoot", this.scene);

    bodyMeshes.meshes
      .filter((mesh) => mesh !== root && !mesh.parent)
      .forEach((mesh) => {
        mesh.setParent(root);
      });

    // Meshes are loaded with their original orientation (face to +z). Rotate 180 around Y axis.
    root.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);

    return root;
  }

  private async ensureGltfLoader(): Promise<void> {
    console.info(`${LOG_TAG} Loading glTF loader chunk...`);
    try {
      await import("@babylonjs/loaders/glTF/2.0/index.js");
      console.info(`${LOG_TAG} glTF loader chunk loaded.`);
    } catch (error) {
      console.error(`${LOG_TAG} Failed to load glTF loader chunk.`, error);
      throw error;
    }
  }
}
