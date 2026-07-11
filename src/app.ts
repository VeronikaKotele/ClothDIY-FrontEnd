class BodyBuilderApp {
  private scene: { resetCamera: () => void } | null = null;
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
        if (this.scene) {
          this.scene.resetCamera();
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
        const { load3DScene } = await import("./components/3dSceneLoader.js");
        this.scene = load3DScene(canvas);
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
}

const app = new BodyBuilderApp();