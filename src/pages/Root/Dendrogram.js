import { useSearchParams } from "react-router-dom";
import * as d3 from "d3";
import { layoutDendrogram } from "./layoutDendrogram";
import AggregatedLeaf from "./AggregatedLeaf";
import BirdEyeView from "./BirdEyeView";
import IntermediateNode from "./IntermediateNode";
import GroupLegend from "./GroupLegend";
import Leaf from "./Leaf";
import Link from "./Link";

function distanceBinarySearch(item) {
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
      const target = 50;
      if (numberLeaves <= target) {
        right = mid;
      } else {
        left = mid;
      }
    }
    return right;
  }
}

function initialRoot(searchParams, originalRoot) {
  if (searchParams.has("root")) {
    const rootId = searchParams.get("root");
    const root = originalRoot.find((node) => node.data.id === rootId);
    if (root) {
      return root;
    }
  }
  return originalRoot;
}

function initialDistanceThreshold(searchParams, root) {
  if (searchParams.has("distanceThreshold")) {
    const distanceThreshold = +searchParams.get("distanceThreshold");
    if (distanceThreshold > 0) {
      return distanceThreshold;
    }
  }
  return distanceBinarySearch(root);
}

function DendrogramContent({
  data,
  root,
  distanceThreshold,
  innerRadius,
  outerRadius,
}) {
  const [, setSearchParams] = useSearchParams();

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
  const leafCount = {};
  for (const node of root.descendants()) {
    if (
      !intermediateNodeIds.has(node.data.id) &&
      intermediateNodeIds.has(node.parent.data.id)
    ) {
      displayLeafIds.add(node.data.id);
      leafCount[node.data.id] = node.leaves().length;
    }
  }

  const stratify = d3
    .stratify()
    .id((d) => d.no)
    .parentId((d) => d.parent)
    .parentId((item) =>
      intermediateNodeIds.has(item.parent) ? item.parent : null
    );
  const displayRoot = d3.hierarchy(
    stratify(
      data.filter(
        ({ no }) => intermediateNodeIds.has(no) || displayLeafIds.has(no)
      )
    )
  );
  for (const node of displayRoot.leaves()) {
    node.leafCount = leafCount[node.data.id];
  }
  layoutDendrogram({
    root: displayRoot,
    distanceThreshold,
    radius: innerRadius,
  });
  return (
    <>
      <g>
        {displayRoot.links().map(({ source, target }) => {
          return (
            <Link
              key={`${source.data.id}:${target.data.id}`}
              source={source}
              target={target}
            />
          );
        })}
      </g>
      <g>
        {distanceThreshold !== 0 &&
          displayRoot
            .descendants()
            .filter((node) => node.children)
            .map((item) => {
              return (
                <IntermediateNode
                  key={item.data.id}
                  item={item}
                  onClick={() => {
                    setSearchParams({
                      distanceThreshold: distanceBinarySearch(item),
                      root: item.data.id,
                    });
                  }}
                />
              );
            })}
      </g>
      <g>
        {distanceThreshold !== 0 &&
          displayRoot.leaves().map((item) => {
            return (
              <AggregatedLeaf
                key={item.data.id}
                item={item}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                onClick={() => {
                  setSearchParams({
                    distanceThreshold: distanceBinarySearch(item),
                    root: item.data.id,
                  });
                }}
              />
            );
          })}
      </g>
      <g>
        {displayRoot
          .leaves()
          .filter((node) => {
            return node.data.data.distance === 0;
          })
          .map((item) => {
            return <Leaf key={item.data.id} item={item} />;
          })}
      </g>
    </>
  );
}

export default function Dendrogram({
  data,
  innerRadius,
  outerRadius,
  contentHeight,
  contentWidth,
}) {
  const birdEyeRadius = 150;
  const margin = {
    left: 100,
    right: birdEyeRadius * 2 + 10,
    top: 100,
    bottom: 100,
  };

  const [searchParams] = useSearchParams();
  const stratify = d3
    .stratify()
    .id((d) => d.no)
    .parentId((d) => d.parent);
  const dataStratify = stratify(data);
  const originalRoot = d3.hierarchy(dataStratify);
  const root = initialRoot(searchParams, originalRoot);
  const distanceThreshold = initialDistanceThreshold(searchParams, root);

  return (
    <svg
      width={contentWidth + margin.left + margin.right}
      height={contentHeight + margin.top + margin.bottom}
    >
      <g transform={`translate(${margin.left},${margin.top})`}>
        <g transform={`translate(${contentWidth / 2}, ${contentHeight / 2})`}>
          <DendrogramContent
            data={data}
            root={root}
            distanceThreshold={distanceThreshold}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
          />
        </g>
        <g
          transform={`translate(${contentWidth}, ${
            contentHeight - birdEyeRadius * 2
          })`}
        >
          <BirdEyeView
            originalRoot={originalRoot}
            root={root}
            distanceThreshold={distanceThreshold}
            radius={birdEyeRadius}
          />
        </g>
        <g transform={`translate(${contentWidth})`}>
          <GroupLegend groups={data.at(-1).groups} />
        </g>
      </g>
    </svg>
  );
}
