import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color.js";
import { Material } from "@babylonjs/core/Materials/material.js";
import { Space } from "@babylonjs/core/Maths/math.axis.js";
import { EdgesRenderer } from "@babylonjs/core/Rendering/edgesRenderer.js";
import { BodyMeasurements } from "../components/BodyMeasurements.js";

import type { IBodyManager } from "../interfaces/3dSceneInterfaces.js";
import { DebugElements } from "./DebugSceneElements.js";

const LOG_TAG = "[BodyManager]";

const MINIMAL_CHANGE_SENSITIVITY_CM = 1; // Minimum change in centimeters to trigger an update
const DEBUG_MODEL_ALPHA = 0.3;

export class BodyManager implements IBodyManager {
  private modelRoot: TransformNode;
  private bodyHeight: number;
  private boundingBox: { min: Vector3; max: Vector3 };
  private bodyMeasurements: BodyMeasurements | null = null;
  private debugElements: DebugElements;

  constructor(
    model: TransformNode,
    bodyHeight: number,
    boundingBox: { min: Vector3; max: Vector3 },
  ) {
    this.modelRoot = model;
    this.bodyHeight = bodyHeight;
    this.boundingBox = boundingBox;
    this.bodyMeasurements = new BodyMeasurements(
      this.bodyHeight,
      this.modelRoot,
    );

    this.debugElements = new DebugElements(
      this.modelRoot.getScene(),
      this.boundingBox,
      this.bodyMeasurements,
    );

    this.makeTransparent();

    this.modelRoot.addChild(this.debugElements.rootNode);
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

    try {
      const scaleVector = new Vector3(1, newHeight / this.bodyHeight, 1);
      this.modelRoot.scaling.multiplyInPlace(scaleVector);
      this.debugElements?.boundingBoxLines.scaling.multiplyInPlace(scaleVector);
      this.bodyHeight = newHeight;
      this.boundingBox.max.y = this.bodyHeight;
    } catch (error) {
      console.error(`${LOG_TAG} Failed to update body height.`, error);
      return false; // Update failed
    }

    return true; // Update applied successfully
  }

  private makeTransparent(): void {
    this.modelRoot.getChildMeshes().forEach((mesh) => {
      const edgesRenderer = new EdgesRenderer(mesh);
      mesh.enableEdgesRendering();
      mesh.edgesWidth = 4.0;
      mesh.edgesColor = new Color4(0, 0, 1, DEBUG_MODEL_ALPHA);

      const material = mesh.material;
      if (material) {
        material.alpha = DEBUG_MODEL_ALPHA;

        if ("transparencyMode" in material) {
          (
            material as Material & { transparencyMode: number }
          ).transparencyMode = Material.MATERIAL_ALPHABLEND;
        }

        if ("needDepthPrePass" in material) {
          (
            material as Material & { needDepthPrePass: boolean }
          ).needDepthPrePass = true;
        }
      } else {
        mesh.material = new Material(
          "defaultTransparentMaterial",
          this.modelRoot.getScene(),
        );
        mesh.material.alpha = DEBUG_MODEL_ALPHA;
      }
    });
  }
}

