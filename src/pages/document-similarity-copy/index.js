import React, { useEffect, useState } from "react";
import { render } from "react-dom";
import * as d3 from "d3";
const App = () => {
  const [data, setData] = useState([]);
  const dataPath = "./data/plot_test_data_25_DB_16_3.json";

  useEffect(() => {
    window
      .fetch(dataPath)
      .then((response) => response.json())
      .then((data) => {
        d3.forceSimulation(data)
          .force(
            "collide",
            d3
              .forceCollide()
              .radius(function (d) {
                return Math.pow(d.count, 0.7) + 8.5;
              })

              .strength(0.015)
              .iterations(30)
          )
          .force("charge", d3.forceManyBody().strength(1))
          .force("center", d3.forceCenter())
          .on("end", () => {
            setData(data);
          });
      });
  }, []);

  if (data.length === 0) {
    return <div>loading</div>;
  } else {
    return (
      <div>
        <div className="hero is-info is-bold">
          <div className="hero-body">
            <div className="container"></div>
          </div>
        </div>

        <div className="App">
          <DrawDendrogram data={data} />
        </div>
      </div>
    );
  }
};

const DrawDendrogram = ({ word }) => {
  const [data, setData] = useState([]);
  const [phrase, setPhrase] = useState([]);
  const [projectData, setProjectData] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [ministries, setMinistries] = useState([]);
  const [selectedName, setSelectedName] = useState("");
  const [selectedNodeName, setSelectedNodeName] = useState("");
  const [displayedNodeName, setDisplayedNodeName] = useState("");
  const [selectNodeLeaves, setSelectNodeLeaves] = useState([]);
  const [nodeLeavesData, setNodeLeavesData] = useState([]);
  const [distanceThreshold, setDistanceThreshold] = useState(0);
  const [wordsArray, setWordsArray] = useState([]);
  const dataPath = `./data/test.json`;

  useEffect(() => {
    window
      .fetch(dataPath)
      .then((response) => response.json())
      .then((data) => {
        setData(data);
      });
  }, [dataPath]);

  useEffect(() => {
    window
      .fetch("./data/tsne_+_clusters_list.json")
      .then((response) => response.json())
      .then((data) => {
        const ministriesSet = new Set();
        data.map((item) => {
          return ministriesSet.add(item["府省庁"]);
        });
        setMinistries(Array.from(ministriesSet));

        const newData = data.filter((item) => {
          return item["公開年度"] === "2018" && item["事業名"] === projectName;
        });
        setProjectData(newData);
      });
  }, [projectName]);

  if (data.length === 0) {
    return <div></div>;
  }

  const fontSize = 10;
  const separation = 5;
  const contentR = 540;
  const contentWidth = contentR * 2;
  const contentHeight = contentR * 2;
  const wordsBoxWidth = fontSize * 50;
  const wordsBoxHeight = fontSize * 100;
  const ministriesCol = d3.scaleOrdinal(d3.schemeCategory10);

  const margin = {
    left: 160,
    right: 200,
    top: 75,
    bottom: 150,
  };

  const ministriesList = [];
  ministries.map((item, i) => {
    return ministriesList.push({ 府省庁: item, color: ministriesCol(i) });
  });

  const fillColor = (ministryName) => {
    let color = "";
    ministriesList.forEach((ministry) => {
      if (ministry["府省庁"] === ministryName) {
        color = ministry.color;
      }
    });
    return color;
  };

  const height = 1080;

  const stratify = d3
    .stratify()
    .id((d) => d.no)
    .parentId((d) => d.parent);

  const filteredData = data.filter(
    (item) => item.distance >= distanceThreshold
  );
  const dataStratify = stratify(filteredData);
  const root = d3.hierarchy(dataStratify);
  const cluster = d3
    .cluster()
    .size([Math.PI * 2, contentR])
    .separation(() => separation);
  cluster(root);
  const nodes = root.descendants();
  const links = root.links();

  const radiusScale = d3
    .scaleLog()
    .domain(d3.extent(nodes, (d) => d.data.data.distance + 1))
    .range([contentR, 0])
    .base(10)
    .nice();
  const shape = d3.scaleOrdinal(
    ministriesList.map((d) => d["府省庁"]),
    d3.symbols.map((s) => d3.symbol().type(s).size(90)())
  );

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
      <div style={{ overflowX: "auto" }}>
        <svg width="1195" height="180">
          {ministriesList.map((item, i) => {
            return (
              <g
                transform={`translate(${
                  i < 7
                    ? 50 + 160 * i
                    : i < 14
                    ? 50 + 160 * (i - 7)
                    : 50 + 160 * (i - 14)
                }, ${i < 7 ? 17 : i < 14 ? 34 : 51})`}
              >
                <path d={shape(item["府省庁"])} fill={item.color} />
                <text x="7" y="5">
                  {item["府省庁"]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div class="views" style={{ display: "flex" }}>
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
                {links.map(({ source, target }) => {
                  const x1 =
                    Math.cos(source.x) *
                    radiusScale(source.data.data.distance + 1);
                  const y1 =
                    Math.sin(source.x) *
                    radiusScale(source.data.data.distance + 1);
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
                    Math.floor((source.x - target.x + 2 * Math.PI) / Math.PI) %
                      2 ===
                      1
                  );
                  return (
                    <g key={`${source.data.data.no}:${target.data.data.no}`}>
                      <path
                        d={path.toString()}
                        stroke="black"
                        fill="none"
                        style={{ transition: "d 1s" }}
                      ></path>
                    </g>
                  );
                })}
              </g>
              <g>
                {nodes.map((item, i) => {
                  const x =
                    Math.cos(item.x) * radiusScale(item.data.data.distance + 1);
                  const y =
                    Math.sin(item.x) * radiusScale(item.data.data.distance + 1);
                  return (
                    <g
                      key={item.data.data.no}
                      style={{ cursor: "pointer" }}
                      onClick={(event) => {
                        const keys = ["pke", "tfidf", "okapi"];
                        const words = {};
                        for (const node of item.leaves()) {
                          for (const key of keys) {
                            for (word of node.data.data[key]) {
                              if (!(word.word in words)) {
                                words[word.word] = 0;
                              }
                              words[word.word] += word.score;
                            }
                          }
                        }
                        const wordsArray = Object.entries(words).map(
                          ([word, score]) => ({
                            word,
                            score,
                          })
                        );
                        setWordsArray(
                          wordsArray.sort(function (a, b) {
                            if (a.score < b.score) return 1;
                            if (a.score > b.score) return -1;
                            return 0;
                          })
                        );
                      }}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={5}
                        fill="red"
                        style={{ transition: "cx 1s, cy 1s" }}
                      ></circle>
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>
        </div>
        <div>
          <svg
            width={wordsBoxWidth}
            height={wordsArray.length * 20 + margin.top + margin.bottom}
          >
            {wordsArray.sort().map((item, i) => {
              return (
                <g transform={`translate(${0}, ${margin.top + i * 20})`}>
                  <text x="7" y="5">
                    {item.word}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
render(<App />, document.querySelector("#content"));

export default root;
