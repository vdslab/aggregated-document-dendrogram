import * as d3 from "d3";

function calculateAngle(node) {
  if (node.t) {
    return node.t;
  }
  if (node.children) {
    let s = 0;
    for (const child of node.children) {
      s += calculateAngle(child);
    }
    node.t = s / node.children.length;
  } else {
    node.t = (node.startAngle + node.endAngle) / 2;
  }
  return node.t;
}

export function layoutDendrogram({ root, distanceThreshold, radius }) {
  const pie = d3
    .pie()
    .sortValues(() => 0)
    .padAngle(Math.PI / 180)
    .value((node) => node.leafCount);
  for (const item of pie(root.leaves())) {
    item.data.startAngle = item.startAngle;
    item.data.endAngle = item.endAngle;
    item.data.padAngle = item.padAngle;
  }
  calculateAngle(root);
  for (const node of root) {
    if (node.children) {
      node.r =
        (node.data.data.distance - root.data.data.distance) /
        (distanceThreshold - root.data.data.distance);
    } else {
      node.r = 1;
    }
    node.r *= radius;
  }
}

export function distanceBinarySearch(root, limitNumberOfLeaves = 10) {
  const numberBusinessThreshold = 100;
  if (root.leaves().length < numberBusinessThreshold) {
    return 0;
  } else {
    let left = 0;
    let right = 10000;
    for (let i = 0; i < 100; i++) {
      const mid = (left + right) / 2;
      const numberLeaves = summarizeDendrogram(root, mid).leaves().length;
      if (numberLeaves <= limitNumberOfLeaves) {
        right = mid;
      } else {
        left = mid;
      }
    }
    return right;
  }
}

export function initialRoot(searchParams, originalRoot) {
  if (searchParams.has("root")) {
    const rootId = searchParams.get("root");
    const root = originalRoot.find((node) => node.data.id === rootId);
    if (root) {
      return root;
    }
  }
  return originalRoot;
}

export function initialDistanceThreshold(searchParams, root) {
  if (searchParams.has("distanceThreshold")) {
    const distanceThreshold = +searchParams.get("distanceThreshold");
    if (distanceThreshold > 0) {
      return distanceThreshold;
    }
  }
  return distanceBinarySearch(root);
}

export function summarizeDendrogram(root, distanceThreshold) {
  const intermediateNodeIds = new Set([root.data.id]);
  for (const node of root) {
    if (
      node.children &&
      (node.parent == null || intermediateNodeIds.has(node.parent.data.id)) &&
      node.children.every(
        (child) => child.data.data.distance >= distanceThreshold
      )
    ) {
      intermediateNodeIds.add(node.data.id);
    }
  }

  const displayLeafIds = new Set();
  for (const node of root) {
    if (
      !intermediateNodeIds.has(node.data.id) &&
      intermediateNodeIds.has(node.parent.data.id)
    ) {
      displayLeafIds.add(node.data.id);
    }
  }

  const data = root
    .descendants()
    .filter(
      (node) =>
        intermediateNodeIds.has(node.data.id) ||
        displayLeafIds.has(node.data.id)
    )
    .map((node) => node.data.data);
  return constructDendrogram(data, root.data.id);
}

export function constructDendrogram(data, rootId = null) {
  const stratify = d3
    .stratify()
    .id((d) => d.no)
    .parentId((d) => (d.no === rootId ? null : d.parent));
  return d3.hierarchy(stratify(data));
}
