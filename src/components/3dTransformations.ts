import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";

const LOG_TAG = "[3dTransformations]";

export function getMeshesBoundingBox(node: TransformNode): { min: Vector3; max: Vector3 } {
  const meshes = node.getChildMeshes();

  const boundsMin = new Vector3(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  );
  const boundsMax = new Vector3(
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  );

  meshes.forEach((mesh) => {
    if (mesh.getTotalVertices() === 0) {
      return;
    }

    mesh.computeWorldMatrix(true);
    const boundingInfo = mesh.getBoundingInfo();
    const min = boundingInfo.boundingBox.minimumWorld;
    const max = boundingInfo.boundingBox.maximumWorld;

    boundsMin.x = Math.min(boundsMin.x, min.x);
    boundsMin.y = Math.min(boundsMin.y, min.y);
    boundsMin.z = Math.min(boundsMin.z, min.z);

    boundsMax.x = Math.max(boundsMax.x, max.x);
    boundsMax.y = Math.max(boundsMax.y, max.y);
    boundsMax.z = Math.max(boundsMax.z, max.z);
  });

  return { min: boundsMin, max: boundsMax };
}

