import { useEffect, useState } from "react";
import * as d3 from "d3";
import Dendrogram from "./Dendrogram";

export default function Root() {
  const contentR = 540;
  const contentWidth = contentR * 2;
  const contentHeight = contentR * 2;

  const [data, setData] = useState(null);
  const dataPath = "./data/test1123.json";

  useEffect(() => {
    window
      .fetch(dataPath)
      .then((response) => response.json())
      .then((data) => {
        const stratify = d3
          .stratify()
          .id((d) => d.no)
          .parentId((d) => d.parent);
        const dataStratify = stratify(data);
        const root = d3.hierarchy(dataStratify);
        setData(root);
      });
  }, [dataPath]);

  if (data == null) {
    return <div>loading</div>;
  }

  return (
    <div>
      <div className="hero is-info is-bold">
        <div className="hero-body">
          <div className="container"></div>
        </div>
      </div>

      <div className="App">
        <Dendrogram
          originalRoot={data}
          contentR={contentR}
          contentHeight={contentHeight}
          contentWidth={contentWidth}
        />
      </div>
    </div>
  );
}
