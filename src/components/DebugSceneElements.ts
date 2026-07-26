import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { AxesViewer } from "@babylonjs/core/Debug/axesViewer.js";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { BoundingInfo } from "@babylonjs/core/Culling/boundingInfo.js";

export function createSceneDebugElements(scene: Scene)
{
    // 1. Worlds axes
    const axes = new AxesViewer(scene, 10);
    // 2. Ground plane
    const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
    // 3. Y dimension ruler
    const rulerY = MeshBuilder.CreateLines("rulerY", { points: [new Vector3(-50, 0, 0), new Vector3(-50, 200, 0)] }, scene);
    const rulerYText = MeshBuilder.CreatePlane("rulerYText", { width: 40, height: 10 }, scene);
    rulerYText.position = new Vector3(-50, 205, 0);
    rulerYText.billboardMode = 7; // Make the label always face the camera

    const rulerYTextTexture = new DynamicTexture("rulerYTextTexture", { width: 1024, height: 256 }, scene, true);
    rulerYTextTexture.hasAlpha = true;
    rulerYTextTexture.drawText("Height in cm: 200", null, 180, "bold 96px Arial", "white", "transparent", true);

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
    modelRoot?: TransformNode)
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
    boundingBoxLines.color = new Color3(1, 0, 0);
}