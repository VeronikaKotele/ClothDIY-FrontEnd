import { Circumstance } from "../interfaces/structures.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import * as Constants from "../constants.js";
import { calculateCircumstance } from "./ComputationalGeometry.js";

export class BodyMeasurements {
  bust: Circumstance;
  bustTop: Circumstance;
  bustBottom: Circumstance;
  waist: Circumstance;
  hips: Circumstance;

  constructor(
    bodyHeight: number,
    modelRoot: TransformNode,
  ) {
    const rightBodyPartMesh = modelRoot.getChildren(
        (child) => child instanceof Mesh && child.name.includes("Right"),
        false,
        )[0] as Mesh;

    this.bust = calculateCircumstance(rightBodyPartMesh, {
        pivotPoint: new Vector3(0, Constants.MODEL_LOAD_BUST_MID_LINE_REL_HEIGHT * bodyHeight, 0), 
        normal: Vector3.Up(), 
        color: Color3.Magenta(), 
        size: { a: 30, b: 30 } 
    });
    this.bustTop = calculateCircumstance(rightBodyPartMesh, {
        pivotPoint: new Vector3(0, Constants.MODEL_LOAD_BUST_TOP_LINE_REL_HEIGHT * bodyHeight, 0), 
        normal: Vector3.Up(), 
        color: Color3.Red(), 
        size: { a: 25, b: 25 } 
    });
    this.bustBottom = calculateCircumstance(rightBodyPartMesh, {
        pivotPoint: new Vector3(0, Constants.MODEL_LOAD_BUST_BOTTOM_LINE_REL_HEIGHT * bodyHeight, 0), 
        normal: Vector3.Up(), 
        color: Color3.Blue(), 
        size: { a: 25, b: 25 } 
    });
    this.waist = calculateCircumstance(rightBodyPartMesh, {
        pivotPoint: new Vector3(0, Constants.MODEL_LOAD_WEIST_TO_HEIGHT_RATIO * bodyHeight, 0), 
        normal: Vector3.Up(), 
        color: Color3.Green(), 
        size: { a: 20, b: 20 } 
    });
    this.hips = calculateCircumstance(rightBodyPartMesh, {
        pivotPoint: new Vector3(0, Constants.MODEL_LOAD_HIPS_TO_HEIGHT_RATIO * bodyHeight, 0), 
        normal: Vector3.Up(), 
        color: Color3.Yellow(), 
        size: { a: 35, b: 35 } 
    });
  }
}
