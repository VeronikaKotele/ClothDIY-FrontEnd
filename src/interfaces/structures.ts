import type { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import type { Color3 } from "@babylonjs/core/Maths/math.color.js";

export type BodyModel = {
  modelRoot: TransformNode;
  bodyHeight: number;
  boundingBox: { min: Vector3; max: Vector3 };
};

export interface Plane {
  pivotPoint: Vector3;
  normal: Vector3;
  color: Color3;
  size: { a: number; b: number };
}

export type Segment = [Vector3, Vector3];
export type Segments = Segment[];

export interface Circumstance {
  cuttingPlane: Plane;
  circumference: number;
  segments: Segments;
}

export interface BodyMeasurements {
  bust: Circumstance;
  bustTop: Circumstance;
  bustBottom: Circumstance;
  waist: Circumstance;
  hips: Circumstance;
}
