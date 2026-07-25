import { Vector3, Quaternion } from "@babylonjs/core/Maths/math.vector.js";
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

export function applyTargetHeight(node: TransformNode, targetHeight: number, boundingBox?:{ min: Vector3; max: Vector3 }) {
    const updatedBoundingBox = boundingBox != undefined;
    if (!boundingBox) {
        boundingBox = getMeshesBoundingBox(node);
    }
    const boundsMin = boundingBox.min;
    const boundsMax = boundingBox.max;

    const size = boundsMax.subtract(boundsMin);
    const center = boundsMin.add(boundsMax).scale(0.5);
    const loadedBodyHeight = size.y;
    if (loadedBodyHeight <= 0) {
      console.warn(`${LOG_TAG} Loaded node has non-positive height.`, {
        loadedBodyHeight,
      });
      return;
    }

    const uniformScale = targetHeight / loadedBodyHeight;
    node.scaling.setAll(uniformScale);

    // const position = node.position.clone();
    // node.position = center.scale(-uniformScale);
    // node.scaling.setAll(uniformScale);
    // node.position = center.scale(-uniformScale);
    // node.scaling.setAll(uniformScale);
    // // With parent scale applied first, translation must also be scaled to keep center at origin.
    // node.position = center.scale(-uniformScale);
    // // Lift the node so its lowest point sits on y = 0.
    // const moveY = (size.y * uniformScale) / 2;
    // node.position.y += moveY;
    // console.info(`${LOG_TAG} Model transform applied.`, {
    //   uniformScale,
    //   size,
    //   position: node.position,
    // });

    if (updatedBoundingBox) {
        boundingBox.min = boundsMin.scale(uniformScale);
        boundingBox.max = boundsMax.scale(uniformScale);

        console.info(`${LOG_TAG} Model bounding box recalculated.`, {
          boundingBox,
        });
    }
}

export function placeNodeOnOrigin(node: TransformNode, boundingBox?:{ min: Vector3; max: Vector3 }) {
    const updatedBoundingBox = boundingBox != undefined;
    if (!boundingBox) {
        boundingBox = getMeshesBoundingBox(node);
    }
    const extraHeight = boundingBox.min.y;
    node.position.y -= extraHeight;

    if (updatedBoundingBox) {
        boundingBox.min.y = 0;
        boundingBox.max.y -= extraHeight;
        console.info(`${LOG_TAG} Model bounding box recalculated.`, {
          boundingBox,
        });
    }
}