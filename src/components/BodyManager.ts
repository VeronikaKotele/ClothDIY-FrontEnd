import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Material } from "@babylonjs/core/Materials/material.js";

import { applyTargetHeight, placeNodeOnOrigin } from "./3dTransformations.js";
import type { IBodyManager } from "../interfaces/3dSceneInterfaces.js";
import { createBodyDebugElements, createDebugHorizontalPlane } from "./DebugSceneElements.js";

import * as Constants from "../constants.js";

const LOG_TAG = "[BodyManager]";
console.info(`${LOG_TAG} App bootstrap started.`);

const MINIMAL_CHANGE_SENSITIVITY_CM = 1; // Minimum change in centimeters to trigger an update
const DEBUG_MODEL_ALPHA = 0.3;

export class BodyManager implements IBodyManager {
  private modelRoot: TransformNode;
  private bodyHeight: number;
  private boundingBox: { min: Vector3; max: Vector3 };

  private debugElements: ReturnType<typeof createBodyDebugElements> | null = null;
  private bustMidPlane: TransformNode;
  private bustTopPlane: TransformNode;
  private bustBottomPlane: TransformNode;

  constructor(model: TransformNode, bodyHeight: number, boundingBox: { min: Vector3; max: Vector3 }) {
    this.modelRoot = model;
    this.bodyHeight = bodyHeight;
    this.boundingBox = boundingBox;

    this.debugElements = createBodyDebugElements(this.modelRoot.getScene(), boundingBox, model);

    this.modelRoot.getChildMeshes().forEach(mesh => {
      // For transparent meshes, set material alpha instead of mesh.hasVertexAlpha.
      // hasVertexAlpha expects per-vertex alpha data and can produce washed-out results.
      mesh.hasVertexAlpha = false;
      mesh.visibility = 1;

      const material = mesh.material;
      if (material) {
        material.alpha = DEBUG_MODEL_ALPHA;

        if ("transparencyMode" in material) {
          (material as Material & { transparencyMode: number }).transparencyMode = Material.MATERIAL_ALPHABLEND;
        }

        if ("needDepthPrePass" in material) {
          (material as Material & { needDepthPrePass: boolean }).needDepthPrePass = true;
        }
      } else {
        // Fallback when a mesh has no material assigned.
        mesh.visibility = DEBUG_MODEL_ALPHA;
      }

      console.debug(`${LOG_TAG} Set mesh transparency for debug visualization.`, {
        meshName: mesh.name,
        materialName: material?.name,
        alpha: material?.alpha,
      });
    });
    const rightBodyPartMesh = model.getChildren((child) => 
      child instanceof Mesh && child.name.includes("Right"), false)[0] as Mesh;

    console.info(`${LOG_TAG} Creating debug horizontal planes for bust measurements.`);

    this.bustMidPlane = createDebugHorizontalPlane(this.modelRoot.getScene(),
      Constants.MODEL_LOAD_BUST_MID_LINE_REL_HEIGHT * this.bodyHeight,
      rightBodyPartMesh, Color3.Magenta(), 30, 30);
    this.bustTopPlane = createDebugHorizontalPlane(this.modelRoot.getScene(),
      Constants.MODEL_LOAD_BUST_TOP_LINE_REL_HEIGHT * this.bodyHeight,
      rightBodyPartMesh, Color3.Red(), 25, 25);
    this.bustBottomPlane = createDebugHorizontalPlane(this.modelRoot.getScene(),
      Constants.MODEL_LOAD_BUST_BOTTOM_LINE_REL_HEIGHT * this.bodyHeight,
      rightBodyPartMesh, Color3.Blue(), 25, 25);
  }

  public async updateHeight(newHeight: number): Promise<boolean> {
    const deltaHeight = this.bodyHeight - newHeight;
    if (Math.abs(deltaHeight) < MINIMAL_CHANGE_SENSITIVITY_CM) {
      return false; // No significant change, no update needed
    }

    if (newHeight <= 100 || newHeight > 300) {
      console.warn(`${LOG_TAG} Requested height is out of reasonable bounds.`, {
        requestedHeight: newHeight,
      });
      return false; // Height out of reasonable bounds
    }

    this.debugElements?.scaling.scaleInPlace(newHeight / this.bodyHeight);
    this.bustMidPlane.translate(Vector3.Up(), deltaHeight);//.position.y = Constants.MODEL_LOAD_BUST_MID_LINE_REL_HEIGHT * newHeight;
    this.bustTopPlane.translate(Vector3.Up(), deltaHeight);//.position.y = Constants.MODEL_LOAD_BUST_TOP_LINE_REL_HEIGHT * newHeight;
    this.bustBottomPlane.translate(Vector3.Up(), deltaHeight);//.position.y = Constants.MODEL_LOAD_BUST_BOTTOM_LINE_REL_HEIGHT * newHeight;

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
