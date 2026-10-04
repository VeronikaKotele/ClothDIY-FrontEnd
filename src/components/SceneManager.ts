import { Engine } from "@babylonjs/core/Engines/engine.js";
import { Scene } from "@babylonjs/core/scene.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
import type { ICamera, IBodyManager, ISceneManager, IBodyLoader } from "../interfaces/3dSceneInterfaces.js";
import { DEFAULT_BODY_HEIGHT_CM } from "../constants.js";
import { createSceneDebugElements } from "./DebugSceneElements.js";
import { BodyLoader } from "./BodyLoader.js";
import { BodyManager } from "./BodyManager.js";
import { Camera } from "./Camera.js";

const LOG_TAG = "[SceneManager]";

class SceneManager implements ISceneManager {
  private static globalErrorHooksRegistered = false;
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private scene: Scene | null = null;
  private camera: ICamera | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private resizeFrameId: number | null = null;
  private targetSceneHeight: number = 200; // Desired size for the largest dimension of the model

  private bodyLoader: IBodyLoader | null = null;
  private bodyManager: IBodyManager | null = null;

  constructor(canvas: HTMLCanvasElement, targetSceneHeight?: number) {
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true, undefined, true);

    this.registerGlobalErrorHooks();
    if (targetSceneHeight !== undefined) {
      this.targetSceneHeight = targetSceneHeight;
    }

    this.setupResizeObserver();
  }

  public resetCamera() {
    if (this.camera) {
      this.camera.resetCamera();    }
  }

  public toggleProjectionMode() {
    if (this.camera) {
      this.camera.toggleProjectionMode();
    }
  }

  public setCameraPosition(position: 'top' | 'front' | 'side') {
    if (!this.camera) {
      console.warn(`${LOG_TAG} Camera is not initialized yet.`);
      return;
    }

    this.camera.setPosition(position);
  }

  private async createScene(): Promise<Scene> {
    const scene = new Scene(this.engine);
    
    this.createCamera(scene);
    this.createLight(scene);
    this.scene = scene;

    createSceneDebugElements(scene);

    return scene;
  }

  private setupResizeObserver() {
    if (typeof ResizeObserver !== "undefined") {
      const resizeTarget = this.canvas.parentElement ?? this.canvas;

      this.resizeObserver = new ResizeObserver(() => {
        if (this.resizeFrameId !== null) {
          return;
        }

        this.resizeFrameId = window.requestAnimationFrame(() => {
          this.resizeFrameId = null;
          this.engine.resize();
        });
      });
      this.resizeObserver.observe(resizeTarget);
    } else {
      window.addEventListener("resize", () => {
        this.engine.resize();
      });
    }
  }

  private registerGlobalErrorHooks(): void {
    if (SceneManager.globalErrorHooksRegistered) {
      return;
    }

    SceneManager.globalErrorHooksRegistered = true;

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
    const camera = new Camera(scene, this.targetSceneHeight);

    camera.attachControl(this.canvas, true);

    this.camera = camera;
  }

  private async createLight(scene: Scene) {
    const light1 = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
    const light2 = new HemisphericLight("light2", new Vector3(-1, 1, 0), scene);

    light1.intensity = 0.5;
    light2.intensity = 0.5;
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

    this.bodyLoader = new BodyLoader(scene, DEFAULT_BODY_HEIGHT_CM);
    this.bodyLoader.startModelLoad();
  }

  public getBodyManager(): IBodyManager | null {
    if (this.bodyManager) {
      return this.bodyManager;
    }

    const bodyModel = this.bodyLoader?.getBodyModel();
    if (!bodyModel) {
      return null;
    }

    this.bodyManager = new BodyManager(bodyModel.modelRoot, bodyModel.bodyHeight, bodyModel.boundingBox);
    
    return this.bodyManager;
  }
}

export function load3DScene(canvas: HTMLCanvasElement): SceneManager {
    const sceneManager = new SceneManager(canvas);
    sceneManager.init().catch((error) => {
        console.error("Failed to initialize Babylon sceneManager:", error);
    });

    return sceneManager;
}