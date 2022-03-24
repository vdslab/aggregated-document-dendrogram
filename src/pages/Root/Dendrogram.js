import { useSearchParams } from "react-router-dom";
import * as d3 from "d3";
import {
  constructDendrogram,
  distanceBinarySearch,
  initialDistanceThreshold,
  initialRoot,
  layoutDendrogram,
  summarizeDendrogram,
} from "./utils";
import AggregatedLeaf from "./AggregatedLeaf";
import BirdEyeView from "./BirdEyeView";
import IntermediateNode from "./IntermediateNode";
import GroupLegend from "./GroupLegend";
import Leaf from "./Leaf";
import Link from "./Link";

function DendrogramContent({
  data,
  root,
  distanceThreshold,
  innerRadius,
  outerRadius,
  scoreBarHeight,
}) {
  const [, setSearchParams] = useSearchParams();

  const displayRoot = summarizeDendrogram(root, distanceThreshold);
  const leafCount = {};
  for (const node of root) {
    leafCount[node.data.id] = node.leaves().length;
  }
  for (const node of displayRoot.leaves()) {
    node.leafCount = leafCount[node.data.id];
  }
  layoutDendrogram({
    root: displayRoot,
    distanceThreshold,
    radius: innerRadius,
  });
  const scoreMax = d3.max(displayRoot.leaves(), (leaf) =>
    d3.max(leaf.data.data.words, ({ score }) => score)
  );
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
                scoreMax={scoreMax}
                scoreBarHeight={scoreBarHeight}
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

export default function Dendrogram({ data }) {
  const innerRadius = 300;
  const outerRadius = 310;
  const scoreBarHeight = 130;
  const contentWidth = (outerRadius + scoreBarHeight) * 2;
  const contentHeight = contentWidth;
  const birdEyeRadius = 150;
  const margin = {
    left: 10,
    right: birdEyeRadius * 2 + 10,
    top: 10,
    bottom: 10,
  };

  const [searchParams] = useSearchParams();
  const originalRoot = constructDendrogram(data);
  const root = initialRoot(searchParams, originalRoot);
  const distanceThreshold = initialDistanceThreshold(searchParams, root);

  return (
    <svg
      className="has-ratio"
      viewBox={`0,0,${contentWidth + margin.left + margin.right},${
        contentHeight + margin.top + margin.bottom
      }`}
    >
      <g transform={`translate(${margin.left},${margin.top})`}>
        <g transform={`translate(${contentWidth / 2}, ${contentHeight / 2})`}>
          <DendrogramContent
            data={data}
            root={root}
            distanceThreshold={distanceThreshold}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            scoreBarHeight={scoreBarHeight}
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
