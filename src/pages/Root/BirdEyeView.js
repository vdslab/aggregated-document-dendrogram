import * as d3 from "d3";
import { layoutDendrogram } from "./layoutDendrogram";
import Link from "./Link";

export default function BirdEyeView({
  originalRoot,
  root,
  distanceThreshold,
  radius,
}) {
  layoutDendrogram({
    root: originalRoot,
    distanceThreshold: 0,
    radius,
  });
  const maxDistance = originalRoot.data.data.distance;
  const thresholdR = ((maxDistance - distanceThreshold) / maxDistance) * radius;
  const scale = d3
    .scalePow()
    .domain([0, radius])
    .range([0, radius])
    .exponent(2);
  for (const node of originalRoot) {
    node.r = scale(node.r);
  }
  return (
    <>
      <rect
        x="0"
        y="0"
        width={radius * 2}
        height={radius * 2}
        fill="white"
        fillOpacity="0.5"
        stroke="#888"
      />
      <g transform={`translate(${radius},${radius})`}>
        <g>
          {originalRoot.links().map(({ source, target }) => {
            return (
              <Link
                key={`${source.data.id}:${target.data.id}`}
                source={source}
                target={target}
                opacity={
                  source
                    .ancestors()
                    .some((node) => node.data.id === root.data.id)
                    ? 1
                    : 0.1
                }
              />
            );
          })}
        </g>
        <circle
          r={thresholdR}
          fill="none"
          stroke="#d00"
          strokeWidth="3"
          opacity="0.8"
        />
      </g>
    </>
  );
}
