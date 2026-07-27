import { BodyModel } from "./structures.js";

export interface IBodyManager {
  updateHeight(newHeight: number): Promise<boolean>;
}

export interface ISceneManager {
  resetCamera(): void;
  getBodyManager(): IBodyManager | null;
  setCameraPosition(position: 'top' | 'front' | 'side'): void;
  toggleProjectionMode(): void;
}

export interface IBodyLoader {
  startModelLoad(): void;
  getBodyModel(): BodyModel | null;
}

export interface ICamera {
  resetCamera(): void;
  attachControl(canvas: HTMLCanvasElement, noPreventDefault?: boolean): void;
  toggleProjectionMode(): void;
  setPosition(position: 'top' | 'front' | 'side'): void;
}
