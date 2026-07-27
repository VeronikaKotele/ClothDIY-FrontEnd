import { Vector3, type Matrix } from "@babylonjs/core/Maths/math.vector.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import type { FloatArray } from "@babylonjs/core/types.js";

const LOG_TAG = "[3dTransformations]";

// Tolerance (in world units) used when comparing a vertex's height to the plane height,
// and when deduplicating intersection points that fall on a shared triangle vertex.
const PLANE_INTERSECTION_EPSILON = 1e-5;

/**
 * Computes the total length of the segment(s) formed by intersecting a mesh with a
 * horizontal plane (a constant world-space Y). This is used to measure circumferences
 * (e.g. bust/waist/hip) at a given height on the body model.
 *
 * The mesh is walked triangle-by-triangle in world space; each triangle contributes at
 * most one intersection segment, and the segments' lengths are summed.
 */
export function computeHorizontalPlaneIntersectionLength(mesh: Mesh, planeHeightY: number): number {
    const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
    const indices = mesh.getIndices();

    if (!positions || !indices) {
      console.warn(`${LOG_TAG} Mesh has no position/index data for intersection calculation.`, {
        meshName: mesh.name,
      });
      return 0;
    }

    mesh.computeWorldMatrix(true);
    const worldMatrix = mesh.getWorldMatrix();

    let totalLength = 0;

    for (let i = 0; i + 2 < indices.length; i += 3) {
      const v0 = getWorldVertex(positions, indices[i], worldMatrix);
      const v1 = getWorldVertex(positions, indices[i + 1], worldMatrix);
      const v2 = getWorldVertex(positions, indices[i + 2], worldMatrix);

      const segment = getTrianglePlaneIntersectionSegment(v0, v1, v2, planeHeightY);
      if (segment) {
        totalLength += Vector3.Distance(segment[0], segment[1]);
      }
    }

    return totalLength;
}


function getWorldVertex(positions: FloatArray, vertexIndex: number, worldMatrix: Matrix): Vector3 {
    const offset = vertexIndex * 3;
    const localPosition = new Vector3(positions[offset], positions[offset + 1], positions[offset + 2]);
    return Vector3.TransformCoordinates(localPosition, worldMatrix);
}

// Returns the two points where a triangle's edges cross the plane y = planeY, or null if the
// triangle does not cross the plane (fully above/below it, or only touches it at one vertex).
function getTrianglePlaneIntersectionSegment(
  v0: Vector3,
  v1: Vector3,
  v2: Vector3,
  planeY: number,
): [Vector3, Vector3] | null {
    const edges: [Vector3, Vector3][] = [
      [v0, v1],
      [v1, v2],
      [v2, v0],
    ];
    const points: Vector3[] = [];

    for (const [a, b] of edges) {
      const da = a.y - planeY;
      const db = b.y - planeY;

      if (Math.abs(da) < PLANE_INTERSECTION_EPSILON) {
        addUniqueIntersectionPoint(points, a);
      }

      // Opposite signs means the plane crosses this edge somewhere in between.
      if ((da > 0 && db < 0) || (da < 0 && db > 0)) {
        const t = da / (da - db);
        addUniqueIntersectionPoint(points, Vector3.Lerp(a, b, t));
      }
    }

    // A plane can only cross a (non-degenerate) triangle at 0, 1 (a single vertex/edge touch)
    // or 2 points (a proper segment). Anything else is a degenerate/coplanar case we ignore.
    if (points.length !== 2) {
      return null;
    }

    return [points[0], points[1]];
}

function addUniqueIntersectionPoint(points: Vector3[], point: Vector3) {
    const isDuplicate = points.some(
      (existing) => Vector3.DistanceSquared(existing, point) < PLANE_INTERSECTION_EPSILON * PLANE_INTERSECTION_EPSILON,
    );
    if (!isDuplicate) {
      points.push(point);
    }
}