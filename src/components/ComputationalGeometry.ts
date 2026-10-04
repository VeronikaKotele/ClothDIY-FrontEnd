import { Vector3, type Matrix } from "@babylonjs/core/Maths/math.vector.js";
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import type { FloatArray } from "@babylonjs/core/types.js";
import { Circumstance, Plane, Segment, Segments } from "../interfaces/structures.js";

const LOG_TAG = "[ComputationalGeometry]";

// Tolerance (in world units) used when comparing a vertex's height to the plane height,
// and when deduplicating intersection points that fall on a shared triangle vertex.
const PLANE_INTERSECTION_EPSILON = 1e-5;

/**
 * Find all the segment(s) formed by intersecting a mesh with a
 * horizontal plane (a constant world-space Y). This is used to measure circumferences
 * (e.g. bust/waist/hip) at a given height on the body model.
 *
 * The mesh is walked triangle-by-triangle in world space; each triangle contributes at
 * most one intersection segment, and the segments' lengths are summed.
 */
export function computeHorizontalPlaneIntersectionSegments(
  mesh: Mesh,
  planeHeightY: number,
  xSize: number,
  zSize: number,
): Segments {
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
  const indices = mesh.getIndices();

  if (!positions || !indices) {
    console.warn(
      `${LOG_TAG} Mesh has no position/index data for intersection calculation.`,
      {
        meshName: mesh.name,
      },
    );
    return [];
  }

  mesh.computeWorldMatrix(true);
  const worldMatrix = mesh.getWorldMatrix();

  const segments: [Vector3, Vector3][] = [];

  for (let i = 0; i + 2 < indices.length; i += 3) {
    const v0 = getWorldVertex(positions, indices[i], worldMatrix);
    const v1 = getWorldVertex(positions, indices[i + 1], worldMatrix);
    const v2 = getWorldVertex(positions, indices[i + 2], worldMatrix);

    const segment = getTrianglePlaneIntersectionSegment(
      v0,
      v1,
      v2,
      planeHeightY,
      xSize,
      zSize,
    );
    if (segment) {
      segments.push(segment);
    }
  }

  return segments;
}

export function segmentLength(segment: Segment): number {
  return Vector3.Distance(segment[0], segment[1]);
}

export function removeMedianCavitations(segments: Segments) {
  if (segments.length === 0) {
    return;
  }

  let mostFrontPoint: Vector3 = segments[0][0];
  let mostBackPoint: Vector3 = segments[0][0];
  for (const [start, end] of segments) {
    if (start.z < mostFrontPoint.z) {
      mostFrontPoint = start;
    }
    if (end.z < mostFrontPoint.z) {
      mostFrontPoint = end;
    }
    if (start.z > mostBackPoint.z) {
      mostBackPoint = start;
    }
    if (end.z > mostBackPoint.z) {
      mostBackPoint = end;
    }
  }

  for (const [start, end] of segments) {
    if (start.z < 0 && end.z < 0) {
      if (
        start.x < mostFrontPoint.x && // median to the most front point
        start.z > mostFrontPoint.z
      ) // caviates
      {
        start.z = mostFrontPoint.z;
      }
      if (
        end.x < mostFrontPoint.x && // median to the most front point
        end.z > mostFrontPoint.z
      ) // caviates
      {
        end.z = mostFrontPoint.z;
      }
    } else if (start.z > 0 && end.z > 0) {
      if (
        start.x < mostBackPoint.x && // median to the most back point
        start.z < mostBackPoint.z
      ) // caviates
      {
        start.z = mostBackPoint.z;
      }
      if (
        end.x < mostBackPoint.x && // median to the most back point
        end.z < mostBackPoint.z
      ) // caviates
      {
        end.z = mostBackPoint.z;
      }
    }
  }
}

/**
 * Computes the convex hull of the point cloud formed by a set of segments and returns
 * the hull boundary as a list of segments. The input segments are expected to lie on a
 * (roughly) constant world-space Y, e.g. the output of `computeHorizontalPlaneIntersectionSegments`;
 * the hull is computed in the XZ plane (Y is ignored/carried through unchanged).
 *
 * The returned segments form the hull boundary but are NOT guaranteed to be in any
 * particular winding order relative to the input - callers should not assume the array
 * is pre-sorted into a continuous walk.
 */
