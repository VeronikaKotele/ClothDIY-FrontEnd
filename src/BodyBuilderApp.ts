import type { IBodyManager, ISceneManager } from "./interfaces/3dSceneInterfaces.js";
import { AppState } from "./state.js";

export class BodyBuilderApp {
  private sceneManager: ISceneManager | null = null;
  private bodyManager: IBodyManager | null = null;
  private isSceneLoading = false;

  private appState = new AppState();

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
        await this.waitForBodyManagerReady();
      } catch (error) {
        console.error("[BodyBuilderApp] Failed to load Babylon scene module.", error);
      } finally {
        this.isSceneLoading = false;
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

  private async waitForBodyManagerReady(timeoutMs = 12000): Promise<void> {
    const startedAt = performance.now();

    while (performance.now() - startedAt < timeoutMs) {
      const bodyManager = this.sceneManager?.getBodyManager() ?? null;
      if (bodyManager) {
        this.bodyManager = bodyManager;
        console.info("[BodyBuilderApp] BodyManager is ready.");
        return;
      }

      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 100);
      });
    }

    console.warn("[BodyBuilderApp] BodyManager did not become ready before timeout.", {
      timeoutMs,
    });
  }

  public async onBodyHeightChanged(newHeight: number): Promise<void> {
    this.appState.bodyParameters.height = newHeight;

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
