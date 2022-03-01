export default function Leaf({ item }) {
  const x = Math.cos(item.t) * item.r;
  const y = Math.sin(item.t) * item.r;
  return (
    <g key={item.data.data.no} className="is-clickable">
      <text
        x={x}
        y={y}
        textAnchor={x >= 0 ? "start" : "end"}
        dominantBaseline={y >= 0 ? "text-before-edge" : "text-after-edge"}
        fontSize={10}
      >
        {item.data.data["Title"]}
      </text>
    </g>
  );
}
