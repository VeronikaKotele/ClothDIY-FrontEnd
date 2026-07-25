import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";

import { applyTargetHeight, placeNodeOnOrigin } from "./3dTransformations.js";
import type { IBodyManager } from "../interfaces/3dSceneInterfaces.js";

const LOG_TAG = "[BodyManager]";
console.info(`${LOG_TAG} App bootstrap started.`);

const MINIMAL_CHANGE_SENSITIVITY_CM = 1; // Minimum change in centimeters to trigger an update

export class BodyManager implements IBodyManager {
  private modelRoot: TransformNode;
  private bodyHeight: number;
  private boundingBox: { min: Vector3; max: Vector3 };

  constructor(model: TransformNode, bodyHeight: number, boundingBox: { min: Vector3; max: Vector3 }) {
    this.modelRoot = model;
    this.bodyHeight = bodyHeight;
    this.boundingBox = boundingBox;
  }

  public async updateHeight(newHeight: number): Promise<boolean> {
    if (Math.abs(this.bodyHeight - newHeight) < MINIMAL_CHANGE_SENSITIVITY_CM) {
      return false; // No significant change, no update needed
    }

    try {
      this.bodyHeight = newHeight;
      applyTargetHeight(this.modelRoot, newHeight, this.boundingBox);
      placeNodeOnOrigin(this.modelRoot, this.boundingBox);
    } catch (error) {
      console.error(`${LOG_TAG} Failed to update body height.`, error);
      return false; // Update failed
    }
    return true; // Update applied successfully
  }
}
