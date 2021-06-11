import React, { useEffect, useState } from "react";
import { render } from "react-dom";
import * as d3 from "d3";
import "bulma/css/bulma.css";

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
  const [projectData, setProjectData] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [ministries, setMinistries] = useState([]);
  const [selectedName, setSelectedName] = useState("");
  const [selectedNodeName, setSelectedNodeName] = useState("");
  const [displayedNodeName, setDisplayedNodeName] = useState("");
  const [selectNodeLeaves, setSelectNodeLeaves] = useState([]);
  const [nodeLeavesData, setNodeLeavesData] = useState([]);
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

  useEffect(() => {
    window
      .fetch("./data/tsne_+_clusters_list.json")
      .then((response) => response.json())
      .then((data) => {
        const newNodeLeavesData = [];
        for (const node of selectNodeLeaves) {
          for (const project of data) {
            if (
              project["事業名"] === node.data.data["事業名"] &&
              project["公開年度"] === "2018" &&
              project["府省庁"] === node.data.data["府省庁"]
            ) {
              newNodeLeavesData.push({
                事業名: project["事業名"],
                執行額: +project["執行額"],
                補正予算: project["補正予算"],
                府省庁: project["府省庁"],
              });
            }
          }
        }
        setNodeLeavesData(newNodeLeavesData);
      });
  }, [selectNodeLeaves]);

  if (data.length === 0) {
    return <div></div>;
  }

  const fontSize = 10;
  const separation = 5;
  const contentWidth = (fontSize + separation) * (data.length / 2);
  const contentHeight = 400;
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

  const yScale = d3
    .scaleLog()
    .domain([
      d3.min(data, (item) => item.distance + 1),
      d3.max(data, (item) => item.distance + 1),
    ])
    .range([height - 200, 0])
    .base(10)
    .nice();

  const stratify = d3
    .stratify()
    .id((d) => d.no)
    .parentId((d) => d.parent);

  const data_stratify = stratify(data);
  console.log(data_stratify);
  const root = d3.hierarchy(data_stratify);
  const cluster = d3
    .cluster()
    .size([contentWidth, contentHeight - 200])
    .separation(() => separation);
  cluster(root);

  const testData = root.descendants();

  const shape = d3.scaleOrdinal(
    ministriesList.map((d) => d["府省庁"]),
    d3.symbols.map((s) => d3.symbol().type(s).size(90)())
  );

  return (
    <div>
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
      <div style={{ overflowX: "scroll" }}>
        <svg width={contentWidth + margin.right} height={height}>
          <g transform={`translate(0,0)`}>
            {testData.slice(1).map((item) => {
              return (
                <path
                  className="link"
                  d={`M${item.x},${yScale(item.data.data.distance + 1)}
                        L${item.x},${yScale(item.parent.data.data.distance + 1)}
                        L${item.parent.x},${yScale(
                    item.parent.data.data.distance + 1
                  )}`}
                  stroke="black"
                  fill="none"
                />
              );
            })}

            {testData.map((item, i) => {
              return (
                <g
                  key={i}
                  transform={`translate(${item.x},${yScale(
                    item.data.data.distance + 1
                  )})`}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    if (item.children !== undefined) {
                      setSelectNodeLeaves(item.leaves());
                      setDisplayedNodeName(item.data.data.no);
                    } else {
                      setProjectName(item.data.data["事業名"]);
                    }
                  }}
                  onMouseEnter={() => {
                    if (item.children !== undefined) {
                      setSelectedNodeName(item.data.data.no);
                    }
                    setSelectedName(item.data.data["事業名"]);
                  }}
                  onMouseLeave={() => {
                    if (item.children !== undefined) {
                      setSelectedNodeName("");
                    }
                    setSelectedName("");
                  }}
                >
                  {item.children ? (
                    <circle
                      r={item.children ? "3" : "6"}
                      fill={
                        selectedNodeName === item.data.data.no
                          ? "blue"
                          : displayedNodeName === item.data.data.no
                          ? "brown"
                          : "black"
                      }
                    ></circle>
                  ) : (
                    <path
                      d={shape(item.data.data["府省庁"])}
                      fill={fillColor(item.data.data["府省庁"])}
                    />
                  )}
                  <text
                    transform="translate(-3,10) rotate(90)"
                    y={item.children ? -10 : 2}
                    x="0"
                    fontSize={`${fontSize}px`}
                    textAnchor={item.children ? "end" : "start"}
                    fill={
                      item.data.data["事業名"] === selectedName
                        ? "blue"
                        : item.data.data["事業名"] === projectName
                        ? "brown"
                        : "black"
                    }
                  >
                    {item.children ? null : item.data.data["事業名"]}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};
render(<App />, document.querySelector("#content"));

export default root;
