import * as d3 from "d3";

export default function Link({ source, target }) {
  const x2 = Math.cos(target.t) * target.r;
  const y2 = Math.sin(target.t) * target.r;
  const x3 = Math.cos(target.t) * source.r;
  const y3 = Math.sin(target.t) * source.r;
  const path = d3.path();
  path.moveTo(x2, y2);
  path.lineTo(x3, y3);
  path.arc(
    0,
    0,
    source.r,
    target.t,
    source.t,
    Math.floor((source.t - target.t + 2 * Math.PI) / Math.PI) % 2 === 1
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
