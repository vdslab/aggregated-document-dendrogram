import React, { useEffect, useState } from "react";
import { render } from "react-dom";
import * as d3 from "d3";
import { geoAzimuthalEqualAreaRaw } from "d3";

class Chart extends React.Component {
  // constructor(props) {
  //   super(props);
  //   this.state={
  //     count : '0',
  //     filterKeyword : '',
  //     policy : 'ALL',
  //     reportYear : '',
  //     show : 'default',
  //     hideMinistries : new Set(),
  //     transform : {x:0,y:0,k:1}
  //   };
  //   this.zoom = d3.zoom()
  //   .on('zoom',()=>{
  //     this.setState({transform:d3.event.transform})
  //   })
  // }
  // componentDidMount(){
  //   d3.select(this.refs.ff14).call(this.zoom).on("dblclick.zoom", null)
  // }

  render() {
    // const data = this.props.data
    // const ministries = new Set()
    // for(const node of data){
    //   ministries.add(node['府省庁'])
    // }

    const dataPath = `./data/test.json`;
    const [data, setData] = useState([]);
    const [projectName, setProjectName] = useState("");
    const [ministries, setMinistries] = useState([]);
    const [selectedName, setSelectedName] = useState("");
    const [selectedNodeName, setSelectedNodeName] = useState("");
    const [displayedNodeName, setDisplayedNodeName] = useState("");
    const [selectNodeLeaves, setSelectNodeLeaves] = useState([]);
    
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
    Array.from(ministries).map((item, i) => {
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
      .scaleLog()
      .domain([
        d3.min(data, (item) => item.distance+1),
        d3.max(data, (item) => item.distance+1)
      ])
      .base(10)
      .range([0, contentHeight - 200])
      .nice();

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
                    d={`M${item.x},${yScale(item.data.data.distance*10+1)}
                          L${item.x},${yScale(item.parent.data.data.distance*10+1)}
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
      </div>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null
    };
  }
  
  componentDidMount() {
    const url =
      "./data/tsne_+_clusters_list.json";
    window
      .fetch(url)
      .then(response => response.json())
      .then(data => {
        this.setState({ data });
      });
  }

  render() {
    const { data } = this.state;
    return (
      <>
        <section className="section">
          <div className="container">
            <div className="content has-text-centered">
              <div style={{ margin: "2em" }}>
                {data&&
                  <Chart data={data} />
                  }
              </div>
            </div>
          </div>
        </section>
        {/* <footer className="footer">
        </footer> */}
      </>
    );
  }
}

class Root extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(error.toString());
  }

  render() {
    const { error } = this.state;
    if (error != null) {
      return (
        <div className="hero is-danger is-fullheight">
          <div class="hero-body">
            <div class="container">
              <h1 class="title">{error.toString()}</h1>
            </div>
          </div>
        </div>
      );
    }
    return <App />;
  }
}

export default Root