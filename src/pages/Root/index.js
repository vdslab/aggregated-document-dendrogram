import { useEffect, useState } from "react";
import * as d3 from "d3";
import Dendrogram from "./Dendrogram";

function aggregateWords(item) {
  const keys = [
    // "TextRank",
    // "SingleRank",
    // "PositionRank",
    // "TopicRank",
    "MultipartiteRank",
    // "tfidf",
    // "okapi",
  ];
  const words = {};
  for (const data of item.leaves()) {
    for (const key of keys) {
      for (const word of data.data.data[key]) {
        if (word === "") {
          continue;
        }
        if (!(word.word in words)) {
          words[word.word] = 0;
        }
        words[word.word] += word.score;
      }
    }
  }
  return Object.entries(words).map(([word, score]) => ({
    word,
    score,
  }));
}

export default function Root() {
  const contentR = 300;
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
        for (const item of root.descendants()) {
          item.data.data.words = aggregateWords(item);
        }
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
        <div>
          <div className="views" style={{ display: "flex" }}>
            <div>
              <Dendrogram
                originalRoot={data}
                contentR={contentR}
                contentHeight={contentHeight}
                contentWidth={contentWidth}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
