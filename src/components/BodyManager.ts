import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";

import { applyTargetHeight, placeNodeOnOrigin } from "./3dTransformations.js";
import type { IBodyManager } from "../interfaces/3dSceneInterfaces.js";
import { createBodyDebugElements, createDebugHorizontalPlane } from "./DebugSceneElements.js";

import * as Constants from "../constants.js";

const LOG_TAG = "[BodyManager]";
console.info(`${LOG_TAG} App bootstrap started.`);

const MINIMAL_CHANGE_SENSITIVITY_CM = 1; // Minimum change in centimeters to trigger an update

export class BodyManager implements IBodyManager {
  private modelRoot: TransformNode;
  private bodyHeight: number;
  private boundingBox: { min: Vector3; max: Vector3 };

  private debugElements: ReturnType<typeof createBodyDebugElements> | null = null;
  private bustMidPlane: Mesh;
  private bustTopPlane: Mesh;
  private bustBottomPlane: Mesh;

  constructor(model: TransformNode, bodyHeight: number, boundingBox: { min: Vector3; max: Vector3 }) {
    this.modelRoot = model;
    this.bodyHeight = bodyHeight;
    this.boundingBox = boundingBox;

    this.debugElements = createBodyDebugElements(this.modelRoot.getScene(), boundingBox, model);
    this.bustMidPlane = createDebugHorizontalPlane(this.modelRoot.getScene(), Constants.MODEL_LOAD_BUST_MID_LINE_REL_HEIGHT * this.bodyHeight);
    this.bustTopPlane = createDebugHorizontalPlane(this.modelRoot.getScene(), Constants.MODEL_LOAD_BUST_TOP_LINE_REL_HEIGHT * this.bodyHeight);
    this.bustBottomPlane = createDebugHorizontalPlane(this.modelRoot.getScene(), Constants.MODEL_LOAD_BUST_BOTTOM_LINE_REL_HEIGHT * this.bodyHeight);
  }

  public async updateHeight(newHeight: number): Promise<boolean> {
    if (Math.abs(this.bodyHeight - newHeight) < MINIMAL_CHANGE_SENSITIVITY_CM) {
      return false; // No significant change, no update needed
    }

    if (newHeight <= 100 || newHeight > 300) {
      console.warn(`${LOG_TAG} Requested height is out of reasonable bounds.`, {
        requestedHeight: newHeight,
      });
      return false; // Height out of reasonable bounds
    }

    this.debugElements?.scaling.scaleInPlace(newHeight / this.bodyHeight);
    this.bustMidPlane.position.y = Constants.MODEL_LOAD_BUST_MID_LINE_REL_HEIGHT * newHeight;
    this.bustTopPlane.position.y = Constants.MODEL_LOAD_BUST_TOP_LINE_REL_HEIGHT * newHeight;
    this.bustBottomPlane.position.y = Constants.MODEL_LOAD_BUST_BOTTOM_LINE_REL_HEIGHT * newHeight;

    try {
      this.bodyHeight = newHeight;
      applyTargetHeight(this.modelRoot, newHeight, this.boundingBox);
    } catch (error) {
      console.error(`${LOG_TAG} Failed to update body height.`, error);
      return false; // Update failed
    }

    return true; // Update applied successfully
  }
}
