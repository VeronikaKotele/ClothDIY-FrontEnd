import {
  Scene,
} from "@babylonjs/core/scene.js";
import type { ICamera } from "../interfaces/3dSceneInterfaces.js";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";

export class Camera implements ICamera {
  private camera: ArcRotateCamera;
  private defaultPosition: Vector3;
  private defaultTarget: Vector3;
  private defaultRadius: number;

  constructor(scene: Scene, targetSceneHight: number) {
    const centerHight = targetSceneHight / 2
    const targetLookAt = new Vector3(0, centerHight, 0);
    const radius = targetSceneHight * 1.5; // Set the radius based on the target scene height
    const orthographicProjectionSize = radius / 4;

    const camera = new ArcRotateCamera(
      "Camera",
      -Math.PI / 2,
      Math.PI / 2.5,
      radius,
      targetLookAt,
      scene,
    );

    camera.zoomToMouseLocation = true; // Enable zooming to mouse location

    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = camera.radius;
    camera.orthoTop = orthographicProjectionSize;
    camera.orthoBottom = -orthographicProjectionSize;
    camera.orthoLeft = -orthographicProjectionSize;
    camera.orthoRight = orthographicProjectionSize;

    camera.minZ = 0.1; // Set a minimum Z value to avoid clipping issues

    this.camera = camera;

    this.defaultPosition = camera.position.clone();
    this.defaultTarget = camera.target.clone();
    this.defaultRadius = camera.radius;
  }

  public resetCamera() {
    if (this.camera) {
      this.camera.setPosition(this.defaultPosition.clone());
      this.camera.setTarget(this.defaultTarget.clone());
      this.camera.radius = this.defaultRadius;
    }
  }

  public attachControl(canvas: HTMLCanvasElement, noPreventDefault?: boolean) {
    if (this.camera) {
      this.camera.attachControl(canvas, noPreventDefault);
    }
  }

  public toggleProjectionMode() {
    if (this.camera) {
      if (this.camera.mode === 0) {
        this.camera.mode = 1; // Switch to orthographic mode
      } else {
        this.camera.mode = 0; // Switch back to perspective mode
      }
    }
  }

  public setPosition(position: 'top' | 'front' | 'side') {
    switch (position) {
      case 'top':
        this.camera.setPosition(new Vector3(0, this.defaultRadius, 0));
        this.camera.alpha *= -1; // Flip the alpha to have up to +z instead of -z
        break;
      case 'front':
        this.camera.setPosition(new Vector3(0, this.defaultRadius / 2, -this.defaultRadius));
        break;
      case 'side':
        this.camera.setPosition(new Vector3(this.defaultRadius, this.defaultRadius / 2, 0));
        break;
    }
  }
}