export function computeConvexHull(segments: Segments): Segments {
  if (segments.length === 0) {
    return [];
  }

  const points = collectUniquePoints(segments);
  if (points.length < 3) {
    return [];
  }

  const hullPoints = computeConvexHullXZ(points);
  if (hullPoints.length < 3) {
    return [];
  }

  const hullSegments: Segments = [];
  for (let i = 0; i < hullPoints.length; i++) {
    const a = hullPoints[i];
    const b = hullPoints[(i + 1) % hullPoints.length];
    hullSegments.push([a, b]);
  }

  return hullSegments;
}

function collectUniquePoints(segments: Segments): Vector3[] {
  const points: Vector3[] = [];
  for (const [a, b] of segments) {
    addUniqueIntersectionPoint(points, a);
    addUniqueIntersectionPoint(points, b);
  }
  return points;
}

// Andrew's monotone chain algorithm, O(n log n). Operates on the X/Z coordinates only
// (points are assumed to share a common Y, since they come from a horizontal plane cut).
function computeConvexHullXZ(points: Vector3[]): Vector3[] {
  const sorted = [...points].sort((p1, p2) => p1.x - p2.x || p1.z - p2.z);

  // Cross product of (o -> a) and (o -> b) in the XZ plane. Positive means a->b turns left of o->a.
  const cross = (o: Vector3, a: Vector3, b: Vector3): number =>
    (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);

  const lower: Vector3[] = [];
  for (const p of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Vector3[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }

  // The last point of each half is the first point of the other half - drop the duplicates.
  lower.pop();
  upper.pop();

  return lower.concat(upper);
}

function getWorldVertex(
  positions: FloatArray,
  vertexIndex: number,
  worldMatrix: Matrix,
): Vector3 {
  const offset = vertexIndex * 3;
  const localPosition = new Vector3(
    positions[offset],
    positions[offset + 1],
    positions[offset + 2],
  );
  return Vector3.TransformCoordinates(localPosition, worldMatrix);
}

// Returns the two points where a triangle's edges cross the plane y = planeY, or null if the
// triangle does not cross the plane (fully above/below it, or only touches it at one vertex).
function getTrianglePlaneIntersectionSegment(
  v0: Vector3,
  v1: Vector3,
  v2: Vector3,
  planeY: number,
  xSize: number,
  zSize: number,
): [Vector3, Vector3] | null {
  for (const v of [v0, v1, v2]) {
    if (!isWithinXZBounds(v, xSize / 2, zSize / 2)) {
      return null;
    }
  }

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

function isWithinXZBounds(point: Vector3, xMax: number, yMax: number): boolean {
  return (
    point.x >= -xMax && point.x <= xMax && point.z >= -yMax && point.z <= yMax
  );
}

function addUniqueIntersectionPoint(points: Vector3[], point: Vector3) {
  const isDuplicate = points.some(
    (existing) =>
      Vector3.DistanceSquared(existing, point) <
      PLANE_INTERSECTION_EPSILON * PLANE_INTERSECTION_EPSILON,
  );
  if (!isDuplicate) {
    points.push(point);
  }
}

// Calculate the length of intersection between the plane and the model mesh.
// `halfModel` is only the "Right" half of the (symmetric) body mesh, so double it to
// approximate the full circumference at this height.
export function calculateCircumstance(
  halfModel: Mesh,
  plane: Plane,
): Circumstance {
  const segments: Segments = computeHorizontalPlaneIntersectionSegments(
    halfModel,
    plane.pivotPoint.y,
    plane.size.a,
    plane.size.b,
  );

  removeMedianCavitations(segments);

  let halfIntersectionLength = 0;
  for (const segment of segments) {
    halfIntersectionLength += segmentLength(segment);
  }
  const circumference = halfIntersectionLength * 2;

  return {
    cuttingPlane: plane,
    circumference,
    segments,
  };
}
