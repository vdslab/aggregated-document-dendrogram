import { useEffect, useState } from "react";
import * as d3 from "d3";
import PhraseCircle from "./PhraseCircle";
import Leaf from "./Leaf";
import Link from "./Link";
import IntermediateNode from "./IntermediateNode";

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
      const target = 10;
      if (numberLeaves <= target) {
        right = mid;
      } else {
        left = mid;
      }
    }
    return right;
  }
}

export default function Dendrogram({
  originalRoot,
  contentR,
  contentHeight,
  contentWidth,
}) {
  const [root, setRoot] = useState(originalRoot);
  const [distanceThreshold, setDistanceThreshold] = useState(
    distanceBinarySearch(root)
  );
  const [wordClusterData, setWordClusterData] = useState([]);
  const wordClusterPath = "./data/word_cluster1123.json";
  useEffect(() => {
    window
      .fetch(wordClusterPath)
      .then((response) => response.json())
      .then((wordClusterData) => {
        setWordClusterData(wordClusterData);
      });
  }, [wordClusterPath]);

  const margin = {
    left: 160,
    right: 200,
    top: 75,
    bottom: 150,
  };
  const separation = 5;
  const scaleBase = 2;
  const nodes = root.descendants();
  const links = root.links();
  const cluster = d3
    .cluster()
    .size([Math.PI * 2, contentR])
    .separation(() => separation);
  cluster(root);
  const radiusScale = d3
    .scaleLog()
    .domain(
      d3.extent(
        nodes.filter((node) => {
          return node.data.data.distance >= distanceThreshold;
        }),
        (d) => d.data.data.distance + 1
      )
    )
    .range([contentR, 0])
    .base(scaleBase)
    .nice();
  for (const node of nodes) {
    node.r = radiusScale(node.data.data.distance + 1);
  }
  let hashList = nodes
    .filter((node) => {
      return node.data.data.distance > distanceThreshold;
    })
    .filter((node) => {
      return node.children.every(
        (child) => child.data.data.distance <= distanceThreshold
      );
    });
  let tempList = hashList.map((item) => {
    return item.leaves().length;
  });
  const max =
    hashList[tempList.indexOf(Math.max.apply(null, tempList))].leaves().length;
  const min =
    hashList[tempList.indexOf(Math.min.apply(null, tempList))].leaves().length;
  const circleScale = d3.scaleLinear().domain([min, max]).range([100, 200]);

  const displayLinks = links.filter(({ source, target }) => {
    return (
      source.data.data.distance >= distanceThreshold &&
      target.data.data.distance >= distanceThreshold
    );
  });

  const displayNodes = nodes.filter((node) => {
    return node.data.data.distance >= distanceThreshold;
  });

  const intermediateNodes = displayNodes.filter((node) => {
    return (
      distanceThreshold > 0 &&
      node.children.every(
        (child) => child.data.data.distance > distanceThreshold
      )
    );
  });
  const phraseCircles = displayNodes.filter((node) => {
    return (
      distanceThreshold > 0 &&
      node.children.every(
        (child) => child.data.data.distance <= distanceThreshold
      )
    );
  });

  return (
    <svg
      width={contentWidth + margin.left + margin.right}
      height={contentHeight + margin.top + margin.bottom}
    >
      <g
        transform={`translate(${contentWidth / 2 + margin.left}, ${
          contentHeight / 2 + margin.top
        })`}
      >
        <g>
          {displayLinks.map(({ source, target }) => {
            return (
              <Link
                key={`${source.data.data.no}:${target.data.data.no}`}
                source={source}
                target={target}
              />
            );
          })}
        </g>
        <g>
          {distanceThreshold !== 0 &&
            intermediateNodes.map((item) => {
              return (
                <IntermediateNode
                  key={item.data.data.no}
                  item={item}
                  onClick={() => {
                    setRoot(item);
                    setDistanceThreshold(distanceBinarySearch(item));
                  }}
                />
              );
            })}
        </g>
        <g>
          {distanceThreshold !== 0 &&
            phraseCircles.map((item) => {
              return (
                <PhraseCircle
                  key={item.data.data.no}
                  item={item}
                  wordClusterData={wordClusterData}
                  circleSize={circleScale(item.leaves().length)}
                  distanceThreshold={distanceThreshold}
                  onClick={() => {
                    setRoot(item);
                    setDistanceThreshold(distanceBinarySearch(item));
                  }}
                />
              );
            })}
        </g>
        <g>
          {displayNodes
            .filter((node) => {
              return node.data.data.distance === 0;
            })
            .map((item) => {
              return <Leaf key={item.data.data.no} item={item} />;
            })}
        </g>
      </g>
    </svg>
  );
}
