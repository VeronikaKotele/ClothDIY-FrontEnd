import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color.js";
import { Material } from "@babylonjs/core/Materials/material.js";
import { Space } from "@babylonjs/core/Maths/math.axis.js";
import { EdgesRenderer } from "@babylonjs/core/Rendering/edgesRenderer.js";

import { applyTargetHeight } from "./3dTransformations.js";
import type { IBodyManager } from "../interfaces/3dSceneInterfaces.js";
import { createBodyDebugElements, calculateCircumstance } from "./DebugSceneElements.js";

import * as Constants from "../constants.js";

const LOG_TAG = "[BodyManager]";

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
      const edgesRenderer = new EdgesRenderer(mesh);
      mesh.enableEdgesRendering();
      mesh.edgesWidth = 4.0;
      mesh.edgesColor = new Color4(0, 0, 1, DEBUG_MODEL_ALPHA);
      // mesh.edgesShareWithInstances = true;
      // mesh.alphaIndex = 1;
      // mesh.renderingGroupId = 1;

      // For transparent meshes, set material alpha instead of mesh.hasVertexAlpha.
      // hasVertexAlpha expects per-vertex alpha data and can produce washed-out results.
      // mesh.hasVertexAlpha = false;
      // mesh.visibility = 1;

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
        // mesh.visibility = DEBUG_MODEL_ALPHA;
        mesh.material = new Material("defaultTransparentMaterial", this.modelRoot.getScene());
        mesh.material.alpha = DEBUG_MODEL_ALPHA;
      }
    });
    const rightBodyPartMesh = model.getChildren((child) => 
      child instanceof Mesh && child.name.includes("Right"), false)[0] as Mesh;

    this.bustMidPlane = calculateCircumstance(this.modelRoot.getScene(),
      Constants.MODEL_LOAD_BUST_MID_LINE_REL_HEIGHT * this.bodyHeight,
      rightBodyPartMesh, Color3.Magenta(), 30, 30);
    this.bustTopPlane = calculateCircumstance(this.modelRoot.getScene(),
      Constants.MODEL_LOAD_BUST_TOP_LINE_REL_HEIGHT * this.bodyHeight,
      rightBodyPartMesh, Color3.Red(), 25, 25);
    this.bustBottomPlane = calculateCircumstance(this.modelRoot.getScene(),
      Constants.MODEL_LOAD_BUST_BOTTOM_LINE_REL_HEIGHT * this.bodyHeight,
      rightBodyPartMesh, Color3.Blue(), 25, 25);

    this.bustMidPlane.setParent(this.debugElements);
    this.bustTopPlane.setParent(this.debugElements);
    this.bustBottomPlane.setParent(this.debugElements);
  }

  public async updateHeight(newHeight: number): Promise<boolean> {
    const deltaHeight = newHeight - this.bodyHeight;
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
