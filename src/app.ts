import type { IBodyManager, ISceneManager } from "./interfaces/3dSceneInterfaces.js";

class BodyBuilderApp {
  private sceneManager: ISceneManager | null = null;
  private bodyManager: IBodyManager | null = null;
  private isSceneLoading = false;

  constructor() {
    const canvas = document.getElementById('bodyBuilderCanvas');
    if (canvas instanceof HTMLCanvasElement) {
      this.initializeSceneAsync(canvas);
    } else {
      console.error("Canvas element not found or is not a HTMLCanvasElement.");
    }

    const resetCameraButton = document.getElementById('resetCameraButton');
    if (resetCameraButton instanceof HTMLButtonElement) {
      resetCameraButton.addEventListener('click', () => {
        if (this.sceneManager) {
          this.sceneManager.resetCamera();
        }
      });
    }
  }

  private initializeSceneAsync(canvas: HTMLCanvasElement): void {
    if (this.isSceneLoading) {
      return;
    }

    this.isSceneLoading = true;

    const loadScene = async () => {
      try {
        console.info("[BodyBuilderApp] Loading Babylon scene module...");
        const { load3DScene } = await import("./components/SceneManager.js");
        this.sceneManager = load3DScene(canvas);
        this.bodyManager = this.sceneManager.getBodyManager();
      } catch (error) {
        console.error("[BodyBuilderApp] Failed to load Babylon scene module.", error);
      }
    };

    const idleCallback = (window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback;

    if (idleCallback) {
      idleCallback(() => {
        void loadScene();
      }, { timeout: 700 });
    } else {
      window.setTimeout(() => {
        void loadScene();
      }, 0);
    }
  }

  public async onBodyHeightChanged(newHeight: number): Promise<void> {
    if (!this.bodyManager) {
      console.warn("[BodyBuilderApp] BodyManager is not initialized yet.");
      return;
    }

    this.bodyManager.updateHeight(newHeight)
    .then((result: boolean) => {
      if (result) {
        console.info("[BodyBuilderApp] Body height changed to:", newHeight);
      }
    })
    .catch((error) => {
      console.error("[BodyBuilderApp] Failed to update body height:", error);
    });
  }
}

const app = new BodyBuilderApp();