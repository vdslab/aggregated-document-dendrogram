import * as d3 from "d3";

function optimalFontSize(word, r, fontFamily, fontWeight) {
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
}

function aggregateWords(item) {
  let left = 0;
  let right = 1000;
  for (let i = 0; i < 50; i++) {
    const mid = (left + right) / 2;
    let numberWords = 0;
    for (const { score } of item.data.data.words) {
      if (score > mid) {
        numberWords += 1;
      }
    }
    const target = 10;
    if (numberWords <= target) {
      right = mid;
    } else {
      left = mid;
    }
  }

  return item.data.data.words.filter(({ word, score }) => {
    return score >= right && word !== "";
  });
}

function circleColor(word, wordClusterData) {
  for (const key of Object.keys(wordClusterData)) {
    if (wordClusterData[key].word === word) {
      return wordClusterData[key].cluster_id;
    }
  }
}

export default function PhraseCircle({
  item,
  wordClusterData,
  circleSize,
  onClick,
}) {
  const x = Math.cos(item.x) * (item.r + circleSize / 2);
  const y = Math.sin(item.x) * (item.r + circleSize / 2);
  const data = { name: "root", children: aggregateWords(item) };
  const root = d3.hierarchy(data);
  root.sum((d) => {
    return d.score;
  });

  const strokeColor = "#888";
  const pack = d3.pack().size([circleSize, circleSize]).padding(0);
  pack(root);
  const nodes = root.descendants();

  return (
    <g
      transform={`translate(${x},${y})`}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {nodes.map((node, i) => {
        if (node.data.name === "root") {
          return (
            <g
              key={i}
              transform={`translate(${node.x - circleSize / 2} ${
                node.y - circleSize / 2
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
            transform={`translate(${node.x - circleSize / 2} ${
              node.y - circleSize / 2
            } )`}
          >
            <circle
              cx={0}
              cy={0}
              r={node.r}
              fillOpacity="50%"
              fill={
                d3.schemeCategory10[
                  circleColor(node.data.word, wordClusterData)
                ]
              }
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
      })}
    </g>
  );
}
