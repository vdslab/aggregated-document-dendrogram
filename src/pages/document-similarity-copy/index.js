import React, { useEffect, useState } from "react";
import { render } from "react-dom";
import * as d3 from "d3";
const App = () => {
  const [data, setData] = useState([]);
  const dataPath = "./data/test.json";

  useEffect(() => {
    window
      .fetch(dataPath)
      .then((response) => response.json())
      .then((data) => {
        setData(data);
      });
  }, [dataPath]);

  return data.length === 0 ? (
    <div>loading</div>
  ) : (
    <div>
      <div className="hero is-info is-bold">
        <div className="hero-body">
          <div className="container"></div>
        </div>
      </div>

      <div className="App">
        <FormatData data={data} />
      </div>
    </div>
  );
};

const optimalFontSize = (word, r, fontFamily, fontWeight) => {
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.textContent = word;
  text.setAttributeNS(null, "font-family", fontFamily);
  text.setAttributeNS(null, "font-weight", fontWeight);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.appendChild(text);
  document.body.appendChild(svg);
  let ok = 0;
  let ng = 100;
  for (let iter = 0; iter < 10; ++iter) {
    let m = (ok + ng) / 2;
    text.setAttributeNS(null, "font-size", m);
    const { width, height } = text.getBBox();
    const d = Math.sqrt(width ** 2 + height ** 2) / 2;
    if (d <= r) {
      ok = m;
    } else {
      ng = m;
    }
  }
  document.body.removeChild(svg);
  return ok;
};

const aggregateWords = (item) => {
  const keys = ["pke", "tfidf", "okapi"];
  const countThreshold = 5;
  const words = {};
  for (const data of item.leaves()) {
    for (const key of keys) {
      for (const word of data.data.data[key]) {
        if (!(word.word in words)) {
          words[word.word] = 0;
        }
        words[word.word] += word.score;
      }
    }
  }
  return Object.entries(words)
    .filter((item) => {
      return item[1] >= countThreshold && item[0] !== "";
    })
    .map(([word, score]) => ({
      word,
      score,
    }));
};

const PhraseCircle = ({ item, x, y }) => {
  const data = { name: "root", children: aggregateWords(item) };
  const root = d3.hierarchy(data);
  root.sum((d) => {
    return d.score;
  });

  const circleSize = root.value + 100;
  const strokeColor = "#888";
  const pack = d3.pack().size([circleSize, circleSize]).padding(0);
  pack(root);
  const nodes = root.descendants();
  return nodes.map((node, i) => {
    if (node.data.name === "root") {
      return (
        <g
          key={i}
          transform={`translate(${x + node.x - circleSize / 2} ${
            y + node.y - circleSize / 2
          } )`}
        >
          <circle
            cx={0}
            cy={0}
            r={node.r}
            fillOpacity="100%"
            fill="white"
            stroke={strokeColor}
            style={{ transition: "cx 1s, cy 1s" }}
          ></circle>
        </g>
      );
    }
    return (
      <g
        key={i}
        transform={`translate(${x + node.x - circleSize / 2} ${
          y + node.y - circleSize / 2
        } )`}
      >
        <circle
          cx={0}
          cy={0}
          r={node.r}
          fillOpacity="50%"
          fill="#7d99ad"
          style={{ transition: "cx 1s, cy 1s" }}
        ></circle>
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={optimalFontSize(node.data.word, node.r)}
        >
          {node.data.word}
        </text>
      </g>
    );
  });
};

const FormatData = ({ data }) => {
  const contentR = 540;
  const contentWidth = contentR * 2;
  const contentHeight = contentR * 2;

  const stratify = d3
    .stratify()
    .id((d) => d.no)
    .parentId((d) => d.parent);
  const dataStratify = stratify(data);
  const root = d3.hierarchy(dataStratify);
  return (
    <DrawDendrogram
      originalRoot={root}
      contentR={contentR}
      contentHeight={contentHeight}
      contentWidth={contentWidth}
    />
  );
};

const DrawDendrogram = ({
  originalRoot,
  contentR,
  contentHeight,
  contentWidth,
}) => {
  const [distanceThreshold, setDistanceThreshold] = useState(1000);
  const [root, setRoot] = useState(originalRoot);

  const margin = {
    left: 160,
    right: 200,
    top: 75,
    bottom: 150,
  };
  const separation = 5;
  const scaleBase = 20;
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

  return (
    <div>
      <div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setDistanceThreshold(
              +event.target.elements.distanceThreshold.value
            );
          }}
        >
          <input
            name="distanceThreshold"
            className="input"
            type="number"
            min="0"
            defaultValue={distanceThreshold}
          />
        </form>
      </div>

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
                      <g key={`${source.data.data.no}:${target.data.data.no}`}>
                        <path
                          d={path.toString()}
                          stroke="#888"
                          fill="none"
                          style={{ transition: "d 1s" }}
                        ></path>
                      </g>
                    );
                  })}
              </g>
              <g>
                {nodes
                  .filter((node) => {
                    return node.data.data.distance >= distanceThreshold;
                  })
                  .filter((node) => {
                    return node.children.every(
                      (child) => child.data.data.distance >= distanceThreshold
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
                          setDistanceThreshold(distanceThreshold / scaleBase);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <circle cx={x} cy={y} r={20}></circle>
                      </g>
                    );
                  })}
              </g>
              <g>
                {nodes
                  .filter((node) => {
                    return node.data.data.distance >= distanceThreshold;
                  })
                  .filter((node) => {
                    return node.children.every(
                      (child) => child.data.data.distance < distanceThreshold
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
                          setDistanceThreshold(distanceThreshold / scaleBase);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <PhraseCircle item={item} x={x} y={y} />
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
};
render(<App />, document.querySelector("#content"));
