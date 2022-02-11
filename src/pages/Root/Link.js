import * as d3 from "d3";

export default function Link({ source, target }) {
  if (source.y === 0) {
    const x2 = Math.cos(target.x) * target.r;
    const y2 = Math.sin(target.x) * target.r;
    const x3 = 0;
    const y3 = 0;
    const path = d3.path();
    path.moveTo(x2, y2);
    path.lineTo(x3, y3);
    return (
      <g>
        <path
          d={path.toString()}
          stroke="#888"
          fill="none"
          style={{ transition: "d 1s" }}
        />
      </g>
    );
  }

  const x2 = Math.cos(target.x) * target.r;
  const y2 = Math.sin(target.x) * target.r;
  const x3 = Math.cos(target.x) * source.r;
  const y3 = Math.sin(target.x) * source.r;
  const path = d3.path();
  path.moveTo(x2, y2);
  path.lineTo(x3, y3);
  path.arc(
    0,
    0,
    source.r,
    target.x,
    source.x,
    Math.floor((source.x - target.x + 2 * Math.PI) / Math.PI) % 2 === 1
  );
  return (
    <g>
      <path
        d={path.toString()}
        stroke="#888"
        fill="none"
        style={{ transition: "d 1s" }}
      ></path>
    </g>
  );
}
