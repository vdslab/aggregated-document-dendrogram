import * as d3 from "d3";

export default function AggregatedLeaf({
  item,
  onClick,
  innerRadius,
  outerRadius,
  scoreMax,
  scoreBarHeight,
}) {
  const arc = d3
    .arc()
    .startAngle((d) => d.startAngle + Math.PI / 2)
    .endAngle((d) => d.endAngle + Math.PI / 2)
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);
  const scoreArc = d3
    .arc()
    .startAngle((d) => d.startAngle + Math.PI / 2)
    .endAngle((d) => d.endAngle + Math.PI / 2)
    .innerRadius(outerRadius);
  const scoreScale = d3
    .scaleLinear()
    .domain([0, scoreMax])
    .range([0, scoreBarHeight]);

  const dt = Math.PI / 80;
  const wordCount = Math.floor(
    (item.endAngle - item.startAngle - item.padAngle) / dt
  );
  const groupsPie = d3
    .pie()
    .startAngle(item.startAngle + item.padAngle / 2)
    .endAngle(item.endAngle - item.padAngle / 2)
    .sortValues(() => 0)
    .value((d) => d.count);
  const groupArcs = groupsPie(item.data.data.groups);
  const textMargin = 3;
  return (
    <g className="is-clickable" onClick={onClick}>
      <g>
        {groupArcs.map((group) => {
          return (
            <g key={group.data.group}>
              <path d={arc(group)} fill={group.data.color} />
            </g>
          );
        })}
      </g>
      <g>
        {item.data.data.words.slice(0, wordCount).map((word, i) => {
          const t = item.startAngle + item.padAngle / 2 + dt * i + dt / 2;
          return (
            <g key={word.word}>
              <path
                d={scoreArc({
                  startAngle: t - dt / 2,
                  endAngle: t + dt / 2,
                  outerRadius: outerRadius + scoreScale(word.score),
                })}
                fill={word.color}
              />
              <text
                transform={
                  Math.cos(item.startAngle) >= 0
                    ? `rotate(${(t * 180) / Math.PI})translate(${
                        outerRadius + textMargin
                      })`
                    : `rotate(${(t * 180) / Math.PI + 180})translate(${
                        -outerRadius - textMargin
                      })`
                }
                fill="#000"
                fontSize="10"
                fontWeight="bold"
                textAnchor={Math.cos(item.startAngle) >= 0 ? "start" : "end"}
                dominantBaseline="central"
              >
                {word.word}
              </text>
            </g>
          );
        })}
      </g>
      <path d={arc(item)} fill="none" stroke="#888" />
    </g>
  );
}
