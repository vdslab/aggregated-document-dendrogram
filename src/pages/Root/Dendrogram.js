import { useEffect, useState } from "react";
import * as d3 from "d3";
import PhraseCircle from "./PhraseCircle";

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

  return (
    <div>
      <div className="views" style={{ display: "flex" }}>
        <div>
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
                {links
                  .filter(({ source, target }) => {
                    return (
                      source.data.data.distance >= distanceThreshold &&
                      target.data.data.distance >= distanceThreshold
                    );
                  })
                  .map(({ source, target }) => {
                    if (source.y === 0) {
                      const x2 =
                        Math.cos(target.x) *
                        radiusScale(target.data.data.distance + 1);
                      const y2 =
                        Math.sin(target.x) *
                        radiusScale(target.data.data.distance + 1);
                      const x3 = 0;
                      const y3 = 0;
                      const path = d3.path();
                      path.moveTo(x2, y2);
                      path.lineTo(x3, y3);
                      return (
                        <g
                          key={`${source.data.data.no}:${target.data.data.no}`}
                        >
                          <path
                            d={path.toString()}
                            stroke="#888"
                            fill="none"
                            style={{ transition: "d 1s" }}
                          ></path>
                        </g>
                      );
                    } else {
                      const x2 =
                        Math.cos(target.x) *
                        radiusScale(target.data.data.distance + 1);
                      const y2 =
                        Math.sin(target.x) *
                        radiusScale(target.data.data.distance + 1);
                      const x3 =
                        Math.cos(target.x) *
                        radiusScale(source.data.data.distance + 1);
                      const y3 =
                        Math.sin(target.x) *
                        radiusScale(source.data.data.distance + 1);
                      const path = d3.path();
                      path.moveTo(x2, y2);
                      path.lineTo(x3, y3);
                      path.arc(
                        0,
                        0,
                        radiusScale(source.data.data.distance + 1),
                        target.x,
                        source.x,
                        Math.floor(
                          (source.x - target.x + 2 * Math.PI) / Math.PI
                        ) %
                          2 ===
                          1
                      );
                      return (
                        <g
                          key={`${source.data.data.no}:${target.data.data.no}`}
                        >
                          <path
                            d={path.toString()}
                            stroke="#888"
                            fill="none"
                            style={{ transition: "d 1s" }}
                          ></path>
                        </g>
                      );
                    }
                  })}
              </g>
              <g>
                {distanceThreshold !== 0 &&
                  nodes
                    .filter((node) => {
                      return node.data.data.distance > distanceThreshold;
                    })
                    .filter((node) => {
                      return node.children.every(
                        (child) => child.data.data.distance > distanceThreshold
                      );
                    })
                    .map((item) => {
                      let x = 0;
                      let y = 0;
                      if (item.y === 0) {
                      } else {
                        x =
                          Math.cos(item.x) *
                          radiusScale(item.data.data.distance + 1);
                        y =
                          Math.sin(item.x) *
                          radiusScale(item.data.data.distance + 1);
                      }
                      return (
                        <g
                          key={item.data.data.no}
                          onClick={() => {
                            setRoot(item);
                            setDistanceThreshold(distanceBinarySearch(item));
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <circle cx={x} cy={y} r={10}></circle>
                        </g>
                      );
                    })}
              </g>
              <g>
                {distanceThreshold !== 0 &&
                  nodes
                    .filter((node) => {
                      return node.data.data.distance > distanceThreshold;
                    })
                    .filter((node) => {
                      return node.children.every(
                        (child) => child.data.data.distance <= distanceThreshold
                      );
                    })
                    .map((item) => {
                      const x =
                        Math.cos(item.x) *
                        radiusScale(item.data.data.distance + 1);
                      const y =
                        Math.sin(item.x) *
                        radiusScale(item.data.data.distance + 1);
                      return (
                        <g
                          key={item.data.data.no}
                          onClick={() => {
                            setRoot(item);
                            setDistanceThreshold(distanceBinarySearch(item));
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <PhraseCircle
                            item={item}
                            x={x}
                            y={y}
                            wordClusterData={wordClusterData}
                            circleSize={circleScale(item.leaves().length)}
                            distanceThreshold={distanceThreshold}
                          />
                        </g>
                      );
                    })}
              </g>
              <g>
                {nodes
                  .filter((node) => {
                    return (
                      node.data.data.distance >= distanceThreshold &&
                      node.data.data.distance === 0
                    );
                  })
                  .map((item) => {
                    const x =
                      Math.cos(item.x) *
                      radiusScale(item.data.data.distance + 1);
                    const y =
                      Math.sin(item.x) *
                      radiusScale(item.data.data.distance + 1);
                    return (
                      <g key={item.data.data.no} style={{ cursor: "pointer" }}>
                        <text
                          x={x}
                          y={y}
                          textAnchor={x >= 0 ? "start" : "end"}
                          dominantBaseline={
                            y >= 0 ? "text-before-edge" : "text-after-edge"
                          }
                          fontSize={10}
                        >
                          {item.data.data["Title"]}
                        </text>
                      </g>
                    );
                  })}
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
