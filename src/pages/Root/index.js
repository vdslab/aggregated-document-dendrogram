import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as d3 from "d3";
import { distanceBinarySearch, initialRoot } from "./utils";
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
    // "Tf",
    // "topvec",
    // "TopicScore",
    // "WordScore",
  ];
  const words = {};
  // const count = {}
  // for (const data of item.leaves()) {
  //   for (const key of keys) {
  //     for (const word of data.data.data[key]) {
  //       if (word ===""){
  //         continue
  //       }
  //       if (!(word.word in words)) {
  //         count[word.word] = 0
  //       }
  //       count[word.word] += 1
  //     }
  //   }
  // }

  //Use MultipartiteRank, TopicScore(not calced TF-IDF)
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

  // for (let score of Object.values(words)){
  //   if (score === undefined){
  //     continue;
  //   }
  //   score = score/item.leaves().length
  // }

  //Use tfidf, WordScore(calced TF-IDF)
  // for (const word of item.data.data['WordScore']){
  //   if (word === "") {
  //     continue;
  //   }
  //   if (!(word.word in words)) {
  //     words[word.word] = 0;
  //   }
  //   words[word.word] += word.score
  // }

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
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    (async () => {
      const dataPath = "./data/visdata220801.json";
      const dataResponse = await fetch(dataPath);
      const data = await dataResponse.json();

      const wordClusterPath = "./data/word_cluster1123 copy.json";
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
    <>
      <header className="hero is-info is-bold is-small">
        <div className="hero-body">
          <div className="container">
            <p className="title">
              Summarized Dendrogram for Interactive Exploration of Hierarchical
              Document Clusters
            </p>
            <p className="subtitle">
              Taiki Tanaka, Yosuke Onoue <br />
              Nihon University
            </p>
          </div>
        </div>
      </header>
      <section className="section">
        <div className="container">
          <div className="content">
            This is an interactive demonstration of summarized dendrogram for
            visualizing hierarchical document clusters. The following diagram
            represents the hierarchical document clusters of{" "}
            <a href="https://sites.google.com/site/vispubdata/home">
              visualization publications dataset
            </a>{" "}
            which contains the information of articles published in the IEEE VIS
            conference.
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const limitNumberOfLeaves = +event.target.leaves.value;
              event.target.leaves.value = "20";
              const stratify = d3
                .stratify()
                .id((d) => d.no)
                .parentId((d) => d.parent);
              const dataStratify = stratify(data);
              const originalRoot = d3.hierarchy(dataStratify);
              const root = initialRoot(searchParams, originalRoot);
              setSearchParams({
                root: root.data.id,
                distanceThreshold: distanceBinarySearch(
                  root,
                  +limitNumberOfLeaves
                ),
              });
            }}
          >
            <div className="field is-horizontal">
              <div className="field-label">
                <label className="label">Number of leaves</label>
              </div>
              <div className="field-body">
                <div className="field is-expanded">
                  <div className="field has-addons">
                    <div className="control is-expanded">
                      <input
                        name="leaves"
                        className="input"
                        type="number"
                        min="1"
                        defaultValue="20"
                        required
                      />
                    </div>
                    <div className="control">
                      <button className="button" type="submit">
                        change
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
          <figure className="image is-4by3">
            <Dendrogram data={data} />
          </figure>
          <div className="buttons is-centered">
            <button
              className="button"
              onClick={() => {
                navigate("/");
              }}
            >
              reset
            </button>
          </div>
        </div>
      </section>
      <footer className="footer">
        <div className="content">
          <p className="has-text-centered">
            &copy; 2022{" "}
            <a href="https://vdslab.jp/" target="_blank" rel="noreferrer">
              vdslab
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
