export default function Leaf({ item }) {
  const x = Math.cos(item.x) * item.r;
  const y = Math.sin(item.x) * item.r;
  return (
    <g key={item.data.data.no} style={{ cursor: "pointer" }}>
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
