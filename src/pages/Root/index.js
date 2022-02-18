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
  const result = Object.entries(words).map(([word, score]) => ({
    word,
    score,
  }));
  result.sort((a, b) => b.score - a.score);
  return result;
}

function aggregateGroups(node, key) {
  const groups = {};
  for (const leaf of node.leaves()) {
    const group = leaf.data.data[key];
    if (!(group in groups)) {
      groups[group] = 0;
    }
    groups[group] += 1;
  }
  return groups;
}

export default function Root() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const dataPath = "./data/test1123.json";
      const dataResponse = await fetch(dataPath);
      const data = await dataResponse.json();

      const wordClusterPath = "./data/word_cluster1123.json";
      const wordClusterResponse = await fetch(wordClusterPath);
      const wordClusterData = await wordClusterResponse.json();
      const wordCluster = {};
      for (const { word, cluster_id } of wordClusterData) {
        wordCluster[word] = cluster_id;
      }
      const clusterColor = d3.scaleOrdinal(d3.schemePastel1);

      const stratify = d3
        .stratify()
        .id((d) => d.no)
        .parentId((d) => d.parent);
      const dataStratify = stratify(data);
      const root = d3.hierarchy(dataStratify);
      for (const node of root) {
        node.data.data.words = aggregateWords(node);
        for (const word of node.data.data.words) {
          word.color = clusterColor(wordCluster[word.word]);
        }
      }

      const groupsTotal = aggregateGroups(root, "Conference");
      const groups = Object.entries(groupsTotal).map(([group, count]) => ({
        group,
        count,
      }));
      groups.sort((a, b) => b.count - a.count);

      const groupColor = d3.scaleOrdinal(d3.schemeCategory10);
      for (const { group } of groups) {
        groupColor(group);
      }

      for (const node of root) {
        const nodeGroups = aggregateGroups(node, "Conference");
        node.data.data.groups = groups.map(({ group }) => ({
          group,
          count: nodeGroups[group] || 0,
          color: groupColor(group),
        }));
      }

      setData(data);
    })();
  }, []);

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
              <Dendrogram data={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
