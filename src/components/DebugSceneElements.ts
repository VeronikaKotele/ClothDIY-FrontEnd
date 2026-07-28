import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { LinesMesh } from "@babylonjs/core/Meshes/linesMesh.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { AxesViewer } from "@babylonjs/core/Debug/axesViewer.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { computeHorizontalPlaneIntersectionSegments, segmentLength, computeConvexHull, removeMedianCavitations } from "./ComputationalGeometry.js";

const LOG_TAG = "[DebugSceneElements]";

export function createSceneDebugElements(scene: Scene)
{
    // 1. Worlds axes
    const axes = new AxesViewer(scene, 10);
    // 2. Ground plane
    const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
    ground.visibility = 0.1;
    // 3. Y dimension ruler
    const rulerY = MeshBuilder.CreateLines("rulerY", { points: [new Vector3(-50, 0, 0), new Vector3(-50, 200, 0)] }, scene);
    const rulerYText = MeshBuilder.CreatePlane("rulerYText", { width: 40, height: 10 }, scene);
    rulerYText.position = new Vector3(-50, 205, 0);
    rulerYText.billboardMode = 7; // Make the label always face the camera

    const rulerYTextTexture = new DynamicTexture("rulerYTextTexture", { width: 1024, height: 256 }, scene, true);
    rulerYTextTexture.hasAlpha = true;
    rulerYTextTexture.drawText("Висота в см: 200", null, 180, "bold 96px Arial", "white", "transparent", true);

    const rulerYTextMaterial = new StandardMaterial("rulerYTextMaterial", scene);
    rulerYTextMaterial.diffuseTexture = rulerYTextTexture;
    rulerYTextMaterial.emissiveColor = Color3.White();
    rulerYTextMaterial.disableLighting = true;
    rulerYTextMaterial.backFaceCulling = false;

    rulerYText.material = rulerYTextMaterial;

    for (let i = 0; i <= 200; i += 10) {
      const tick = MeshBuilder.CreateLines(`tickY_${i}`, { points: [new Vector3(-50, i, 0), new Vector3(-48, i, 0)] }, scene);
    }
}

export function createBodyDebugElements(scene: Scene,
    boundingBox: { min: Vector3; max: Vector3 },
    modelRoot?: TransformNode): LinesMesh
{
    const min = boundingBox.min;
    const max = boundingBox.max;

    const p000 = new Vector3(min.x, min.y, min.z);
    const p001 = new Vector3(min.x, min.y, max.z);
    const p010 = new Vector3(min.x, max.y, min.z);
    const p011 = new Vector3(min.x, max.y, max.z);
    const p100 = new Vector3(max.x, min.y, min.z);
    const p101 = new Vector3(max.x, min.y, max.z);
    const p110 = new Vector3(max.x, max.y, min.z);
    const p111 = new Vector3(max.x, max.y, max.z);

    const boundingBoxLines = MeshBuilder.CreateLineSystem("boundingBoxLines", {
        lines: [
            [p000, p001], [p000, p010], [p000, p100],
            [p111, p110], [p111, p101], [p111, p011],
            [p001, p011], [p001, p101],
            [p010, p011], [p010, p110],
            [p100, p101], [p100, p110],
        ],
    }, scene);
    boundingBoxLines.color = Color3.White();

    return boundingBoxLines;
}

export function calculateCircumstance(
    scene: Scene, height: number, model: Mesh, color: Color3, xSize: number, zSize: number): TransformNode {
    const parentNode = new TransformNode("debugHorizontalPlaneParent", scene);
    const plane = MeshBuilder.CreatePlane("debugHorizontalPlane", { width: xSize, height: zSize }, scene);
    plane.position = new Vector3(0, height, 0);
    plane.rotation = new Vector3(Math.PI / 2, 0, 0);
    plane.visibility = 0.3;
    plane.parent = parentNode;
    const planeMaterial = new StandardMaterial("debugHorizontalPlaneMaterial", scene);
    planeMaterial.diffuseColor = color;
    planeMaterial.emissiveColor = color;
    planeMaterial.disableLighting = true;
    planeMaterial.backFaceCulling = false;
    plane.material = planeMaterial;
    plane.isPickable = false;

    // Calculate the length of intersection between the plane and the model mesh.
    // `model` is only the "Right" half of the (symmetric) body mesh, so double it to
    // approximate the full circumference at this height.
    const segments = computeHorizontalPlaneIntersectionSegments(model, height, xSize, zSize);
    //const segments = computeConvexHull(exactSegments);
    removeMedianCavitations(segments);
    let halfIntersectionLength = 0;
    for (const segment of segments) {
        halfIntersectionLength += segmentLength(segment);
    }
    const circumference = halfIntersectionLength * 2;
    const segmentsLines = MeshBuilder.CreateLineSystem("segmentsLines", {
        lines: [...segments, ...segments.map(([start, end]) => {
            const reversedStart = new Vector3(-start.x, start.y, start.z);
            const reversedEnd = new Vector3(-end.x, end.y, end.z);
            return [reversedStart, reversedEnd];
        })], // Add reversed segments to make lines visible from both sides
    }, scene);
    segmentsLines.color = color;
    segmentsLines.parent = parentNode;

    console.info(`${LOG_TAG} Computed horizontal plane intersection.`, {
      height,
      halfIntersectionLength,
      circumference,
    });

    const labelText = MeshBuilder.CreatePlane("debugHorizontalPlaneLabel", { width: 30, height: 10 }, scene);
    labelText.position = new Vector3(15, height + 5, -15);
    labelText.billboardMode = 7; // Make the label always face the camera
    labelText.parent = parentNode;

    const labelTexture = new DynamicTexture("debugHorizontalPlaneLabelTexture", { width: 400, height: 100 }, scene, true);
    labelTexture.hasAlpha = true;
    labelTexture.drawText(`${circumference.toFixed(1)} см`, null, 100, "bold 26px Arial", "white", "transparent", true);

    const labelMaterial = new StandardMaterial("debugHorizontalPlaneLabelMaterial", scene);
    labelMaterial.diffuseTexture = labelTexture;
    labelMaterial.emissiveColor = color;
    labelMaterial.disableLighting = true;
    labelMaterial.backFaceCulling = false;

    labelText.material = labelMaterial;

    return parentNode;
}