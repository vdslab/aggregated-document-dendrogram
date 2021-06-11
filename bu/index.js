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

              .strength(0.015) // 0.01
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
            <div className="container">
              <h1 className="title">
                類似事業探索の為の行政事業の俯瞰的可視化
              </h1>
              <h2 className="subtitle">情報科学研究 国家財政チーム</h2>
            </div>
          </div>
        </div>

        <div className="App">
          <WordPlot data={data} />
        </div>

        <footer className="footer">
          <div className="content has-text-centered">
            <p>&copy; 2020 上野瑞貴 野村理紗</p>
          </div>
        </footer>
      </div>
    );
  }
};

//////////////////////////
const WordPlot = ({ data }) => {
  const [word, setWord] = useState("");
  const [selectedWord, setSelectedWord] = useState("");
  const contentWidth = 460;
  const contentHeight = 450;

  const margin = {
    left: 150,
    right: 150,
    top: 30,
    bottom: 50,
  };

  const width = contentWidth + margin.left + margin.right;
  const height = contentHeight + margin.top + margin.bottom;

  const color = d3.scaleOrdinal(d3.schemeAccent);
  const cicleSize = (d) => Math.pow(d.count, 0.7);

  const xScale = d3
    .scaleLinear()
    .domain([d3.min(data, (item) => item.x), d3.max(data, (item) => item.x)])
    .range([0, contentWidth])
    .nice();

  const yScale = d3
    .scaleLinear()
    .domain([d3.max(data, (item) => item.y), d3.min(data, (item) => item.y)])
    .range([0, contentHeight])
    .nice();

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">キーワードバブルチャート</h1>
        <p>
          2019年度公開の約5000の行政事業の事業概要からそれぞれキーワードを抽出し、キーワード毎に事業概要にキーワードが含まれている事業の執行額を担当府省庁別で集計をしてデータ作成を行いました。その結果を次元削減し、事業からキーワードを抽出した際に出現頻度の高かった117個のキーワードを二次元空間に表示しています。円の大きさはキーワードの出現頻度で決め、クラスター分析を行い、近いキーワードを同じ色で色付けしています。キーワードバブルチャートを見る事でどのようなカテゴリに対して事業が行われているのかを大まかに俯瞰することが可能となります。
        </p>
        <p
          className="has-text-weight-bold"
          style={{
            fontSize: "large",
            marginTop: "0.7rem",
            marginBottom: "1.0rem",
          }}
        >
          キーワードをクリックするとクリックしたキーワードが事業概要に含まれる事業がページ下部に表示されます。
        </p>

        <svg viewBox={`0 0 ${width} ${height}`}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {data.map((item, i) => {
              return (
                <g
                  key={i}
                  onClick={() => {
                    setWord(item.word);
                  }}
                  onMouseEnter={() => {
                    setSelectedWord(item.word);
                  }}
                  onMouseLeave={() => {
                    setSelectedWord("");
                  }}
                  transform={`translate(${xScale(item.x)}, ${yScale(item.y)})`}
                  style={{ cursor: "pointer" }}
                >
                  <title>{`word:${item.word}`}</title>
                  <circle
                    r={cicleSize(item)}
                    fill={
                      item.color === "silver" ? item.color : color(item.color)
                    }
                  />
                  <text
                    fontSize={`${cicleSize(item) * 0.77}px`}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={item.word === selectedWord ? "blue" : "black"}
                  >
                    {item.word}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      <div>
        {word === "" ? (
          <div>
            キーワードをクリックするとここにデンドログラムが表示されます
          </div>
        ) : (
          <DrawDendrogram word={word} />
        )}
      </div>
    </section>
  );
};

////////////////////////////
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
  //const ministriesCol = d3
  //.scaleLinear()
  //.domain([0, 4, 8, 12, 16, 20])
  //.range(["red", "orange", "yellow", "green", "blue", "purple"]);

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

  //const width = contentWidth + margin.left + margin.right;
  const height = contentHeight + margin.top + margin.bottom;

  const yScale = d3
    .scaleLinear()
    .domain([
      d3.max(data, (item) => item.distance),
      d3.min(data, (item) => item.distance),
    ])
    .range([0, contentHeight - 200]);

  const stratify = d3
    .stratify()
    .id((d) => d.no)
    .parentId((d) => d.parent);

  const data_stratify = stratify(data);
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
      <h1 className="title">事業概要に"{word}"を含む行政事業デンドログラム</h1>
      <p>
        ここではキーワードバブルチャートでクリックされたキーワードを事業概要に含む事業の事業概要をベクトル表現したデータを用いて階層クラスター分析を行い、その結果をデンドログラムで描画しています。図の下の方で結合している事業は近い関係にあるといえます。またある程度の高さでクラスタを見る事で事業をいくつかの事業群として見る事が可能です。
      </p>
      <p
        className="has-text-weight-bold"
        style={{
          fontSize: "large",
          marginTop: "0.7rem",
          marginBottom: "1.0rem",
        }}
      >
        デンドログラムの事業名をクリックすると、事業の詳細がページ下部に表示されます。
      </p>
      <p
        className="has-text-weight-bold"
        style={{
          fontSize: "large",
          marginTop: "0.7rem",
          marginBottom: "2.0rem",
        }}
      >
        デンドログラムのクラスタとクラスタが結合する部分をクリックすると、そこまでのクラスタに含まれる事業に関する執行額のデータがページ下部に表示されます。
      </p>
      <div style={{ overflowX: "auto" }}>
        {/* <svg width="1195" height={margin.top}> */}
        <svg width="1195" height="1080">
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
                {/*<circle r="6" fill={item.color} />*/}
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
                  d={`M${item.x},${yScale(item.data.data.distance*10)}
                        L${item.x},${yScale(item.parent.data.data.distance*10)}
                        L${item.parent.x},${yScale(
                    item.parent.data.data.distance*10
                  )}`}
                  stroke = "black"
                  fill = "none"
                />
              );
            })}

            {testData.map((item, i) => {
              return (
                <g
                  key={i}
                  transform={`translate(${item.x},${yScale(
                    item.data.data.distance
                  )})`}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    if (item.children !== undefined) {
                      setSelectNodeLeaves(item.leaves());
                      setDisplayedNodeName(item.data.data.name);
                    } else {
                      setProjectName(item.data.data["事業名"]);
                    }
                  }}
                  onMouseEnter={() => {
                    if (item.children !== undefined) {
                      setSelectedNodeName(item.data.data.name);
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
                        selectedNodeName === item.data.data.name
                          ? "blue"
                          : displayedNodeName === item.data.data.name
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
                  {/*<circle
                    r={item.children ? "2" : "6"}
                    fill={fillColor(item.data.data["府省庁"])}
                  ></circle>*/}
                  <text
                    transform="translate(-3,10) rotate(45)"
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
      <div className="columns">
        <div className="column is-6">
          {nodeLeavesData.length === 0 ? (
            <div>
              行政事業デンドログラムのノードをクリックするとクラスタに属する事業の執行額データをここに表示します
            </div>
          ) : (
            <DrawStackedChart nodeLeavesData={nodeLeavesData} />
          )}
        </div>
        <div className="column is-6">
          {projectData.length === 0 ? (
            <div>事業名をクリックするとここに事業の詳細が表示されます</div>
          ) : (
            <ProjectTable projectData={projectData} />
          )}
        </div>
      </div>
    </div>
  );
};

/////////////////////////////
const ProjectTable = ({ projectData }) => {
  return (
    <div className="container">
      <h1 className="title">{projectData["0"]["事業名"]}</h1>
      <h2 className="has-text-weight-bold">府省庁</h2>
      <p style={{ marginLeft: "0.75rem", marginbottom: "1.0rem" }}>
        {projectData["0"]["府省庁"]}
      </p>
      <h2 className="has-text-weight-bold">当初予算(百万円)</h2>
      <p style={{ marginLeft: "0.75rem", marginbottom: "1.0rem" }}>
        {projectData["0"]["当初予算"]}
      </p>
      <h2 className="has-text-weight-bold">補正予算(百万円)</h2>
      <p style={{ marginLeft: "0.75rem", marginbottom: "1.0rem" }}>
        {projectData["0"]["補正予算"]}
      </p>
      <h2 className="has-text-weight-bold">執行額(百万円)</h2>
      <p style={{ marginLeft: "0.75rem", marginbottom: "1.0rem" }}>
        {projectData["0"]["執行額"]}
      </p>
      <h2 className="has-text-weight-bold">事業の目的</h2>
      <p style={{ marginLeft: "0.75rem", marginbottom: "0.8rem" }}>
        {projectData["0"]["事業の目的"]}
      </p>
      <h2 className="has-text-weight-bold">事業概要</h2>
      <p
        style={{
          marginLeft: "0.75rem",
          marginbottom: "0.8rem",
        }}
      >
        {projectData["0"]["事業概要"]}
      </p>
    </div>
  );
};

//////////////////////
const DrawHistogram = ({ nodeLeavesData }) => {
  const contentWidth = 300;
  const contentHeight = 100;

  const margin = {
    left: 30,
    right: 50,
    top: 20,
    bottom: 50,
  };

  const width = contentWidth + margin.left + margin.right;
  const height = contentHeight + margin.top + margin.bottom;

  const projectsMoney = [];
  for (const node of nodeLeavesData) {
    projectsMoney.push(node["執行額"]);
  }

  const binCol = "blue";

  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(projectsMoney)])
    .range([0, contentWidth])
    .nice();

  const histogramData = d3
    .histogram()
    .domain(xScale.domain())
    .thresholds(xScale.ticks(15))(projectsMoney);

  const yScale = d3
    .scaleLinear()
    .domain([100, 0])
    //.domain([d3.max(histogramData, (item) => item.length), 0])
    .range([0, contentHeight])
    .nice();

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {xScale.ticks().map((x) => {
            return (
              <g transform={`translate(${xScale(x)},0)`}>
                <line
                  x1="0"
                  y1={contentHeight}
                  x2="0"
                  y2={contentHeight + 2}
                  stroke="black"
                />
                <text y={contentHeight + 8} textAnchor="middle" font-size="5">
                  {x}
                </text>
              </g>
            );
          })}
          {yScale.ticks().map((y) => {
            return (
              <g transform={`translate(0,${yScale(y)})`}>
                {Number.isInteger(y) ? (
                  <line x1="-2" y1="0" x2="0" y2="0" stroke="black" />
                ) : null}
                <line
                  x1="0"
                  y1="0"
                  x2={contentWidth}
                  y2="0"
                  stroke="gainsboro"
                />
                <text x="-7" y="1" textAnchor="middle" fontSize="5">
                  {Number.isInteger(y) ? y : null}
                </text>
              </g>
            );
          })}
          {histogramData.map((bin, i) => {
            return (
              <g
                key={i}
                transform={`translate(${xScale(bin.x0)}, ${yScale(
                  bin.length
                )})`}
              >
                <rect
                  x="0"
                  width={
                    xScale(histogramData[0].x1) -
                    xScale(histogramData[0].x0) -
                    1
                  }
                  height={contentHeight - yScale(bin.length)}
                  fill={binCol}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

const DrawStackedChart = ({ nodeLeavesData }) => {
  const contentWidth = 200;
  const contentHeight = 500;

  const margin = {
    left: 30,
    right: 45,
    top: 60,
    bottom: 30,
  };

  const width = contentWidth + margin.left + margin.right;
  const height = contentHeight + margin.top + margin.bottom;

  let numberTotal = 0;
  let moneyTotal = 0;

  const labels = [
    "1~9",
    "10~99",
    "100~999",
    "1,000~9,999",
    "10,000~99,999",
    "100,000~999,999",
    "1,000,000~9,999,999",
    "10,000,000~99,999,999",
  ];

  const projectsMoneyDigit = [
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
  ];
  for (const node of nodeLeavesData) {
    moneyTotal += node["執行額"];
    const numDigit = String(Math.floor(node["執行額"])).length;
    projectsMoneyDigit[0][String(numDigit)] += 1;
    numberTotal += 1;
  }

  const stackChartData = d3
    .stack()
    .keys(["1", "2", "3", "4", "5", "6", "7", "8"])(projectsMoneyDigit);

  //const stackChartData = stack(projectsMoneyDigit)

  const color = d3.scaleOrdinal(d3.schemeSet1);

  const yScale = d3
    .scaleLinear()
    .domain([100, 0])
    //.domain([d3.max(histogramData, (item) => item.length), 0])
    .range([0, contentHeight]);

  return (
    <div>
      <h1 className="title">
        クリックされたノードまでに属する事業の執行額データ
      </h1>
      <p>
        ここでは上の図でクリックされたノードまでに属す事業の執行額に関するデータを可視化しています。
      </p>
      <p>
        下の帯グラフではクリックされたノードまでに含まれる全事業の執行額の桁数の割合を表しています。この図を見る事で、クリックしたノードまでに含まれる事業はどれぐらいの規模の事業が多いのかや、どれぐらいお金が使われているのかを知る事ができます。
      </p>

      <svg viewBox={`0 0 ${width} ${height}`}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          <text x="-9" y="-6" textAnchor="middle" fontSize="7">
            (%)
          </text>
          <text x="-30" y="-25" textAnchor="start" fontSize="10">
            {`執行額合計:${Math.round(moneyTotal)}(百万円)`}
          </text>

          {yScale.ticks().map((y) => {
            return (
              <g transform={`translate(0,${yScale(y)})`}>
                {Number.isInteger(y) ? (
                  <line x1="-2" y1="0" x2="5" y2="0" stroke="black" />
                ) : null}

                <text x="-9" y="2" textAnchor="middle" fontSize="7">
                  {Number.isInteger(y) ? y : null}
                </text>
              </g>
            );
          })}
          {stackChartData.map((d, i) => {
            return (
              <g
                key={i}
                transform={`translate(5, ${yScale(
                  100 - (d[0][0] / numberTotal) * 100
                )})`}
              >
                <rect
                  width="95"
                  height={yScale(
                    100 - ((d[0][1] - d[0][0]) / numberTotal) * 100
                  )}
                  fill={color(d.key)}
                />
                {((d[0][1] - d[0][0]) / numberTotal) * 100 > 4 ? (
                  <g>
                    <text
                      x="105"
                      y={
                        yScale(
                          100 - (((d[0][1] - d[0][0]) / numberTotal) * 100) / 2
                        ) + 4
                      }
                      textAnchor="start"
                      fontSize="10"
                    >
                      {`約${Math.floor(
                        ((d[0][1] - d[0][0]) / numberTotal) * 100
                      )}%`}
                    </text>
                    <text
                      x="47"
                      y={yScale(
                        100 - (((d[0][1] - d[0][0]) / numberTotal) * 100) / 2
                      )}
                      textAnchor="middle"
                      fontSize="8"
                    >
                      {`${labels[i]}`}
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
render(<App />, document.querySelector("#content"));

export default root