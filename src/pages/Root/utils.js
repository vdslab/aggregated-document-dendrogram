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

export function distanceBinarySearch(item, limitNumberOfLeaves = 50) {
  const numberBusinessThreshold = 100;
  if (item.leaves().length < numberBusinessThreshold) {
    return 0;
  } else {
    let left = 0;
    let right = 10000;
    for (let i = 0; i < 50; i++) {
      const mid = (left + right) / 2;
      const numberLeaves = item
        .descendants()
        .filter((node) => {
          return node.data.data.distance >= mid;
        })
        .filter((node) => {
          return node.children.every((child) => child.data.data.distance < mid);
        }).length;
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
