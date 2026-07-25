import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";

export type BodyModel = {
  modelRoot: TransformNode;
  bodyHeight: number;
  boundingBox: { min: Vector3; max: Vector3 };
}